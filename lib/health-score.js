/**
 * Subsnub Health Score Calculator
 * Shared between client (Critic page) and server (daily snapshot).
 *
 * Total: 100 points across 5 domains:
 *   Categorisation: 50 (coverage 25, subcategory 15, hygiene 10)
 *   Channel Health:  20
 *   Feed Health:     10
 *   Stash Health:    10
 *   Data Freshness:  10
 */

/**
 * @param {Object} input
 * @param {number} input.totalChannels
 * @param {number} input.categorisedChannels
 * @param {number} input.subcategorisedChannels
 * @param {number} input.eligibleForSubcategory
 * @param {number} input.activeChannels
 * @param {number} input.deadChannels
 * @param {number} input.inactiveChannels
 * @param {boolean} input.hasEmptyCategories
 * @param {number} input.maxCategoryPercentage - highest % any single category represents
 * @param {boolean} input.feedDominanceExceeded - any category > 70% of weekly feed
 * @param {number} input.feedCategoryRatio - categories_in_feed / total_categories
 * @param {boolean} input.hasSufficientFeedData
 * @param {number} input.totalWatchLaterItems
 * @param {number} input.staleWatchLaterItems
 * @param {boolean} input.hasEmptyCollections
 * @param {boolean} input.hasStaleCollections
 * @param {boolean} input.hasUsedStash
 * @param {number|null} input.watchDataAgeDays - null = never uploaded
 * @param {string} userName
 * @param {number} needAttentionCount - deduplicated count of channels needing attention
 * @returns {Object} HealthScoreResult
 */
export function calculateHealthScore(input, userName, needAttentionCount) {
  // 1. Category coverage (25 points)
  const categoryCoverage = input.totalChannels === 0
    ? 25
    : 25 * (input.categorisedChannels / input.totalChannels);

  // 2. Subcategory coverage (15 points)
  // If no channels are categorised, subcategory score is 0 (not a free pass)
  const subcategoryCoverage = input.categorisedChannels === 0
    ? 0
    : input.eligibleForSubcategory === 0
    ? 15
    : 15 * (input.subcategorisedChannels / input.eligibleForSubcategory);

  // 3. Category hygiene (10 points)
  let categoryHygiene = 10;
  if (input.hasEmptyCategories) categoryHygiene -= 5;
  if (input.maxCategoryPercentage > 40) categoryHygiene -= 5;

  // 4. Channel health (20 points)
  const channelHealth = input.totalChannels === 0
    ? 20
    : 20 * (input.activeChannels / input.totalChannels);

  // 5. Feed health (10 points)
  let feedHealth = 10;
  if (input.hasSufficientFeedData && input.totalChannels > 1) {
    if (input.feedDominanceExceeded) feedHealth -= 5;
    if (input.feedCategoryRatio < 0.5) feedHealth -= 5;
  }

  // 6. Stash health (10 points)
  let stashHealth = 10;
  if (input.hasUsedStash) {
    let watchLaterScore = 5;
    if (input.totalWatchLaterItems > 0) {
      const staleRatio = input.staleWatchLaterItems / input.totalWatchLaterItems;
      watchLaterScore = 5 * (1 - staleRatio);
    }
    let collectionScore = 5;
    if (input.hasEmptyCollections) collectionScore -= 2.5;
    if (input.hasStaleCollections) collectionScore -= 2.5;
    stashHealth = watchLaterScore + collectionScore;
  }

  // 7. Data freshness (10 points)
  let dataFreshness = 0;
  if (input.watchDataAgeDays === null) {
    dataFreshness = 0;
  } else if (input.watchDataAgeDays < 7) {
    dataFreshness = 10;
  } else if (input.watchDataAgeDays < 14) {
    dataFreshness = 7;
  } else if (input.watchDataAgeDays < 30) {
    dataFreshness = 3;
  }

  const total = Math.round(
    Math.min(100, Math.max(0,
      categoryCoverage + subcategoryCoverage + categoryHygiene +
      channelHealth + feedHealth + stashHealth + dataFreshness
    ))
  );

  // Mood + copy
  const mood = total >= 70 ? 'green' : 'orange';

  let title, quote;
  if (total >= 95) {
    title = `Impeccable, ${userName}.`;
    quote = "Nothing to complain about. I'm almost disappointed.";
  } else if (total >= 85) {
    title = `Looking good, ${userName}.`;
    quote = `${total} out of 100. A few things to tidy, but nothing I'd lose sleep over.`;
  } else if (total >= 70) {
    title = `Not bad, ${userName}.`;
    quote = "Room for improvement, but you're ahead of most. Let's clean up.";
  } else if (total >= 50) {
    title = `We need to talk, ${userName}.`;
    quote = `Your subscriptions need attention. I've got ${needAttentionCount} things to go through.`;
  } else {
    title = `Where do I start, ${userName}.`;
    quote = "This is going to take a minute. Let's work through it together.";
  }

  return {
    total,
    categoryCoverage: Math.round(categoryCoverage * 10) / 10,
    subcategoryCoverage: Math.round(subcategoryCoverage * 10) / 10,
    categoryHygiene: Math.round(categoryHygiene * 10) / 10,
    channelHealth: Math.round(channelHealth * 10) / 10,
    feedHealth: Math.round(feedHealth * 10) / 10,
    stashHealth: Math.round(stashHealth * 10) / 10,
    dataFreshness: Math.round(dataFreshness * 10) / 10,
    mood,
    title,
    quote,
    counts: {
      totalChannels: input.totalChannels,
      categorisedChannels: input.categorisedChannels,
      subcategorisedChannels: input.subcategorisedChannels,
      activeChannels: input.activeChannels,
      deadChannels: input.deadChannels,
      inactiveChannels: input.inactiveChannels,
      needAttention: needAttentionCount,
    },
  };
}

/**
 * Build the health score input from channel data available in the client context.
 */
export function buildHealthScoreInput(channels, categories, subcategories, chIsUncategorised, getChannelState, feedVideos, stashItems, stashCollections) {
  const totalChannels = channels.length;
  const categorisedChannels = channels.filter(c => !chIsUncategorised(c)).length;

  // Subcategory eligibility: channels in categories that have pre-defined subcategories
  const catsWithSubs = new Set(Object.keys(subcategories || {}).filter(k => (subcategories[k] || []).length > 0));
  const eligibleChannels = channels.filter(c => (c.categories || []).some(cat => catsWithSubs.has(cat)));
  const subcategorisedChannels = eligibleChannels.filter(c => c.subcategory).length;

  // Channel states
  const activeChannels = channels.filter(c => getChannelState(c) === 'active').length;
  const deadChannels = channels.filter(c => getChannelState(c) === 'dead').length;
  const inactiveChannels = channels.filter(c => getChannelState(c) === 'inactive').length;

  // Category hygiene
  const hasEmptyCategories = categories.some(cat => !channels.some(c => (c.categories || []).includes(cat)));
  const catCounts = {};
  channels.forEach(c => (c.categories || []).forEach(cat => { catCounts[cat] = (catCounts[cat] || 0) + 1; }));
  const maxCategoryPercentage = totalChannels > 0
    ? Math.max(0, ...Object.values(catCounts).map(n => (n / totalChannels) * 100))
    : 0;

  // Feed health
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const weeklyFeed = (feedVideos || []).filter(v => v.publishedAt && new Date(v.publishedAt).getTime() >= weekAgo);
  const hasSufficientFeedData = weeklyFeed.length >= 5;
  let feedDominanceExceeded = false;
  let feedCategoryRatio = 1;
  if (hasSufficientFeedData && categories.length > 1) {
    const feedCatCounts = {};
    weeklyFeed.forEach(v => {
      const ch = channels.find(c => c.channelId === v.channelId);
      if (ch) (ch.categories || []).forEach(cat => { feedCatCounts[cat] = (feedCatCounts[cat] || 0) + 1; });
    });
    const maxFeedCat = Math.max(0, ...Object.values(feedCatCounts));
    feedDominanceExceeded = weeklyFeed.length > 0 && (maxFeedCat / weeklyFeed.length) > 0.7;
    const nonEmptyCats = categories.filter(cat => catCounts[cat] > 0);
    feedCategoryRatio = nonEmptyCats.length > 0 ? Object.keys(feedCatCounts).length / nonEmptyCats.length : 1;
  }

  // Stash health
  const items = stashItems || [];
  const collections = stashCollections || [];
  const hasUsedStash = items.length > 0 || collections.length > 0;
  const staleThreshold = 30 * 24 * 60 * 60 * 1000;
  const staleItems = items.filter(i => i.saved_at && (now - new Date(i.saved_at).getTime()) > staleThreshold && !i.watched);
  const hasEmptyCollections = collections.some(c => !items.some(i => i.collection_id === c.id));
  const collectionStaleThreshold = 60 * 24 * 60 * 60 * 1000;
  const hasStaleCollections = collections.some(c => {
    if (c.collection_type === 'curated') return false;
    const colItems = items.filter(i => i.collection_id === c.id);
    if (!colItems.length) return false;
    const newest = Math.max(...colItems.map(i => new Date(i.saved_at).getTime()));
    return (now - newest) > collectionStaleThreshold;
  });

  // Data freshness
  let watchDataAgeDays = null;
  if (typeof window !== 'undefined') {
    try {
      const wh = JSON.parse(localStorage.getItem('subsort_watchhistory'));
      if (wh?.dateRange?.to) {
        watchDataAgeDays = Math.floor((now - new Date(wh.dateRange.to).getTime()) / (24 * 60 * 60 * 1000));
      }
    } catch {}
  }

  // Need attention (deduplicated)
  const flagged = new Set();
  channels.forEach(c => {
    if (chIsUncategorised(c)) flagged.add(c.id);
    if (getChannelState(c) === 'dead') flagged.add(c.id);
    if (getChannelState(c) === 'inactive') flagged.add(c.id);
    if (c.favourited && getChannelState(c) !== 'active') flagged.add(c.id);
  });

  return {
    input: {
      totalChannels,
      categorisedChannels,
      subcategorisedChannels,
      eligibleForSubcategory: eligibleChannels.length,
      activeChannels,
      deadChannels,
      inactiveChannels,
      hasEmptyCategories,
      maxCategoryPercentage,
      feedDominanceExceeded,
      feedCategoryRatio,
      hasSufficientFeedData,
      totalWatchLaterItems: items.length,
      staleWatchLaterItems: staleItems.length,
      hasEmptyCollections,
      hasStaleCollections,
      hasUsedStash,
      watchDataAgeDays,
    },
    needAttentionCount: flagged.size,
  };
}

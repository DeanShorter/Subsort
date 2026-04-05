'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { ChannelDataContext } from './ChannelDataContext';
import { trackEvent } from '../../lib/track';

// Fixed colours for default auto-sort categories — not user-editable
const DEFAULT_CAT_COLOURS = {
  'News & Politics': '#EF9F27',
  'Music': '#3ECFA0',
  'Technology': '#378ADD',
  'Science & Education': '#5DCAA5',
  'Entertainment': '#E85D50',
  'Sports': '#E8875C',
  'Lifestyle': '#D4537E',
  'Film & TV': '#E85D50',
  'Hobbies & DIY': '#85B7EB',
  'Health & Fitness': '#97C459',
  'Food & Cooking': '#E6A065',
  'Pets & Animals': '#7DC88B',
  'Travel': '#6BC5B8',
  'Religion & Spirituality': '#B07CED',
  'Gaming': '#B07CED',
};

// Fallback palette for custom categories
const TILE_COLOURS = [
  '#e8837c','#e6a065','#d4c06a','#7dc88b','#6bc5b8',
  '#6aadcf','#7b8fd4','#a67dc8','#d47ba8','#c2957a',
  '#8bb8a0','#a0b8d4','#d4a0b8','#b8d4a0','#d4b8a0',
  '#7caae8','#c87c9a','#9ac87c','#c8a87c','#7cc8c8',
];

export function ChannelDataProvider({ children, user }) {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [categoryColours, setCategoryColours] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubcategories, setDbSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedVideos, setFeedVideos] = useState([]);
  const [feedVideosLoaded, setFeedVideosLoaded] = useState(false);
  const loadedRef = useRef(false);

  // ── Helpers (stable references) ──────────────────────────
  const chCats = useCallback((ch) => ch?.categories || [], []);
  const chHasCat = useCallback((ch, cat) => (ch?.categories || []).includes(cat), []);
  const chIsUncategorised = useCallback((ch) => !(ch?.categories?.length), []);

  const formatCount = useCallback((n) => {
    if (n == null) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return n.toLocaleString();
  }, []);

  const toggleFavourite = useCallback(async (channelId) => {
    const ch = channels.find(c => c.id === channelId);
    if (!ch) return;
    const newVal = !ch.favourited;
    // Optimistic update
    ch.favourited = newVal;
    setChannels([...channels]);
    // Persist to DB (both legacy and new tables)
    try {
      await supabase.from('channels').update({ favourited: newVal }).eq('id', channelId);
      if (ch.channelId) {
        await supabase.from('user_channels').update({ favourited: newVal }).eq('youtube_channel_id', ch.channelId).eq('user_id', user?.id);
      }
      trackEvent(newVal ? 'channel_favourited' : 'channel_unfavourited', { channel_id: channelId });
    } catch (e) {
      console.error('[ChannelData] Toggle favourite failed:', e);
      ch.favourited = !newVal;
      setChannels([...channels]);
    }
  }, [channels]);

  const getChannelState = useCallback((ch) => {
    if (ch.videoCount === 0) return 'dead';
    if (ch.subscriberCount < 100 && ch.videoCount < 5) return 'dead';
    // Inactive: no uploads in 6+ months (check channelCreatedAt vs videoCount ratio as proxy)
    if (ch.subscriberCount > 0 && ch.subscriberCount < 100 && ch.videoCount < 10) return 'inactive';
    return 'active';
  }, []);

  const findDeadChannels = useCallback(() => {
    const dead = [];
    for (const ch of channels) {
      if (ch.subscriberCount < 100 && ch.videoCount < 5) {
        dead.push({ ch, reason: 'Very small channel', severity: 'low' });
      } else if (ch.videoCount === 0) {
        dead.push({ ch, reason: 'No videos', severity: 'high' });
      } else if (ch.subscriberCount > 0 && ch.subscriberCount < 500) {
        dead.push({ ch, reason: 'Low subscriber count', severity: 'low' });
      }
    }
    return dead.sort((a, b) => (a.ch.subscriberCount || 0) - (b.ch.subscriberCount || 0));
  }, [channels]);

  // ── Build colour map ─────────────────────────────────────
  const buildColourMap = useCallback((cats, dbCats, existing) => {
    const map = { ...existing };
    let idx = 0;
    // 1. Default category colours (fixed, not user-editable)
    Object.entries(DEFAULT_CAT_COLOURS).forEach(([name, col]) => { map[name] = col; });
    // 2. DB colours for custom categories (user-editable)
    dbCats.forEach(c => { if (c.colour && !DEFAULT_CAT_COLOURS[c.name]) map[c.name] = c.colour; });
    // 3. Fill remaining custom categories with fallback palette
    cats.forEach(c => {
      if (!map[c]) { map[c] = TILE_COLOURS[idx % TILE_COLOURS.length]; idx++; }
    });
    return map;
  }, []);

  // ── Load all user data from Supabase ─────────────────────
  const loadUserData = useCallback(async (opts) => {
    if (!user) return;
    if (!opts?.silent) setLoading(true);

    try {
      // Categories
      const { data: catRows } = await supabase
        .from('categories').select('*').order('sort_order');
      const cats = catRows || [];
      setDbCategories(cats);
      const catNames = cats.map(c => c.name);
      setCategories(catNames);

      // Subcategories
      const { data: subRows } = await supabase
        .from('subcategories').select('*').order('sort_order');
      const subs = subRows || [];
      setDbSubcategories(subs);
      const subMap = {};
      subs.forEach(s => {
        const catRow = cats.find(c => c.id === s.category_id);
        if (catRow) {
          if (!subMap[catRow.name]) subMap[catRow.name] = [];
          subMap[catRow.name].push(s.name);
        }
      });
      setSubcategories(subMap);

      // Load from new tables (user_channels + shared_channels)
      const { data: ucRows } = await supabase.from('user_channels').select('*');
      const { data: scRows } = await supabase.from('shared_channels').select('*');

      // Build shared channel lookup
      const sharedMap = {};
      (scRows || []).forEach(sc => { sharedMap[sc.youtube_channel_id] = sc; });

      // Fallback: if current user has no rows in user_channels, use legacy channels table
      let chRows;
      let useLegacy = false;
      if (!ucRows?.length) {
        const { data: legacyRows } = await supabase.from('channels').select('*');
        chRows = legacyRows;
        useLegacy = true;
      }

      // Channel→category assignments
      const { data: ccRows } = await supabase
        .from('channel_categories').select('channel_id, category_id, youtube_channel_id');
      const ccMap = {}; // keyed by legacy channel id
      const ccMapYt = {}; // keyed by youtube_channel_id
      (ccRows || []).forEach(cc => {
        // Legacy mapping
        if (cc.channel_id) {
          if (!ccMap[cc.channel_id]) ccMap[cc.channel_id] = [];
          const cat = cats.find(c => c.id === cc.category_id);
          if (cat && !ccMap[cc.channel_id].includes(cat.name)) ccMap[cc.channel_id].push(cat.name);
        }
        // New mapping
        if (cc.youtube_channel_id) {
          if (!ccMapYt[cc.youtube_channel_id]) ccMapYt[cc.youtube_channel_id] = [];
          const cat = cats.find(c => c.id === cc.category_id);
          if (cat && !ccMapYt[cc.youtube_channel_id].includes(cat.name)) ccMapYt[cc.youtube_channel_id].push(cat.name);
        }
      });

      let mappedChannels;
      if (useLegacy) {
        // Legacy path
        mappedChannels = (chRows || []).map(ch => ({
          id: ch.id,
          channelId: ch.channel_id,
          name: ch.name,
          customUrl: ch.custom_url || '',
          thumbnail: ch.thumbnail || '',
          thumbnailHigh: ch.thumbnail_high || '',
          bannerUrl: ch.banner_url || '',
          description: ch.description || '',
          subscriberCount: ch.subscriber_count || 0,
          videoCount: ch.video_count || 0,
          viewCount: ch.view_count || 0,
          subscribedAt: ch.subscribed_at || '',
          channelCreatedAt: ch.channel_created_at || '',
          uploadsPlaylistId: ch.uploads_playlist_id || '',
          topics: ch.topics || [],
          topicUrls: ch.topic_urls || [],
          topicIds: ch.topic_ids || [],
          keywords: ch.keywords || '',
          country: ch.country || '',
          notes: ch.notes || '',
          favourited: ch.favourited || false,
          subcategory: subs.find(s => s.id === ch.subcategory_id)?.name || '',
          categories: ccMap[ch.id] || [],
          channelUrl: `https://www.youtube.com/channel/${ch.channel_id}`,
        }));
      } else {
        // New path: join user_channels + shared_channels
        mappedChannels = (ucRows || []).map(uc => {
          const sc = sharedMap[uc.youtube_channel_id] || {};
          return {
            id: uc.id,
            channelId: uc.youtube_channel_id,
            name: sc.title || '',
            customUrl: sc.custom_url || '',
            thumbnail: sc.thumbnail_url || '',
            thumbnailHigh: sc.thumbnail_high_url || '',
            bannerUrl: sc.banner_url || '',
            description: sc.description || '',
            subscriberCount: sc.subscriber_count || 0,
            videoCount: sc.video_count || 0,
            viewCount: sc.view_count || 0,
            subscribedAt: uc.subscribed_at || '',
            channelCreatedAt: sc.channel_created_at || '',
            uploadsPlaylistId: sc.uploads_playlist_id || '',
            topics: sc.topics || [],
            topicUrls: sc.topic_urls || [],
            topicIds: sc.topic_ids || [],
            keywords: sc.keywords || '',
            country: sc.country || '',
            notes: uc.notes || '',
            favourited: uc.favourited || false,
            subcategory: subs.find(s => s.id === uc.subcategory_id)?.name || '',
            categories: ccMapYt[uc.youtube_channel_id] || ccMap[uc.id] || [],
            channelUrl: `https://www.youtube.com/channel/${uc.youtube_channel_id}`,
          };
        });
      }

      setChannels(mappedChannels);

      // Build colour map
      const colours = buildColourMap(catNames, cats, {});
      setCategoryColours(colours);

      // Cache to localStorage for fast initial render
      localStorage.setItem('subsort_channels', JSON.stringify(mappedChannels));
      localStorage.setItem('subsort_categories', JSON.stringify(catNames));
      localStorage.setItem('subsort_subcategories', JSON.stringify(subMap));
    } catch (e) {
      console.error('[ChannelData] Failed to load:', e);
    } finally {
      setLoading(false);
    }
  }, [user, buildColourMap]);

  // Load cached data immediately on mount (before auth resolves)
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem('subsort_channels') || '[]');
      if (cached.length) setChannels(cached);
      const cachedCats = JSON.parse(localStorage.getItem('subsort_categories') || '[]');
      if (cachedCats.length) setCategories(cachedCats);
      const cachedSubs = JSON.parse(localStorage.getItem('subsort_subcategories') || '{}');
      if (Object.keys(cachedSubs).length) setSubcategories(cachedSubs);
      // If we have cached data, stop showing the loading spinner
      if (cached.length) setLoading(false);
    } catch (e) {}
  }, []);

  // Fetch fresh data from Supabase once user is authenticated
  useEffect(() => {
    if (!user) {
      // No user yet — if no cached data either, stop loading
      if (!channels.length) setLoading(false);
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadUserData();
  }, [user, loadUserData, channels.length]);

  return (
    <ChannelDataContext.Provider value={{
      channels, categories, subcategories, categoryColours,
      dbCategories, dbSubcategories, loading,
      reload: () => loadUserData({ silent: true }),
      chCats, chHasCat, chIsUncategorised, formatCount, findDeadChannels, toggleFavourite, getChannelState,
      feedVideos, feedVideosLoaded,
      setFeedVideos: (vids) => { setFeedVideos(vids); setFeedVideosLoaded(true); },
    }}>
      {children}
    </ChannelDataContext.Provider>
  );
}

import { getChannelCap } from './cap';

/**
 * Activate channels up to the dynamic cap for a free-tier user.
 * Pro users get all channels active.
 */
export async function activateChannelsForFreeTier(supabase, userId) {
  // Check plan
  const { data: plan } = await supabase
    .from('user_plans')
    .select('plan, status, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  const isPro = plan && plan.plan !== 'free' && plan.status === 'active' &&
    (!plan.expires_at || new Date(plan.expires_at) > new Date());

  if (isPro) {
    await supabase.from('user_channels').update({ is_active: true }).eq('user_id', userId);
    await supabase.from('channels').update({ is_active: true }).eq('user_id', userId);
    return { limited: false };
  }

  // Count total
  const { count } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const cap = getChannelCap(count || 0);

  if (!count || count <= cap) {
    // Under the cap — all active
    return { limited: false, total: count };
  }

  // Deactivate all
  await supabase.from('channels').update({ is_active: false }).eq('user_id', userId);
  await supabase.from('user_channels').update({ is_active: false }).eq('user_id', userId);

  // Activate top N by most recent subscription date (legacy table)
  const { data: topChannels } = await supabase
    .from('channels')
    .select('id, channel_id')
    .eq('user_id', userId)
    .order('subscribed_at', { ascending: false })
    .limit(cap);

  if (topChannels?.length) {
    const ids = topChannels.map(c => c.id);
    const ytIds = topChannels.map(c => c.channel_id);
    await supabase.from('channels').update({ is_active: true }).in('id', ids);
    await supabase.from('user_channels').update({ is_active: true }).in('youtube_channel_id', ytIds).eq('user_id', userId);
  }

  return { limited: true, total: count, active: cap, locked: count - cap };
}

/**
 * Handle upgrade — activate all channels.
 */
export async function handleUpgrade(supabase, userId) {
  await supabase.from('user_channels').update({ is_active: true }).eq('user_id', userId);
  await supabase.from('channels').update({ is_active: true }).eq('user_id', userId);
}

/**
 * Handle downgrade — keep top channels by interaction recency, using dynamic cap.
 */
export async function handleDowngrade(supabase, userId) {
  // Count total to calculate dynamic cap
  const { count } = await supabase
    .from('channels')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  const cap = getChannelCap(count || 0);

  const { data: topChannels } = await supabase
    .from('channels')
    .select('id, channel_id')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(cap);

  await supabase.from('channels').update({ is_active: false }).eq('user_id', userId);
  await supabase.from('user_channels').update({ is_active: false }).eq('user_id', userId);

  if (topChannels?.length) {
    const ids = topChannels.map(c => c.id);
    const ytIds = topChannels.map(c => c.channel_id);
    await supabase.from('channels').update({ is_active: true }).in('id', ids);
    await supabase.from('user_channels').update({ is_active: true }).in('youtube_channel_id', ytIds).eq('user_id', userId);
  }
}

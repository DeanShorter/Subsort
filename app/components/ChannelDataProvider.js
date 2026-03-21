'use client';
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';

const TILE_COLOURS = [
  '#e8837c','#e6a065','#d4c06a','#7dc88b','#6bc5b8',
  '#6aadcf','#7b8fd4','#a67dc8','#d47ba8','#c2957a',
  '#8bb8a0','#a0b8d4','#d4a0b8','#b8d4a0','#d4b8a0',
  '#7caae8','#c87c9a','#9ac87c','#c8a87c','#7cc8c8',
];

const ChannelDataContext = createContext({
  channels: [],
  categories: [],
  subcategories: {},
  categoryColours: {},
  dbCategories: [],
  dbSubcategories: [],
  loading: true,
  reload: () => {},
  // Helpers
  chCats: () => [],
  chHasCat: () => false,
  chIsUncategorised: () => true,
  formatCount: () => '—',
  findDeadChannels: () => [],
});

export function ChannelDataProvider({ children, user }) {
  const [channels, setChannels] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [categoryColours, setCategoryColours] = useState({});
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubcategories, setDbSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
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
    // First load DB colours
    dbCats.forEach(c => { if (c.colour) map[c.name] = c.colour; });
    // Fill in missing with TILE_COLOURS rotation
    cats.forEach(c => {
      if (!map[c]) map[c] = TILE_COLOURS[idx % TILE_COLOURS.length];
      idx++;
    });
    return map;
  }, []);

  // ── Load all user data from Supabase ─────────────────────
  const loadUserData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

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

      // Channels
      const { data: chRows } = await supabase.from('channels').select('*');

      // Channel→category assignments
      const { data: ccRows } = await supabase
        .from('channel_categories').select('channel_id, category_id');
      const ccMap = {};
      (ccRows || []).forEach(cc => {
        if (!ccMap[cc.channel_id]) ccMap[cc.channel_id] = [];
        const cat = cats.find(c => c.id === cc.category_id);
        if (cat) ccMap[cc.channel_id].push(cat.name);
      });

      const mappedChannels = (chRows || []).map(ch => ({
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
        keywords: ch.keywords || '',
        country: ch.country || '',
        notes: ch.notes || '',
        favourited: ch.favourited || false,
        subcategory: subs.find(s => s.id === ch.subcategory_id)?.name || '',
        categories: ccMap[ch.id] || [],
        channelUrl: `https://www.youtube.com/channel/${ch.channel_id}`,
      }));

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

  // Load on auth
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Load cached data immediately for fast first paint
    try {
      const cached = JSON.parse(localStorage.getItem('subsort_channels') || '[]');
      if (cached.length) setChannels(cached);
      const cachedCats = JSON.parse(localStorage.getItem('subsort_categories') || '[]');
      if (cachedCats.length) setCategories(cachedCats);
      const cachedSubs = JSON.parse(localStorage.getItem('subsort_subcategories') || '{}');
      if (Object.keys(cachedSubs).length) setSubcategories(cachedSubs);
    } catch (e) {}

    loadUserData();
  }, [user, loadUserData]);

  return (
    <ChannelDataContext.Provider value={{
      channels, categories, subcategories, categoryColours,
      dbCategories, dbSubcategories, loading,
      reload: loadUserData,
      chCats, chHasCat, chIsUncategorised, formatCount, findDeadChannels,
    }}>
      {children}
    </ChannelDataContext.Provider>
  );
}

export const useChannelData = () => useContext(ChannelDataContext);

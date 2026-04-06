'use client';
import { createContext, useContext } from 'react';

export const ChannelDataContext = createContext({
  channels: [],        // managed channels only (is_active = true) — use this by default
  allChannels: [],     // ALL channels including locked — only for Discover exclusion, page headers
  categories: [],
  subcategories: {},
  categoryColours: {},
  dbCategories: [],
  dbSubcategories: [],
  loading: true,
  reload: () => {},
  chCats: () => [],
  chHasCat: () => false,
  chIsUncategorised: () => true,
  formatCount: () => '—',
  findDeadChannels: () => [],
  toggleFavourite: () => {},
  getChannelState: () => 'active',
  feedVideos: [],
  feedVideosLoaded: false,
  setFeedVideos: () => {},
});

export const useChannelData = () => useContext(ChannelDataContext);

'use client';
import { createContext, useContext } from 'react';

export const ChannelDataContext = createContext({
  channels: [],
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
  feedVideos: [],
  feedVideosLoaded: false,
  setFeedVideos: () => {},
});

export const useChannelData = () => useContext(ChannelDataContext);

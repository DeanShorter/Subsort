'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../app/components/Toast';

export function useStash(user) {
  const [collections, setCollections] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load stash data
  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [colRes, itemRes] = await Promise.all([
        supabase.from('stash_collections').select('*').order('sort_order'),
        supabase.from('stash_items').select('*').order('saved_at', { ascending: false }),
      ]);
      setCollections(colRes.data || []);
      setItems(itemRes.data || []);
    } catch (e) {
      console.error('[Stash] Load failed:', e);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  // Add video to stash (optionally to a specific collection)
  const addToStash = useCallback(async (video, collectionName) => {
    if (!user) return;

    let collectionId = null;
    if (collectionName) {
      // Find or create collection
      let col = collections.find(c => c.name === collectionName);
      if (!col) {
        const { data, error } = await supabase.from('stash_collections')
          .insert({ name: collectionName, user_id: user.id, sort_order: collections.length })
          .select()
          .single();
        if (error) { showToast('Failed to create collection'); return; }
        col = data;
        setCollections(prev => [...prev, col]);
      }
      collectionId = col.id;
    }

    const row = {
      user_id: user.id,
      video_id: video.id,
      title: video.title || '',
      channel_name: video.channel || '',
      channel_id: video.channelId || '',
      thumbnail: video.thumbnail || '',
      duration: video.duration || '',
      published_at: video.publishedAt || null,
      collection_id: collectionId,
    };

    const { error } = await supabase.from('stash_items')
      .upsert(row, { onConflict: 'user_id,video_id' });

    if (error) {
      console.error('[Stash] Save failed:', error);
      showToast('Failed to save video');
    } else {
      showToast(collectionName ? `Saved to ${collectionName}` : 'Added to Stash');
      load();
    }
  }, [user, collections, load]);

  // Remove from stash
  const removeFromStash = useCallback(async (videoId) => {
    if (!user) return;
    await supabase.from('stash_items').delete().eq('user_id', user.id).eq('video_id', videoId);
    setItems(prev => prev.filter(i => i.video_id !== videoId));
    showToast('Removed from Stash');
  }, [user]);

  // Move item to a collection
  const moveToCollection = useCallback(async (itemId, collectionId) => {
    await supabase.from('stash_items').update({ collection_id: collectionId }).eq('id', itemId);
    load();
  }, [load]);

  // Create collection
  const createCollection = useCallback(async (name) => {
    if (!user || !name.trim()) return null;
    const { data, error } = await supabase.from('stash_collections')
      .insert({ name: name.trim(), user_id: user.id, sort_order: collections.length })
      .select()
      .single();
    if (error) { showToast('Failed to create collection'); return null; }
    setCollections(prev => [...prev, data]);
    showToast(`Created: ${name}`);
    return data;
  }, [user, collections]);

  // Delete collection
  const deleteCollection = useCallback(async (id) => {
    await supabase.from('stash_items').update({ collection_id: null }).eq('collection_id', id);
    await supabase.from('stash_collections').delete().eq('id', id);
    load();
    showToast('Collection deleted');
  }, [load]);

  // Mark as watched
  const toggleWatched = useCallback(async (itemId, watched) => {
    await supabase.from('stash_items').update({ watched }).eq('id', itemId);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, watched } : i));
  }, []);

  return {
    collections, items, loading,
    addToStash, removeFromStash, moveToCollection,
    createCollection, deleteCollection, toggleWatched,
    reload: load,
  };
}

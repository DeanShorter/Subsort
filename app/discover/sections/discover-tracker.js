'use client';

import { useEffect } from 'react';
import { trackEvent } from '../../../lib/track';

export function DiscoverTracker() {
  useEffect(() => {
    trackEvent('discover_viewed', {});
  }, []);
  return null;
}

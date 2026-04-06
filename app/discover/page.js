import { Suspense } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ForYouSection } from './sections/for-you-section';
import { CategoryGrid } from './sections/category-grid';
import { CollectionsSection } from './sections/collections-section';
import { CategorySkeleton } from './sections/skeletons/category-skeleton';
import { CollectionsSkeleton } from './sections/skeletons/collections-skeleton';
import { DiscoverTracker } from './sections/discover-tracker';

export const dynamic = 'force-dynamic';

export default function DiscoverPage() {
  return (
    <div className="dsc-page">
      <DiscoverTracker />

      {/* Header */}
      <div className="dsc-header">
        <h1 className="dsc-title">Discover</h1>
      </div>

      <div className="dsc-content-top">
        {/* For You — client component, handles its own auth + loading */}
        <ErrorBoundary fallback={null}>
          <ForYouSection />
        </ErrorBoundary>

        {/* Browse by Category — async server component, streams when ready */}
        <ErrorBoundary fallback={null}>
          <Suspense fallback={<CategorySkeleton />}>
            <CategoryGrid />
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Collections — async server component, streams when ready */}
      <div className="collections-wrapper">
        <ErrorBoundary fallback={null}>
          <Suspense fallback={<CollectionsSkeleton />}>
            <CollectionsSection />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

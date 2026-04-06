import { getFeaturedCollections } from '../lib/get-collections';
import { CollectionsSectionClient } from './collections-section-client';

export async function CollectionsSection() {
  const collections = await getFeaturedCollections();
  return <CollectionsSectionClient collections={collections} />;
}

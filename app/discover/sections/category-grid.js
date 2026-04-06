import { getCategoriesWithCounts } from '../lib/get-categories';
import { CategoryGridClient } from './category-grid-client';

export async function CategoryGrid() {
  const categories = await getCategoriesWithCounts();

  if (!categories.length) return null;

  return <CategoryGridClient categories={categories} />;
}

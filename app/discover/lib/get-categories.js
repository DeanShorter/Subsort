import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function getCategoriesWithCounts() {
  const supabase = getServiceClient();

  const { data: catAssignments } = await supabase
    .from('channel_categories')
    .select('category_id, categories!inner(id, name)');

  const catCounts = {};
  (catAssignments || []).forEach(a => {
    const name = a.categories?.name;
    if (!name) return;
    if (!catCounts[name]) catCounts[name] = { id: a.categories.id, name, count: 0 };
    catCounts[name].count++;
  });

  return Object.values(catCounts)
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

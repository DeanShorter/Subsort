import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { autoCategoriseAll, persistAutoSort } from '../../../lib/auto-categorise';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function POST(req) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser(authHeader.slice(7));
    if (authErr || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch user's channels
    const { data: chRows } = await supabase
      .from('channels')
      .select('*')
      .eq('user_id', user.id);

    if (!chRows?.length) {
      return NextResponse.json({ error: 'No channels found', assigned: 0 });
    }

    const channels = chRows.map(ch => ({
      id: ch.id,
      channelId: ch.channel_id,
      name: ch.name,
      description: ch.description || '',
      keywords: ch.keywords || '',
      topics: ch.topics || [],
      topicUrls: ch.topic_urls || [],
      topicIds: ch.topic_ids || [],
      categories: [],
    }));

    // Fetch existing categories for this user
    const { data: dbCategories } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id);

    // Check which channels already have categories
    const { data: existingCats } = await supabase
      .from('channel_categories')
      .select('channel_id')
      .eq('user_id', user.id);

    const categorisedIds = new Set((existingCats || []).map(c => c.channel_id));
    const isUncategorised = (ch) => !categorisedIds.has(ch.id);

    // Run auto-categorise
    console.log(`[AutoSort API] User ${user.id}: ${channels.length} channels, ${categorisedIds.size} already categorised`);
    const { assignments, assigned, unmatched } = autoCategoriseAll(channels, isUncategorised);
    console.log(`[AutoSort API] Result: ${assigned} assigned, ${unmatched.length} unmatched`);

    if (!assigned) {
      return NextResponse.json({ assigned: 0, unmatched: unmatched.length, catNames: [] });
    }

    // Persist using service role (bypasses RLS)
    console.log(`[AutoSort API] Persisting ${assigned} assignments for user ${user.id}`);
    const result = await persistAutoSort(supabase, user, assignments, dbCategories || []);
    console.log(`[AutoSort API] Persist result:`, JSON.stringify(result));

    // Build category breakdown
    const catCounts = {};
    assignments.forEach(a => { catCounts[a.category] = (catCounts[a.category] || 0) + 1; });
    const catNames = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      assigned,
      unmatched: unmatched.length,
      categoriesCreated: result.categoriesCreated,
      subcategoriesAssigned: result.subcategoriesAssigned,
      catNames,
    });
  } catch (e) {
    console.error('[AutoSort API] Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

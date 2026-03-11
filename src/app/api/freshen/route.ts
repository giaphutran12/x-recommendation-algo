import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: allIds, error: fetchErr } = await supabase
    .from('tweets')
    .select('id')
    .limit(5000);

  if (fetchErr || !allIds) {
    return NextResponse.json({ error: fetchErr?.message ?? 'No tweets found' }, { status: 500 });
  }

  for (let i = allIds.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
  }
  const shuffled = allIds.slice(0, 1000);
  const now = Date.now();
  const SEVEN_HOURS_MS = 7 * 60 * 60 * 1000;

  const BATCH = 50;
  let updated = 0;

  for (let i = 0; i < shuffled.length; i += BATCH) {
    const batch = shuffled.slice(i, i + BATCH);

    const promises = batch.map((row) => {
      const freshTimestamp = new Date(now - Math.random() * SEVEN_HOURS_MS).toISOString();

      return supabase
        .from('tweets')
        .update({ created_at: freshTimestamp })
        .eq('id', row.id);
    });

    const results = await Promise.all(promises);
    updated += results.filter((r) => !r.error).length;
  }

  console.log(`[FRESHEN] Updated ${updated} tweets with timestamps from last 7h`);

  return NextResponse.json({ updated, total: shuffled.length });
}

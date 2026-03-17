import { createClient } from '@supabase/supabase-js';
import { mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

declare const Bun: any;

const BATCH_SIZE = 5000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[EXPORT] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

async function fetchAll<T>(
  query: (from: number, to: number) => any,
): Promise<T[]> {
  const results: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await query(offset, offset + BATCH_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    results.push(...data);
    offset += BATCH_SIZE;
  }

  return results;
}

async function exportTables() {
  mkdirSync(DATA_DIR, { recursive: true });
  const supabase = createSupabaseClient();

  console.log('[EXPORT] Starting table exports...');

  console.log('[EXPORT] Exporting users...');
  const users = await fetchAll((from, to) =>
    supabase.from('users').select('*').range(from, to),
  );
  await Bun.write(
    join(DATA_DIR, 'users.json'),
    JSON.stringify(users, null, 2),
  );
  const usersSize = statSync(join(DATA_DIR, 'users.json')).size;
  console.log(`[EXPORT] Exported users: ${users.length} rows (${usersSize} bytes)`);

  console.log('[EXPORT] Exporting follows...');
  const follows = await fetchAll((from, to) =>
    supabase.from('follows').select('*').range(from, to),
  );
  await Bun.write(
    join(DATA_DIR, 'follows.json'),
    JSON.stringify(follows, null, 2),
  );
  const followsSize = statSync(join(DATA_DIR, 'follows.json')).size;
  console.log(`[EXPORT] Exported follows: ${follows.length} rows (${followsSize} bytes)`);

  console.log('[EXPORT] Exporting tweets...');
  const tweets = await fetchAll((from, to) =>
    supabase
      .from('tweets')
      .select(
        'id,author_id,content,tweet_type,parent_tweet_id,quoted_tweet_id,topic,like_count,reply_count,repost_count,click_count,created_at',
      )
      .range(from, to),
  );
  await Bun.write(
    join(DATA_DIR, 'tweets.json'),
    JSON.stringify(tweets, null, 2),
  );
  const tweetsSize = statSync(join(DATA_DIR, 'tweets.json')).size;
  console.log(`[EXPORT] Exported tweets: ${tweets.length} rows (${tweetsSize} bytes)`);

  console.log('[EXPORT] Exporting engagements...');
  const engagements = await fetchAll((from, to) =>
    supabase.from('engagements').select('*').range(from, to),
  );
  await Bun.write(
    join(DATA_DIR, 'engagements.json'),
    JSON.stringify(engagements, null, 2),
  );
  const engagementsSize = statSync(join(DATA_DIR, 'engagements.json')).size;
  console.log(`[EXPORT] Exported engagements: ${engagements.length} rows (${engagementsSize} bytes)`);

  console.log('[EXPORT] All tables exported successfully');
}

exportTables().catch((err) => {
  console.error('[EXPORT] Error:', err);
  process.exit(1);
});

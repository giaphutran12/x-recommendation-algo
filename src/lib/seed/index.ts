/**
 * Master seed script — orchestrates the full seeding pipeline.
 *
 * Usage:
 *   bun run src/lib/seed/index.ts
 *   bun run src/lib/seed/index.ts --dry-run
 *   bun run src/lib/seed/index.ts --skip-embeddings
 *
 * Steps:
 *   1. Clear existing data (except viewer user)
 *   2. Insert 200 persona users
 *   3. Generate & insert follow graph
 *   4. Load & insert 50K pre-generated tweets
 *   5. Generate Gemini embeddings (skippable)
 *   6. Simulate & insert engagements
 *   7. Update tweet counters
 *   8. Update follower/following counts
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

import { personas } from './personas';
import { generateFollowGraph } from './follow-graph';
import { loadGeneratedTweets } from './load-generated-tweets';
import { simulateEngagements } from './engagement-simulator';
import type { TweetType } from '../types/database';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_SIZE = 1000;
const EMBED_BATCH_SIZE = 100;

// ─── CLI Flags ────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SKIP_EMBEDDINGS = args.includes('--skip-embeddings');

// ─── Supabase Client (service role — bypasses RLS) ───────────────────────────

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      '[SEED] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Batch Insert Helper ──────────────────────────────────────────────────────

async function batchInsert<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: string,
  rows: T[],
  batchSize = BATCH_SIZE,
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      throw new Error(`[SEED] Failed to insert into ${table}: ${error.message}`);
    }
  }
}

// ─── Gemini Embedding Helper ──────────────────────────────────────────────────

async function embedTexts(
  texts: string[],
  genAI: GoogleGenerativeAI,
): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

  const batchResult = await model.batchEmbedContents({
    requests: texts.map((text) => ({
      content: { parts: [{ text }], role: 'user' },
      taskType: TaskType.SEMANTIC_SIMILARITY,
      outputDimensionality: 1536,
    })),
  });

  return batchResult.embeddings.map((e) => Array.from(e.values));
}

// ─── Main Seed Function ───────────────────────────────────────────────────────

export async function seed(): Promise<void> {
  const globalStart = performance.now();

  console.log('[SEED] Starting seed pipeline');
  if (DRY_RUN) {
    console.log('[SEED] DRY RUN — no database writes');
    console.log(
      `[SEED] Would insert: ${personas.length} users, ~50000 tweets, ~${Math.round(personas.length * 15)} follows, ~500000 engagements`,
    );
    return;
  }

  const supabase = createSupabaseClient();

  // ── Step 1: Clear existing data (except viewer) ──────────────────────────

  console.log('[SEED] Clearing existing data...');
  const clearStart = performance.now();

  async function clearTable(table: string, idCol: string, excludeId?: string) {
    let deleted = 0;
    for (let attempt = 0; attempt < 1000; attempt++) {
      const selectQuery = excludeId
        ? supabase.from(table).select(idCol).neq(idCol, excludeId).limit(500)
        : supabase.from(table).select(idCol).limit(500);
      const { data: rows, error: selErr } = await selectQuery;
      if (selErr) throw new Error(`[SEED] Failed to select from ${table}: ${selErr.message}`);
      if (!rows || rows.length === 0) break;

      const ids = rows.map((r) => (r as unknown as Record<string, string>)[idCol]);
      const { error: delErr } = await supabase.from(table).delete().in(idCol, ids);
      if (delErr) throw new Error(`[SEED] Failed to clear ${table}: ${delErr.message}`);
      deleted += ids.length;
      if (deleted % 5000 === 0) console.log(`[SEED] Cleared ${deleted} rows from ${table}...`);
    }
    if (deleted > 0) console.log(`[SEED] Cleared ${deleted} rows from ${table}`);
  }

  await clearTable('engagements', 'id');
  await clearTable('follows', 'follower_id');
  await clearTable('tweets', 'id');
  await clearTable('users', 'id', VIEWER_ID);

  console.log(
    `[SEED] Cleared existing data in ${Math.round(performance.now() - clearStart)}ms`,
  );

  // ── Step 2: Insert 200 persona users ─────────────────────────────────────

  console.log('[SEED] Inserting persona users...');
  const usersStart = performance.now();

  // Map username → UUID for later reference
  const usernameToId = new Map<string, string>();

  const INITIAL_FOLLOWER_COUNTS: Record<string, number> = {
    mega: 500000,
    macro: 50000,
    mid: 5000,
    micro: 500,
  };

  const userRows = personas.map((persona) => {
    const id = crypto.randomUUID();
    usernameToId.set(persona.username, id);

    return {
      id,
      username: persona.username,
      display_name: persona.name,
      bio: persona.bio,
      avatar_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${persona.username}`,
      persona_type: persona.persona_type,
      interests: persona.interests,
      writing_style: persona.writing_style,
      follower_count: INITIAL_FOLLOWER_COUNTS[persona.follower_tier] ?? 500,
      following_count: 0,
      created_at: new Date(
        Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    };
  });

  await batchInsert(supabase, 'users', userRows);

  console.log(
    `[SEED] Inserted ${userRows.length} persona users in ${Math.round(performance.now() - usersStart)}ms`,
  );

  // ── Step 3: Generate & insert follow graph ────────────────────────────────

  console.log('[SEED] Generating follow graph...');
  const followStart = performance.now();

  const followGraphResult = generateFollowGraph(personas, VIEWER_ID);

  // Convert username-based IDs to UUIDs
  // follow-graph.ts uses usernames for persona-to-persona and VIEWER_ID UUID for viewer
  const followRows = followGraphResult.follows.map((f) => {
    const followerId =
      f.follower_id === VIEWER_ID
        ? VIEWER_ID
        : (usernameToId.get(f.follower_id) ?? f.follower_id);

    const followingId =
      f.following_id === VIEWER_ID
        ? VIEWER_ID
        : (usernameToId.get(f.following_id) ?? f.following_id);

    return {
      follower_id: followerId,
      following_id: followingId,
      created_at: f.created_at.toISOString(),
    };
  });

  await batchInsert(supabase, 'follows', followRows);

  console.log(
    `[SEED] Inserted ${followRows.length} follow relationships in ${Math.round(performance.now() - followStart)}ms`,
  );

  // ── Step 4: Load & insert tweets ─────────────────────────────────────────

  console.log('[SEED] Loading pre-generated tweets...');
  const tweetsStart = performance.now();

  const generatedTweets = loadGeneratedTweets();

  // Build a map of username → array of tweet UUIDs for parent resolution
  const authorTweetIds = new Map<string, string[]>();

  // Map generated tweets to DB rows (first pass: assign IDs and base fields)
  const tweetIdMap = new Map<number, string>(); // index → UUID
  const tweetRowsWithRef = generatedTweets.map((gt, idx) => {
    const id = crypto.randomUUID();
    tweetIdMap.set(idx, id);

    const authorId = usernameToId.get(gt.persona_username);
    if (!authorId) return null; // skip if persona not found

    // Track tweet IDs per author for parent resolution
    const existing = authorTweetIds.get(gt.persona_username) ?? [];
    existing.push(id);
    authorTweetIds.set(gt.persona_username, existing);

    const createdAt = new Date(
      Date.now() - gt.created_at_offset_hours * 60 * 60 * 1000,
    ).toISOString();

    return {
      id,
      author_id: authorId,
      content: gt.content,
      tweet_type: gt.tweet_type as TweetType,
      topic: gt.topic,
      parent_ref: gt.parent_ref, // username — will be resolved in second pass
      parent_tweet_id: null as string | null,
      quoted_tweet_id: null as string | null,
      like_count: 0,
      reply_count: 0,
      repost_count: 0,
      click_count: 0,
      created_at: createdAt,
    };
  });

  const validTweetRows = tweetRowsWithRef
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const insertRows = validTweetRows.map((row) => {
    const { parent_ref: _ref, ...dbRow } = row;
    void _ref;
    return { ...dbRow, parent_tweet_id: null, quoted_tweet_id: null };
  });

  await batchInsert(supabase, 'tweets', insertRows);

  console.log(
    `[SEED] Inserted ${validTweetRows.length} tweets in ${Math.round(performance.now() - tweetsStart)}ms`,
  );

  // ── Step 5: Generate embeddings (unless --skip-embeddings) ───────────────

  if (!SKIP_EMBEDDINGS) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.warn('[SEED] GOOGLE_AI_API_KEY not set — skipping embeddings');
    } else {
      console.log('[SEED] Generating Gemini embeddings...');
      const embedStart = performance.now();
      const genAI = new GoogleGenerativeAI(apiKey);

      let embeddedCount = 0;

      for (let i = 0; i < validTweetRows.length; i += EMBED_BATCH_SIZE) {
        const batch = validTweetRows.slice(i, i + EMBED_BATCH_SIZE);
        const texts = batch.map((t) => t.content);
        const tweetIds = batch.map((t) => t.id);

        try {
          const embeddings = await embedTexts(texts, genAI);

          await Promise.all(
            tweetIds.map((id, j) =>
              supabase.from('tweets').update({ embedding: embeddings[j] }).eq('id', id),
            ),
          );

          embeddedCount += batch.length;

          if (embeddedCount % 5000 === 0) {
            console.log(`[SEED] Embedded ${embeddedCount}/${validTweetRows.length} tweets...`);
          }
        } catch (err) {
          console.warn(
            `[SEED] Embedding batch ${i}-${i + EMBED_BATCH_SIZE} failed: ${String(err)}. Continuing...`,
          );
        }
      }

      console.log(
        `[SEED] Embedded ${embeddedCount} tweets via Gemini gemini-embedding-001 (${Math.round(performance.now() - embedStart)}ms)`,
      );
    }
  } else {
    console.log('[SEED] Skipping embeddings (--skip-embeddings flag)');
  }

  // ── Step 6: Simulate & insert engagements ────────────────────────────────

  console.log('[SEED] Simulating engagements...');
  const engagementsStart = performance.now();

  // Build user inputs for simulator (need actual UUIDs)
  const userInputs = personas.map((p) => ({
    id: usernameToId.get(p.username) ?? '',
    persona_type: p.persona_type,
    interests: p.interests,
    follower_tier: p.follower_tier,
    engagement_rate: p.engagement_rate,
  }));

  // Add viewer user to inputs (minimal profile)
  userInputs.push({
    id: VIEWER_ID,
    persona_type: 'tech',
    interests: ['ai', 'startups', 'tech', 'open_source'],
    follower_tier: 'micro',
    engagement_rate: 0.08,
  });

  // Build tweet inputs for simulator
  const tweetInputs = validTweetRows.map((t) => ({
    id: t.id,
    author_id: t.author_id,
    topic: t.topic,
    created_at: new Date(t.created_at),
  }));

  // Follow inputs already converted to UUIDs
  const followInputs = followRows.map((f) => ({
    follower_id: f.follower_id,
    following_id: f.following_id,
  }));

  const engagementResult = simulateEngagements({
    tweets: tweetInputs,
    users: userInputs,
    follows: followInputs,
    viewerId: VIEWER_ID,
  });

  // Insert engagements in batches
  const engagementRows = engagementResult.engagements.map((e) => ({
    user_id: e.user_id,
    tweet_id: e.tweet_id,
    engagement_type: e.engagement_type,
    created_at: e.created_at.toISOString(),
  }));

  await batchInsert(supabase, 'engagements', engagementRows);

  console.log(
    `[SEED] Inserted ${engagementRows.length} engagements in ${Math.round(performance.now() - engagementsStart)}ms`,
  );

  // ── Step 7: Update tweet counters ────────────────────────────────────────

  console.log('[SEED] Updating tweet counters...');
  const countersStart = performance.now();

  const counterUpdates: Array<{
    id: string;
    like_count: number;
    reply_count: number;
    repost_count: number;
    click_count: number;
  }> = [];

  for (const [tweetId, counters] of engagementResult.tweetCounters) {
    if (
      counters.like_count > 0 ||
      counters.reply_count > 0 ||
      counters.repost_count > 0 ||
      counters.click_count > 0
    ) {
      counterUpdates.push({
        id: tweetId,
        like_count: counters.like_count,
        reply_count: counters.reply_count,
        repost_count: counters.repost_count,
        click_count: counters.click_count,
      });
    }
  }

  const PARALLEL_LIMIT = 50;
  for (let i = 0; i < counterUpdates.length; i += PARALLEL_LIMIT) {
    const batch = counterUpdates.slice(i, i + PARALLEL_LIMIT);
    await Promise.all(
      batch.map((update) =>
        supabase
          .from('tweets')
          .update({
            like_count: update.like_count,
            reply_count: update.reply_count,
            repost_count: update.repost_count,
            click_count: update.click_count,
          })
          .eq('id', update.id),
      ),
    );
    if ((i + PARALLEL_LIMIT) % 5000 === 0) {
      console.log(`[SEED] Updated counters for ${Math.min(i + PARALLEL_LIMIT, counterUpdates.length)}/${counterUpdates.length} tweets...`);
    }
  }

  console.log(
    `[SEED] Updated counters for ${counterUpdates.length} tweets in ${Math.round(performance.now() - countersStart)}ms`,
  );

  // ── Step 8: Update follower/following counts ──────────────────────────────

  console.log('[SEED] Updating follower/following counts...');
  const countsStart = performance.now();

  // Compute actual counts from the follow graph result
  const { followerCounts, followingCounts } = followGraphResult;

  // Build update list from personas (using actual follow graph counts)
  const userCountUpdates: Array<{ id: string; follower_count: number; following_count: number }> = [];

  for (const persona of personas) {
    const id = usernameToId.get(persona.username);
    if (!id) continue;

    userCountUpdates.push({
      id,
      follower_count: followerCounts.get(persona.username) ?? 0,
      following_count: followingCounts.get(persona.username) ?? 0,
    });
  }

  // Also update viewer's following count
  const viewerFollowingCount = followingCounts.get(VIEWER_ID) ?? 0;
  const { error: viewerUpdateError } = await supabase
    .from('users')
    .update({ following_count: viewerFollowingCount })
    .eq('id', VIEWER_ID);

  if (viewerUpdateError) {
    console.warn(`[SEED] Failed to update viewer following count: ${viewerUpdateError.message}`);
  }

  await Promise.all(
    userCountUpdates.map((update) =>
      supabase
        .from('users')
        .update({
          follower_count: update.follower_count,
          following_count: update.following_count,
        })
        .eq('id', update.id),
    ),
  );

  console.log(
    `[SEED] Updated follower/following counts in ${Math.round(performance.now() - countsStart)}ms`,
  );

  // ── Summary ───────────────────────────────────────────────────────────────

  const totalMs = Math.round(performance.now() - globalStart);
  const totalMinutes = Math.floor(totalMs / 60000);
  const totalSeconds = Math.round((totalMs % 60000) / 1000);

  console.log('[SEED] ─────────────────────────────────────────────────');
  console.log('[SEED] Seed complete!');
  console.log(`[SEED]   Users:       ${userRows.length} personas + 1 viewer`);
  console.log(`[SEED]   Tweets:      ${validTweetRows.length}`);
  console.log(`[SEED]   Follows:     ${followRows.length}`);
  console.log(`[SEED]   Engagements: ${engagementRows.length}`);
  console.log(
    `[SEED]   Total time:  ${totalMinutes > 0 ? `${totalMinutes}m ` : ''}${totalSeconds}s`,
  );
  console.log('[SEED] ─────────────────────────────────────────────────');
}

// ─── Entry Point ─────────────────────────────────────────────────────────────

seed().catch((err) => {
  console.error('[SEED] Fatal error:', err);
  process.exit(1);
});

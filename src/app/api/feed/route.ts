import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { createDefaultPipeline, createLocalPipeline } from '@/lib/ranking/create-pipeline';
import type { FeedQuery } from '@/lib/types/ranking';
import type { AlgorithmWeights } from '@/lib/types/database';
import { VIEWER_ID } from '@/lib/constants';

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 1.0,
  popularity_weight: 1.0,
  network_weight: 1.0,
  topic_relevance_weight: 1.0,
  engagement_type_weights: {
    like: 1.0,
    reply: 1.0,
    repost: 1.0,
    click: 1.0,
    follow_author: 1.0,
    not_interested: 1.0,
  },
  oon_penalty: undefined,
  diversity_decay: undefined,
  updated_at: new Date().toISOString(),
};

export async function POST(request: NextRequest) {
  const startMs = performance.now();

  try {
    const body = await request.json();
    const userId = body.userId ?? VIEWER_ID;
    const rawLimit = body.limit ?? 50;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;
    const seenIds = Array.isArray(body.seenIds) ? body.seenIds.filter((id: string) => typeof id === 'string') : [];

    const weights = supabase ? (await supabase.from('algorithm_weights').select('*').eq('user_id', userId).maybeSingle()).data : null;

    const appliedWeights: AlgorithmWeights = weights ?? {
      ...DEFAULT_WEIGHTS,
      user_id: userId,
    };

    const query: FeedQuery = {
      viewer_id: userId,
      limit,
      seen_ids: seenIds,
      served_ids: [],
      algorithm_weights: appliedWeights,
    };

    const isLocal = !supabase;
    if (isLocal) {
      console.log('[FEED] Supabase unavailable — using local data fallback (DB was removed to free up Supabase free tier slots, shipping too many projects)');
    }
    const pipeline = isLocal ? createLocalPipeline() : createDefaultPipeline(supabase!);
    const results = await pipeline.execute(query);
    const pipelineMs = Math.round(performance.now() - startMs);

    console.log(
      `[FEED] Feed request: userId=${userId}, limit=${limit}, pipeline=${pipelineMs}ms, results=${results.length}`,
    );

    const cleaned = results.map((c) => {
      const { embedding, ...tweetWithoutEmbedding } = c.tweet;
      return { ...c, tweet: tweetWithoutEmbedding };
    });

    return NextResponse.json({
      tweets: cleaned,
      meta: {
        totalCandidates: results.length,
        pipelineMs,
        appliedWeights,
        dataSource: isLocal ? 'local' : 'supabase',
      },
    });
  } catch (err) {
    const pipelineMs = Math.round(performance.now() - startMs);
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[FEED] Pipeline error after ${pipelineMs}ms:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

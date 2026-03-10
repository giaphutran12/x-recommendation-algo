import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createDefaultPipeline } from '@/lib/ranking/create-pipeline';
import type { FeedQuery } from '@/lib/types/ranking';
import type { AlgorithmWeights } from '@/lib/types/database';

const DEFAULT_VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: DEFAULT_VIEWER_ID,
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

export async function GET(request: NextRequest) {
  const startMs = performance.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId') ?? DEFAULT_VIEWER_ID;
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);
    const seenIds = searchParams.get('seenIds')?.split(',').filter(Boolean) ?? [];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data: weights } = await supabase
      .from('algorithm_weights')
      .select('*')
      .eq('user_id', userId)
      .single();

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

    const pipeline = createDefaultPipeline(supabase);
    const results = await pipeline.execute(query);
    const pipelineMs = Math.round(performance.now() - startMs);

    console.log(
      `[FEED] Feed request: userId=${userId}, limit=${limit}, pipeline=${pipelineMs}ms, results=${results.length}`,
    );

    const cleaned = results.map((c) => ({
      ...c,
      tweet: { ...c.tweet, embedding: undefined },
    }));

    return NextResponse.json({
      tweets: cleaned,
      meta: {
        totalCandidates: results.length,
        pipelineMs,
        appliedWeights,
      },
    });
  } catch (err) {
    const pipelineMs = Math.round(performance.now() - startMs);
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[FEED] Pipeline error after ${pipelineMs}ms:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

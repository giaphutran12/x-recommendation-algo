import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
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

export async function GET(request: NextRequest) {
  try {
    const userId =
      request.nextUrl.searchParams.get('userId') ?? VIEWER_ID;

    console.log(`[WEIGHTS] GET weights for userId=${userId}`);

    const { data, error } = await supabase
      .from('algorithm_weights')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`[WEIGHTS] DB error for userId=${userId}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const weights: AlgorithmWeights = data ?? {
      ...DEFAULT_WEIGHTS,
      user_id: userId,
    };

    return NextResponse.json({ weights });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[WEIGHTS] GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = body.user_id ?? VIEWER_ID;

    console.log(`[WEIGHTS] PUT weights for userId=${userId}`);

    const recencyWeight = Number(body.recency_weight ?? 0.3);
    const popularityWeight = Number(body.popularity_weight ?? 0.25);
    const networkWeight = Number(body.network_weight ?? 0.25);
    const topicRelevanceWeight = Number(body.topic_relevance_weight ?? 0.2);
    const oonPenalty = Number(body.oon_penalty ?? 0.7);
    const diversityDecay = Number(body.diversity_decay ?? 0.5);

    if (
      isNaN(recencyWeight) ||
      isNaN(popularityWeight) ||
      isNaN(networkWeight) ||
      isNaN(topicRelevanceWeight) ||
      isNaN(oonPenalty) ||
      isNaN(diversityDecay)
    ) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 });
    }

    const engagementTypeWeights = body.engagement_type_weights ?? {};
    if (typeof engagementTypeWeights !== 'object' || Array.isArray(engagementTypeWeights)) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 });
    }

    const validatedEngagementWeights: Record<string, number> = {};
    for (const [key, value] of Object.entries(engagementTypeWeights)) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 });
      }
      validatedEngagementWeights[key] = Math.min(10, Math.max(-10, numValue));
    }

    const { data, error } = await supabase
      .from('algorithm_weights')
      .upsert(
        {
          user_id: userId,
          recency_weight: Math.min(1, Math.max(0, recencyWeight)),
          popularity_weight: Math.min(1, Math.max(0, popularityWeight)),
          network_weight: Math.min(1, Math.max(0, networkWeight)),
          topic_relevance_weight: Math.min(1, Math.max(0, topicRelevanceWeight)),
          engagement_type_weights: validatedEngagementWeights,
          oon_penalty: Math.min(1, Math.max(0, oonPenalty)),
          diversity_decay: Math.min(1, Math.max(0, diversityDecay)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) {
      console.error(`[WEIGHTS] DB upsert error for userId=${userId}:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[WEIGHTS] Saved weights for userId=${userId}`);

    return NextResponse.json({ weights: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[WEIGHTS] PUT error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { feedEvents } from '@/lib/feed-events';
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
  try {
    const userId =
      request.nextUrl.searchParams.get('userId') ?? DEFAULT_VIEWER_ID;

    console.log(`[WEIGHTS] GET weights for userId=${userId}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

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
    const userId = body.user_id ?? DEFAULT_VIEWER_ID;

    console.log(`[WEIGHTS] PUT weights for userId=${userId}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

    const { data, error } = await supabase
      .from('algorithm_weights')
      .upsert(
        {
          user_id: userId,
          recency_weight: body.recency_weight,
          popularity_weight: body.popularity_weight,
          network_weight: body.network_weight,
          topic_relevance_weight: body.topic_relevance_weight,
          engagement_type_weights: body.engagement_type_weights,
          oon_penalty: body.oon_penalty,
          diversity_decay: body.diversity_decay,
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

    feedEvents.emit(userId, data);
    console.log(`[WEIGHTS] Emitted weight change event for userId=${userId}`);

    return NextResponse.json({ weights: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[WEIGHTS] PUT error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

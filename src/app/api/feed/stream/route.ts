import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createDefaultPipeline } from '@/lib/ranking/create-pipeline';
import { feedEvents } from '@/lib/feed-events';
import type { FeedQuery } from '@/lib/types/ranking';
import type { AlgorithmWeights } from '@/lib/types/database';

const DEFAULT_VIEWER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(request: NextRequest) {
  const userId =
    request.nextUrl.searchParams.get('userId') ?? DEFAULT_VIEWER_ID;

  console.log(`[FEED] SSE stream: client connected for userId=${userId}`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode('event: connected\ndata: {"status":"connected"}\n\n'),
      );

      const unsubscribe = feedEvents.subscribe(userId, async (data) => {
        try {
          console.log(`[FEED] SSE stream: pushing re-ranked feed for userId=${userId}`);

          const updatedWeights = data as AlgorithmWeights;

          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          );

          const query: FeedQuery = {
            viewer_id: userId,
            limit: 50,
            seen_ids: [],
            served_ids: [],
            algorithm_weights: updatedWeights,
          };

          const pipeline = createDefaultPipeline(supabase);
          const results = await pipeline.execute(query);

          const cleaned = results.map((c) => ({
            ...c,
            tweet: { ...c.tweet, embedding: undefined },
          }));

          const payload = JSON.stringify({
            tweets: cleaned,
            meta: {
              totalCandidates: results.length,
              appliedWeights: updatedWeights,
            },
          });

          controller.enqueue(
            encoder.encode(`event: feed\ndata: ${payload}\n\n`),
          );
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error(`[FEED] SSE stream error for userId=${userId}:`, message);

          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: message })}\n\n`,
            ),
          );
        }
      });

      request.signal.addEventListener('abort', () => {
        console.log(`[FEED] SSE stream: client disconnected for userId=${userId}`);
        unsubscribe();
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ScoredCandidate } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import TweetCard from './tweet-card';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

interface FeedMeta {
  totalCandidates: number;
  pipelineMs: number;
  appliedWeights: Record<string, number>;
}

interface FeedResponse {
  tweets: ScoredCandidate[];
  meta: FeedMeta;
}

export default function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [feedVersion, setFeedVersion] = useState(0);

  const seenIdsRef = useRef<Set<string>>(new Set());
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(async (reset: boolean) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (reset) {
      setLoading(true);
      seenIdsRef.current.clear();
    } else {
      setLoadingMore(true);
    }

    try {
      const seenParam =
        seenIdsRef.current.size > 0
          ? `&seenIds=${Array.from(seenIdsRef.current).join(',')}`
          : '';
      const url = `/api/feed?userId=${VIEWER_ID}&limit=50${seenParam}`;
      const res = await fetch(url, { signal: controller.signal });

      if (!res.ok) {
        console.error('[FEED] fetch error', res.status);
        return;
      }

      const data: FeedResponse = await res.json();
      const incoming = data.tweets ?? [];

      for (const t of incoming) {
        seenIdsRef.current.add(t.tweet.id);
      }

      if (reset) {
        setTweets(incoming);
      } else {
        setTweets((prev) => [...prev, ...incoming]);
      }

      setHasMore(incoming.length >= 10);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('[FEED] fetch exception', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    const onWeightsSaved = () => {
      console.log('[FEED] v7:weights-saved event received, triggering refresh');
      setFeedVersion(v => v + 1);
    };

    window.addEventListener('v7:weights-saved', onWeightsSaved);
    return () => {
      window.removeEventListener('v7:weights-saved', onWeightsSaved);
    };
  }, []);

  useEffect(() => {
    void fetchFeed(true);
  }, [fetchFeed, feedVersion]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          void fetchFeed(false);
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchFeed, hasMore, loadingMore, loading]);

  return (
    <div className="relative bg-background">


        {loading && (
          <div className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3 mx-4 px-8 py-5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32 rounded bg-muted" />
                <Skeleton className="h-3 w-full rounded bg-muted" />
                <Skeleton className="h-3 w-4/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && (
        <div className="divide-y divide-border">
          {tweets.map((candidate) => (
            <TweetCard key={candidate.tweet.id} candidate={candidate} />
          ))}
        </div>
      )}

       {loadingMore && (
          <div className="divide-y divide-border">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3 mx-4 px-8 py-5">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32 rounded bg-muted" />
                <Skeleton className="h-3 w-full rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && <div ref={sentinelRef} className="h-4" />}
    </div>
  );
}

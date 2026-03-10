'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import TweetCard from './tweet-card';
import type { ScoredCandidate } from '@/lib/types/ranking';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const PAGE_SIZE = 50;

interface FeedProps {
  feedVersion: number;
}

export default function Feed({ feedVersion }: FeedProps) {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [sseTweets, setSseTweets] = useState<ScoredCandidate[] | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});

  /* ───── Fetch helper ───── */
  const fetchFeed = useCallback(
    async (seenIds?: string[]): Promise<ScoredCandidate[]> => {
      const params = new URLSearchParams({
        userId: VIEWER_ID,
        limit: PAGE_SIZE.toString(),
      });
      if (seenIds && seenIds.length > 0) {
        params.set('seenIds', seenIds.join(','));
      }
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      return (data.tweets ?? []) as ScoredCandidate[];
    },
    []
  );

  /* ───── Initial load + re-fetch on feedVersion change ───── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setTweets([]);
    setSseTweets(null);

    fetchFeed()
      .then((t) => {
        if (!cancelled) {
          setTweets(t);
          setHasMore(t.length >= PAGE_SIZE);
        }
      })
      .catch(() => {
        if (!cancelled) setTweets([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [feedVersion, fetchFeed]);

  /* ───── SSE for re-ranked feed ───── */
  useEffect(() => {
    const sse = new EventSource(`/api/feed/stream?userId=${VIEWER_ID}`);

    sse.addEventListener('feed', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tweets) setSseTweets(data.tweets as ScoredCandidate[]);
      } catch {
        /* ignore parse errors */
      }
    });

    sse.addEventListener('error', () => {
      /* reconnection handled by browser */
    });

    return () => sse.close();
  }, []);

  /* ───── Infinite scroll callback (ref-based to avoid observer re-creation) ───── */
  useEffect(() => {
    loadMoreRef.current = () => {
      if (loading || loadingMore || !hasMore) return;
      setLoadingMore(true);
      const seenIds = tweets.map((t) => t.tweet.id);

      fetchFeed(seenIds)
        .then((newTweets) => {
          setTweets((prev) => [...prev, ...newTweets]);
          setHasMore(newTweets.length >= PAGE_SIZE);
        })
        .catch(() => {})
        .finally(() => setLoadingMore(false));
    };
  }, [loading, loadingMore, hasMore, tweets, fetchFeed]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMoreRef.current();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ───── SSE banner handler ───── */
  const applySseUpdate = () => {
    if (sseTweets) {
      setTweets(sseTweets);
      setSseTweets(null);
      setHasMore(sseTweets.length >= PAGE_SIZE);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  /* ───── Loading skeleton ───── */
  if (loading) {
    return (
      <div className="divide-y divide-[#2F3336]">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2.5">
              <div className="flex gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-10 pt-1">
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ───── Empty state ───── */
  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-xl font-bold text-[#E7E9EA]">No tweets yet</p>
        <p className="mt-2 text-[15px] text-[#71767B]">
          When tweets are available, they&apos;ll show up here.
        </p>
      </div>
    );
  }

  /* ───── Feed ───── */
  return (
    <div>
      {/* Re-rank banner */}
      {sseTweets && (
        <button
          onClick={applySseUpdate}
          type="button"
          className="sticky top-[53px] z-10 w-full border-b border-[#2F3336] bg-[#000000]/80 py-3 text-center text-[14px] font-medium text-[#1D9BF0] backdrop-blur-sm transition-colors hover:bg-[#1D9BF0]/10"
        >
          Show new tweets
        </button>
      )}

      {/* Tweet list */}
      {tweets.map((c) => (
        <TweetCard key={c.tweet.id} candidate={c} />
      ))}

      {/* Sentinel */}
      <div ref={sentinelRef} className="py-6">
        {loadingMore && (
          <div className="flex justify-center">
            <Spinner className="h-6 w-6 text-[#1D9BF0]" />
          </div>
        )}
        {!hasMore && tweets.length > 0 && (
          <p className="py-4 text-center text-[14px] text-[#71767B]">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}

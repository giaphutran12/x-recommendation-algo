'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TweetCard } from './tweet-card';
import type { ScoredCandidate } from '@/lib/types/ranking';

const USER_ID = '00000000-0000-0000-0000-000000000001';
const FETCH_LIMIT = 50;

interface FeedMeta {
  totalCandidates: number;
  pipelineMs: number;
}

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#2F3336]">
      <Skeleton className="w-12 h-12 rounded-full shrink-0 bg-[#2F3336]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-32 bg-[#2F3336]" />
          <Skeleton className="h-4 w-20 bg-[#2F3336]" />
        </div>
        <Skeleton className="h-4 w-full bg-[#2F3336]" />
        <Skeleton className="h-4 w-4/5 bg-[#2F3336]" />
        <div className="flex gap-8 pt-1">
          <Skeleton className="h-4 w-8 bg-[#2F3336]" />
          <Skeleton className="h-4 w-8 bg-[#2F3336]" />
          <Skeleton className="h-4 w-8 bg-[#2F3336]" />
        </div>
      </div>
    </div>
  );
}

export function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [meta, setMeta] = useState<FeedMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [pendingTweets, setPendingTweets] = useState<ScoredCandidate[] | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchFeed = useCallback(async (seenIds: string[] = []) => {
    const params = new URLSearchParams({
      userId: USER_ID,
      limit: String(FETCH_LIMIT),
    });
    if (seenIds.length > 0) {
      params.set('seenIds', seenIds.join(','));
    }
    const res = await fetch(`/api/feed?${params.toString()}`);
    if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
    return res.json() as Promise<{ tweets: ScoredCandidate[]; meta: FeedMeta }>;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchFeed()
      .then((data) => {
        if (cancelled) return;
        setTweets(data.tweets);
        setMeta(data.meta);
        setHasMore(data.tweets.length === FETCH_LIMIT);
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [fetchFeed]);

  useEffect(() => {
    const es = new EventSource(`/api/feed/stream?userId=${USER_ID}`);
    eventSourceRef.current = es;

    es.addEventListener('feed', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data) as { tweets: ScoredCandidate[]; meta: FeedMeta };
        setPendingTweets(data.tweets);
      } catch {
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && hasMore && !isLoading) {
          setIsLoadingMore(true);
          const seenIds = tweets.map((c) => c.tweet.id);
          fetchFeed(seenIds)
            .then((data) => {
              setTweets((prev) => [...prev, ...data.tweets]);
              setHasMore(data.tweets.length === FETCH_LIMIT);
              setIsLoadingMore(false);
            })
            .catch(() => {
              setIsLoadingMore(false);
            });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [tweets, isLoadingMore, hasMore, isLoading, fetchFeed]);

  const handleApplyPending = () => {
    if (pendingTweets) {
      setTweets(pendingTweets);
      setPendingTweets(null);
      setHasMore(pendingTweets.length === FETCH_LIMIT);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-3">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-[#E7E9EA] font-semibold">Could not load feed</p>
        <p className="text-[#71767B] text-sm">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-2 rounded-full bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-bold"
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      {pendingTweets && (
        <div className="sticky top-[53px] z-10 flex justify-center py-2 px-4">
          <button
            onClick={handleApplyPending}
            className="flex items-center gap-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white text-[14px] font-bold px-4 py-2 rounded-full shadow-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            New rankings available — Update Feed
          </button>
        </div>
      )}

      {isLoading ? (
        <div>
          {Array.from({ length: 8 }).map((_, i) => (
            <TweetSkeleton key={i} />
          ))}
        </div>
      ) : tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <p className="text-[#E7E9EA] text-[20px] font-extrabold">No tweets yet</p>
          <p className="text-[#71767B]">Check back later or adjust your algorithm weights.</p>
        </div>
      ) : (
        <>
          {meta && (
            <div className="px-4 py-2 border-b border-[#2F3336] flex items-center justify-between">
              <span className="text-[#71767B] text-[13px]">
                {meta.totalCandidates} candidates · {meta.pipelineMs}ms
              </span>
            </div>
          )}

          {tweets.map((candidate) => (
            <TweetCard key={candidate.tweet.id} candidate={candidate} />
          ))}

          <div ref={sentinelRef} className="h-8" />

          {isLoadingMore && (
            <div>
              {Array.from({ length: 3 }).map((_, i) => (
                <TweetSkeleton key={i} />
              ))}
            </div>
          )}

          {!hasMore && tweets.length > 0 && (
            <div className="py-8 text-center text-[#71767B] text-[14px]">
              You&apos;ve reached the end
            </div>
          )}
        </>
      )}
    </div>
  );
}

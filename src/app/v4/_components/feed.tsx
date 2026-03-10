'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TweetCard } from './tweet-card';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const PAGE_SIZE = 20;

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#2F3336]">
      <Skeleton className="size-10 rounded-full shrink-0 bg-[#2F3336]" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-32 bg-[#2F3336]" />
          <Skeleton className="h-4 w-24 bg-[#2F3336]/60" />
        </div>
        <Skeleton className="h-4 w-full bg-[#2F3336]" />
        <Skeleton className="h-4 w-4/5 bg-[#2F3336]" />
        <Skeleton className="h-4 w-3/5 bg-[#2F3336]/60" />
        <div className="flex gap-8 pt-1">
          <Skeleton className="h-4 w-8 bg-[#2F3336]/60" />
          <Skeleton className="h-4 w-8 bg-[#2F3336]/60" />
          <Skeleton className="h-4 w-8 bg-[#2F3336]/60" />
          <Skeleton className="h-4 w-8 bg-[#2F3336]/60" />
        </div>
      </div>
    </div>
  );
}

export function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [reranking, setReranking] = useState(false);
  const seenIds = useRef<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchFeed = useCallback(async (reset = false) => {
    if (reset) {
      setLoading(true);
      seenIds.current = new Set();
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const seenParam =
        seenIds.current.size > 0
          ? `&seenIds=${Array.from(seenIds.current).join(',')}`
          : '';
      const res = await fetch(
        `/api/feed?userId=${VIEWER_ID}&limit=${PAGE_SIZE}${seenParam}`,
      );
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
      const data = await res.json();
      const newTweets: ScoredCandidate[] = data.tweets ?? [];

      newTweets.forEach((c) => seenIds.current.add(c.tweet.id));

      if (reset) {
        setTweets(newTweets);
      } else {
        setTweets((prev) => [...prev, ...newTweets]);
      }

      setHasMore(newTweets.length === PAGE_SIZE);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  useEffect(() => {
    const es = new EventSource(`/api/feed/stream?userId=${VIEWER_ID}`);
    eventSourceRef.current = es;

    es.addEventListener('feed', () => {
      setDirty(true);
    });

    return () => {
      es.close();
    };
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeed(false);
        }
      },
      { threshold: 0.1 },
    );

    observerRef.current.observe(sentinelRef.current);

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadingMore, loading, fetchFeed]);

  const handleUpdateFeed = useCallback(async () => {
    setReranking(true);
    setDirty(false);
    await fetchFeed(true);
    setReranking(false);
  }, [fetchFeed]);

  if (loading) {
    return (
      <div>
        {Array.from({ length: 6 }, (_, i) => (
          <TweetSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 gap-4">
        <div className="size-16 rounded-full bg-[#1D9BF0]/10 flex items-center justify-center">
          <Sparkles className="size-8 text-[#1D9BF0]" />
        </div>
        <p className="text-[20px] font-bold text-[#E7E9EA]">No tweets yet</p>
        <p className="text-[15px] text-[#71767B] text-center">
          Seed the database to see your personalized feed
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {dirty && (
        <div className="sticky top-[57px] z-20 flex justify-center px-4 pt-2 pb-1 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
          <button
            onClick={handleUpdateFeed}
            disabled={reranking}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold',
              'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors',
              'shadow-lg shadow-[#1D9BF0]/20',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            <RefreshCw className={cn('size-4', reranking && 'animate-spin')} />
            {reranking ? 'Updating...' : 'Update Feed'}
          </button>
        </div>
      )}

      {tweets.map((candidate) => (
        <TweetCard key={candidate.tweet.id} candidate={candidate} />
      ))}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div>
          {Array.from({ length: 3 }, (_, i) => (
            <TweetSkeleton key={i} />
          ))}
        </div>
      )}

      {!hasMore && tweets.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-[15px] text-[#71767B]">You&apos;ve reached the end</p>
        </div>
      )}
    </div>
  );
}

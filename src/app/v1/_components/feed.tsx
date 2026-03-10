'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TweetCard } from './tweet-card';
import type { ScoredCandidate } from '@/lib/types';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

interface FeedResponse {
  tweets: ScoredCandidate[];
  meta: {
    totalCandidates: number;
    pipelineMs: number;
    appliedWeights: Record<string, number>;
  };
}

export function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const fetchFeed = useCallback(async (replace = false) => {
    const seenIds = replace ? '' : Array.from(seenIdsRef.current).join(',');
    const url = `/api/feed?userId=${VIEWER_ID}&limit=50${seenIds ? `&seenIds=${seenIds}` : ''}`;

    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const data: FeedResponse = await res.json();
      const newTweets = data.tweets ?? [];

      if (replace) {
        seenIdsRef.current = new Set(newTweets.map((c) => c.tweet.id));
        setTweets(newTweets);
      } else {
        setTweets((prev) => {
          const combined = [...prev, ...newTweets];
          newTweets.forEach((c) => seenIdsRef.current.add(c.tweet.id));
          return combined;
        });
      }

      setHasMore(newTweets.length === 50);
    } catch {
    }
  }, []);

  useEffect(() => {
    setIsInitialLoading(true);
    fetchFeed(true).finally(() => setIsInitialLoading(false));
  }, [fetchFeed]);

  useEffect(() => {
    const es = new EventSource(`/api/feed/stream?userId=${VIEWER_ID}`);
    es.addEventListener('feed', (_e: Event) => {
      setIsDirty(true);
    });
    return () => es.close();
  }, []);

  useEffect(() => {
    const handler = () => setIsDirty(true);
    window.addEventListener('v1:weights-saved', handler);
    return () => window.removeEventListener('v1:weights-saved', handler);
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoadingMore && !isInitialLoading && hasMore) {
          setIsLoadingMore(true);
          fetchFeed(false).finally(() => setIsLoadingMore(false));
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, isInitialLoading, hasMore, fetchFeed]);

  const handleRefresh = async () => {
    setIsDirty(false);
    setIsInitialLoading(true);
    await fetchFeed(true);
    setIsInitialLoading(false);
  };

  if (isInitialLoading) {
    return (
      <div>
        {Array.from({ length: 5 }).map((_, i) => (
          <TweetSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div>
      {isDirty && (
        <button
          type="button"
          onClick={handleRefresh}
          className="w-full flex items-center justify-center gap-2 py-3 text-[#1D9BF0] text-sm hover:bg-[#1D9BF0]/5 border-b border-[#2F3336] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          New tweets available
        </button>
      )}

      {tweets.map((candidate) => (
        <TweetCard key={candidate.tweet.id} candidate={candidate} />
      ))}

      {isLoadingMore && (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <TweetSkeleton key={i} />
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {!hasMore && tweets.length > 0 && (
        <p className="text-center text-[#71767B] text-sm py-8">You&apos;re all caught up</p>
      )}
    </div>
  );
}

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#2F3336]">
      <Skeleton className="w-12 h-12 rounded-full shrink-0 bg-[#2F3336]" />
      <div className="flex-1 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-28 bg-[#2F3336]" />
          <Skeleton className="h-4 w-20 bg-[#2F3336]" />
        </div>
        <Skeleton className="h-4 w-full bg-[#2F3336]" />
        <Skeleton className="h-4 w-3/4 bg-[#2F3336]" />
        <div className="flex gap-6 mt-1">
          <Skeleton className="h-4 w-12 bg-[#2F3336]" />
          <Skeleton className="h-4 w-12 bg-[#2F3336]" />
          <Skeleton className="h-4 w-12 bg-[#2F3336]" />
        </div>
      </div>
    </div>
  );
}

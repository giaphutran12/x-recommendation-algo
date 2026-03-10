'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw, ArrowUp } from 'lucide-react';
import TweetCard from './tweet-card';
import type { ScoredCandidate } from '@/lib/types/ranking';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const BATCH_SIZE = 20;

function TweetSkeleton() {
  return (
    <div className="flex gap-3 px-4 py-3 border-b border-[#2F3336]" aria-hidden="true">
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-[#2F3336]" />
      <div className="flex-1 space-y-2 pt-1">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-24 bg-[#2F3336]" />
          <Skeleton className="h-4 w-16 bg-[#2F3336]" />
        </div>
        <Skeleton className="h-4 w-full bg-[#2F3336]" />
        <Skeleton className="h-4 w-5/6 bg-[#2F3336]" />
        <Skeleton className="h-4 w-2/3 bg-[#2F3336]" />
        <div className="flex gap-6 pt-1">
          <Skeleton className="h-4 w-10 bg-[#2F3336]" />
          <Skeleton className="h-4 w-10 bg-[#2F3336]" />
          <Skeleton className="h-4 w-10 bg-[#2F3336]" />
        </div>
      </div>
    </div>
  );
}

export default function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [pendingTweets, setPendingTweets] = useState<ScoredCandidate[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const tweetsRef = useRef<ScoredCandidate[]>([]);

  useEffect(() => {
    tweetsRef.current = tweets;
  }, [tweets]);

  const fetchFeed = useCallback(async (currentTweets: ScoredCandidate[], isInitial = false) => {
    if (isInitial) {
      setIsInitialLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const url = new URL('/api/feed', window.location.origin);
      url.searchParams.set('userId', VIEWER_ID);
      url.searchParams.set('limit', String(BATCH_SIZE));
      const seenIds = currentTweets.map((c) => c.tweet.id).join(',');
      if (seenIds) url.searchParams.set('seenIds', seenIds);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Feed API error: ${res.status}`);

      const data = (await res.json()) as { tweets: ScoredCandidate[]; meta: unknown };

      if (data.tweets.length < BATCH_SIZE) setHasMore(false);

      if (isInitial) {
        setTweets(data.tweets);
      } else {
        setTweets((prev) => [...prev, ...data.tweets]);
      }
      setError(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load feed';
      setError(msg);
      console.error('[V3:FEED] Error fetching feed:', err);
    } finally {
      if (isInitial) setIsInitialLoading(false);
      else setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed([], true);
  }, [fetchFeed]);

  useEffect(() => {
    const es = new EventSource(`/api/feed/stream?userId=${VIEWER_ID}`);

    es.addEventListener('connected', () => {
      console.log('[V3:FEED] SSE connected');
    });

    es.addEventListener('feed', (e: Event) => {
      try {
        const event = e as MessageEvent;
        const data = JSON.parse(event.data) as { tweets: ScoredCandidate[] };
        console.log(`[V3:FEED] SSE received ${data.tweets.length} tweets`);
        setPendingTweets(data.tweets);
        setShowBanner(true);
      } catch (err) {
        console.error('[V3:FEED] SSE parse error:', err);
      }
    });

    es.onerror = () => {
      console.error('[V3:FEED] SSE error, closing');
      es.close();
    };

    return () => es.close();
  }, []);

  useEffect(() => {
    const handleWeightsSaved = () => {
      console.log('[V3:FEED] Weights saved, re-fetching feed');
      setHasMore(true);
      fetchFeed([], true);
    };
    window.addEventListener('v3:weights-saved', handleWeightsSaved);
    return () => window.removeEventListener('v3:weights-saved', handleWeightsSaved);
  }, [fetchFeed]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore && !isInitialLoading && hasMore) {
          fetchFeed(tweetsRef.current, false);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [isLoadingMore, isInitialLoading, hasMore, fetchFeed]);

  function applyPendingTweets() {
    setTweets(pendingTweets);
    setPendingTweets([]);
    setShowBanner(false);
    setHasMore(true);
  }

  if (isInitialLoading) {
    return (
      <div role="status" aria-label="Loading feed">
        {Array.from({ length: 6 }).map((_, i) => (
          <TweetSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error && tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <p className="text-[#E7E9EA] font-bold text-xl mb-2">Something went wrong</p>
        <p className="text-[#71767B] text-sm mb-6">{error}</p>
        <Button
          onClick={() => fetchFeed([], true)}
          className="rounded-full bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white"
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <p className="text-[#E7E9EA] font-bold text-2xl mb-2">Nothing to see here</p>
        <p className="text-[#71767B] text-sm mb-6">
          Your feed is empty. Try adjusting the algorithm weights.
        </p>
        <Button
          onClick={() => fetchFeed([], true)}
          variant="outline"
          className="rounded-full border-[#536471] text-[#E7E9EA] hover:bg-[#E7E9EA]/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div>
      {showBanner && (
        <div className="sticky top-[57px] z-10 flex justify-center py-2 px-4">
          <button
            onClick={applyPendingTweets}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1D9BF0] text-white text-sm font-semibold shadow-lg hover:bg-[#1A8CD8] transition-colors"
            aria-live="polite"
          >
            <ArrowUp className="w-4 h-4" aria-hidden="true" />
            {pendingTweets.length} new tweets · Update Feed
          </button>
        </div>
      )}

      <section aria-label="Tweet feed">
        {tweets.map((candidate, idx) => (
          <TweetCard key={`${candidate.tweet.id}-${idx}`} candidate={candidate} />
        ))}
      </section>

      <div ref={sentinelRef} className="py-4">
        {isLoadingMore && (
          <div role="status" aria-label="Loading more tweets">
            {Array.from({ length: 3 }).map((_, i) => (
              <TweetSkeleton key={i} />
            ))}
          </div>
        )}
        {!hasMore && tweets.length > 0 && (
          <p className="text-center text-[#71767B] text-sm py-8">
            You&apos;ve reached the end
          </p>
        )}
      </div>
    </div>
  );
}

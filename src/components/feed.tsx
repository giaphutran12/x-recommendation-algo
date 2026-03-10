'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Zap, X, MessageSquare } from 'lucide-react';
import { TweetCard } from '@/components/tweet-card';
import { AlgorithmPanel } from '@/components/algorithm-panel';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

// ─── Feed API response shape ──────────────────────────────────────────────────

interface FeedResponse {
  tweets: ScoredCandidate[];
  meta: {
    totalCandidates: number;
    pipelineMs: number;
    appliedWeights: unknown;
  };
}

interface StreamFeedResponse {
  tweets: ScoredCandidate[];
  meta: {
    totalCandidates: number;
    appliedWeights: unknown;
  };
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function TweetSkeleton() {
  return (
    <div className="px-4 py-3 border-b border-[#2f3336]">
      <div className="flex gap-3">
        <div className="shrink-0">
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex gap-2 items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-10 pt-1">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div role="status" aria-label="Loading feed">
      {Array.from({ length: 6 }).map((_, i) => (
        <TweetSkeleton key={i} />
      ))}
      <span className="sr-only">Loading tweets…</span>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-[#16181c] flex items-center justify-center mb-4">
        <MessageSquare size={28} stroke="#71767b" strokeWidth={1.5} aria-hidden="true" />
      </div>
      <p className="text-[#e7e9ea] font-semibold text-[17px]">No tweets found</p>
      <p className="text-[#71767b] text-sm mt-1">
        Try adjusting your algorithm settings.
      </p>
    </div>
  );
}

// ─── Loading More Indicator ───────────────────────────────────────────────────

function LoadingMore() {
  return (
    <div
      className="flex justify-center items-center py-6"
      role="status"
      aria-label="Loading more tweets"
    >
      <Spinner className="size-5 text-[#1d9bf0]" />
      <span className="sr-only">Loading more tweets…</span>
    </div>
  );
}

// ─── Re-rank Banner ───────────────────────────────────────────────────────────

function ReRankBanner({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className="sticky top-[45px] z-10 mx-4 mt-0 mb-2 px-3 py-2 bg-[#1d9bf0]/10 border border-[#1d9bf0]/30 rounded-xl flex items-center gap-2"
      role="status"
      aria-live="polite"
    >
      <Zap size={14} fill="#1d9bf0" stroke="#1d9bf0" aria-hidden="true" />
      <span className="text-[#1d9bf0] text-xs font-medium">
        Feed re-ranked with new weights
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onDismiss}
        className={cn('ml-auto text-[#71767b] hover:text-[#e7e9ea] hover:bg-transparent')}
        aria-label="Dismiss notification"
      >
        <X size={14} aria-hidden="true" />
      </Button>
    </div>
  );
}

// ─── Algorithm Panel Portal ───────────────────────────────────────────────────

export function AlgorithmPanelPortal() {
  const [container, setContainer] = useState<Element | null>(null);

  useEffect(() => {
    setContainer(document.getElementById('algorithm-panel'));
  }, []);

  if (!container) return null;

  return createPortal(
    <div className="p-4 sticky top-4">
      <AlgorithmPanel userId={VIEWER_ID} />
    </div>,
    container,
  );
}

// ─── Feed Component ───────────────────────────────────────────────────────────

export interface FeedProps {
  initialTweets?: ScoredCandidate[];
}

export function Feed({ initialTweets }: FeedProps) {
  const [tweets, setTweets] = useState<ScoredCandidate[]>(
    initialTweets ?? [],
  );
  const [isLoading, setIsLoading] = useState(!initialTweets);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [seenIds, setSeenIds] = useState<string[]>(
    initialTweets?.map((c) => c.tweet.id) ?? [],
  );
  const [showReRankBanner, setShowReRankBanner] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Refs to avoid stale closures in callbacks
  const hasMoreRef = useRef(hasMore);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const seenIdsRef = useRef<string[]>(seenIds);

  // Keep refs in sync
  hasMoreRef.current = hasMore;
  isLoadingMoreRef.current = isLoadingMore;
  seenIdsRef.current = seenIds;

  // ── Initial fetch ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialTweets) return;

    let cancelled = false;

    const fetchFeed = async () => {
      console.log('[FEED] Fetching initial feed...');
      setIsLoading(true);

      try {
        const res = await fetch(`/api/feed?userId=${VIEWER_ID}&limit=50`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = (await res.json()) as FeedResponse;
        if (cancelled) return;

        console.log(
          `[FEED] Loaded ${data.tweets.length} tweets in ${data.meta.pipelineMs}ms`,
        );
        setTweets(data.tweets);
        setSeenIds(data.tweets.map((c) => c.tweet.id));
        setHasMore(data.tweets.length > 0);
      } catch (err) {
        if (!cancelled) console.error('[FEED] Initial fetch error:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchFeed();
    return () => {
      cancelled = true;
    };
  }, [initialTweets]);

  // ── Load more ────────────────────────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    setIsLoadingMore(true);
    isLoadingMoreRef.current = true;
    console.log('[FEED] Loading more tweets...');

    try {
      const params = new URLSearchParams({
        userId: VIEWER_ID,
        limit: '50',
        seenIds: seenIdsRef.current.join(','),
      });
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = (await res.json()) as FeedResponse;

      if (data.tweets.length === 0) {
        setHasMore(false);
        hasMoreRef.current = false;
        console.log('[FEED] No more tweets available');
      } else {
        setTweets((prev) => [...prev, ...data.tweets]);
        const newIds = data.tweets.map((c) => c.tweet.id);
        setSeenIds((prev) => [...prev, ...newIds]);
        seenIdsRef.current = [...seenIdsRef.current, ...newIds];
        console.log(`[FEED] Appended ${data.tweets.length} more tweets`);
      }
    } catch (err) {
      console.error('[FEED] Load more error:', err);
    } finally {
      setIsLoadingMore(false);
      isLoadingMoreRef.current = false;
    }
  }, []); // stable — uses refs for all mutable values

  // ── Intersection observer for infinite scroll ─────────────────────────────────

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '200px' },
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  // ── SSE connection ────────────────────────────────────────────────────────────

  useEffect(() => {
    const url = `/api/feed/stream?userId=${VIEWER_ID}`;
    console.log('[FEED] Connecting to SSE stream:', url);

    const es = new EventSource(url);

    // Named SSE event: connected
    es.addEventListener('connected', () => {
      console.log('[FEED] SSE connected');
    });

    // Named SSE event: feed (re-ranked feed when weights change)
    es.addEventListener('feed', (e) => {
      try {
        const msgEvent = e as MessageEvent;
        const data = JSON.parse(msgEvent.data as string) as StreamFeedResponse;
        console.log(`[FEED] SSE re-ranked feed: ${data.tweets.length} tweets`);
        setTweets(data.tweets);
        setSeenIds(data.tweets.map((c) => c.tweet.id));
        setHasMore(data.tweets.length > 0);
        setShowReRankBanner(true);
      } catch (err) {
        console.error('[FEED] SSE feed parse error:', err);
      }
    });

    // Connection-level error
    es.onerror = () => {
      console.error('[FEED] SSE connection error');
    };

    return () => {
      console.log('[FEED] Closing SSE connection');
      es.close();
    };
  }, []);

  // ── Render ───────────────────────────────────────────────────────────────────

  const dismissBanner = useCallback(() => setShowReRankBanner(false), []);

  return (
    <div role="feed" aria-busy={isLoading} aria-label="For you feed">
      {showReRankBanner && <ReRankBanner onDismiss={dismissBanner} />}

      {isLoading ? (
        <FeedSkeleton />
      ) : tweets.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {tweets.map((candidate) => (
            <TweetCard key={candidate.tweet.id} candidate={candidate} />
          ))}

          {/* Infinite scroll sentinel — triggers loadMore when visible */}
          <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />

          {isLoadingMore && <LoadingMore />}

          {!hasMore && tweets.length > 0 && (
            <div className="py-8 text-center text-[#71767b] text-sm">
              You&apos;ve reached the end of your feed
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Feed;

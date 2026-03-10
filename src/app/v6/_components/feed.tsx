'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { ScoredCandidate } from '@/lib/types/ranking';
import { TweetCard } from './tweet-card';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';
const PAGE_LIMIT = 50;

function FeedSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-[#2F3336]">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-4 flex gap-3">
          <Skeleton className="size-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Feed() {
  const [tweets, setTweets] = useState<ScoredCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [dirty, setDirty] = useState(false);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchFeed = useCallback(async (reset: boolean) => {
    if (reset) {
      setLoading(true);
      seenIdsRef.current = new Set();
    } else {
      setLoadingMore(true);
    }

    const seenIds = Array.from(seenIdsRef.current).join(',');
    const params = new URLSearchParams({
      userId: VIEWER_ID,
      limit: String(PAGE_LIMIT),
    });
    if (seenIds) params.set('seenIds', seenIds);

    try {
      const res = await fetch(`/api/feed?${params.toString()}`);
      if (!res.ok) throw new Error(`Feed API ${res.status}`);
      const data = (await res.json()) as { tweets: ScoredCandidate[] };
      const next = data.tweets ?? [];
      next.forEach((c) => seenIdsRef.current.add(c.tweet.id));

      if (reset) {
        setTweets(next);
      } else {
        setTweets((prev) => [...prev, ...next]);
      }
      setHasMore(next.length === PAGE_LIMIT);
    } catch (err) {
      console.error('[FEED] fetch error:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setDirty(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  useEffect(() => {
    const es = new EventSource(`/api/feed/stream?userId=${VIEWER_ID}`);
    es.addEventListener('feed', () => setDirty(true));
    return () => es.close();
  }, []);

  useEffect(() => {
    const handler = () => fetchFeed(true);
    window.addEventListener('v6:weights-saved', handler);
    return () => window.removeEventListener('v6:weights-saved', handler);
  }, [fetchFeed]);

  useEffect(() => {
    if (!bottomRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && !loading) {
          fetchFeed(false);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [fetchFeed, hasMore, loadingMore, loading]);

  if (loading) return <FeedSkeleton />;

  return (
    <div>
      {dirty && (
        <button
          type="button"
          className="w-full py-3 text-sm font-medium text-[#1D9BF0] hover:bg-[#1D9BF0]/5 border-b border-[#2F3336] transition-colors sticky top-[57px] z-10"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
          onClick={() => fetchFeed(true)}
        >
          New tweets available — tap to refresh
        </button>
      )}

      <div className="flex flex-col divide-y divide-[#2F3336]">
        {tweets.map((candidate) => (
          <TweetCard key={candidate.tweet.id} candidate={candidate} />
        ))}
      </div>

      {loadingMore && (
        <div className="p-6 text-center text-[#71767B] text-sm">Loading more…</div>
      )}

      {!hasMore && tweets.length > 0 && (
        <div className="p-6 text-center text-[#71767B] text-sm">You&apos;re all caught up</div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}

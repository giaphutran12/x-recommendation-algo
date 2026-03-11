'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type FeedContextType = {
  feedVersion: number;
  notifyFeedRefresh: () => void;
};

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [feedVersion, setFeedVersion] = useState(0);
  const notifyFeedRefresh = useCallback(() => setFeedVersion(v => v + 1), []);
  return (
    <FeedContext value={{ feedVersion, notifyFeedRefresh }}>
      {children}
    </FeedContext>
  );
}

export function useFeedContext() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error('useFeedContext must be used within FeedProvider');
  return ctx;
}

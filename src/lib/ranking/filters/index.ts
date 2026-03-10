import type { Filter } from '@/lib/types/pipeline';
import { DropDuplicatesFilter } from './drop-duplicates-filter';
import { CoreDataHydrationFilter } from './core-data-hydration-filter';
import { SelfTweetFilter } from './self-tweet-filter';
import { PreviouslySeenFilter } from './previously-seen-filter';
import { PreviouslyServedFilter } from './previously-served-filter';
import { BlockedAuthorFilter } from './blocked-author-filter';
import { MutedKeywordFilter } from './muted-keyword-filter';
import { AgeFilter } from './age-filter';
import { RepostDedupFilter } from './repost-dedup-filter';
import { ConversationDedupFilter } from './conversation-dedup-filter';

export {
  DropDuplicatesFilter,
  CoreDataHydrationFilter,
  SelfTweetFilter,
  PreviouslySeenFilter,
  PreviouslyServedFilter,
  BlockedAuthorFilter,
  MutedKeywordFilter,
  AgeFilter,
  RepostDedupFilter,
  ConversationDedupFilter,
};

export function createFilterChain(options?: {
  blockedAuthorIds?: string[];
  mutedKeywords?: string[];
  maxAgeMsOverride?: number;
}): Filter[] {
  return [
    new DropDuplicatesFilter(),
    new CoreDataHydrationFilter(),
    new SelfTweetFilter(),
    new PreviouslySeenFilter(),
    new PreviouslyServedFilter(),
    new BlockedAuthorFilter(options?.blockedAuthorIds),
    new MutedKeywordFilter(options?.mutedKeywords),
    new AgeFilter(options?.maxAgeMsOverride),
    new RepostDedupFilter(),
    new ConversationDedupFilter(),
  ];
}

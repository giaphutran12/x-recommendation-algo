import type { Filter } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';

export class ConversationDedupFilter implements Filter {
  readonly name = 'ConversationDedupFilter';

  filter(_query: FeedQuery, candidates: ScoredCandidate[]): ScoredCandidate[] {
    const conversationGroups = new Map<string, ScoredCandidate[]>();
    const noParent: ScoredCandidate[] = [];

    for (const candidate of candidates) {
      const parentId = candidate.tweet.parent_tweet_id;
      if (parentId) {
        const group = conversationGroups.get(parentId);
        if (group) {
          group.push(candidate);
        } else {
          conversationGroups.set(parentId, [candidate]);
        }
      } else {
        noParent.push(candidate);
      }
    }

    const keptFromConversations: ScoredCandidate[] = [];
    for (const group of conversationGroups.values()) {
      const best = group.reduce((a, b) => {
        const engagementA = a.tweet.like_count + a.tweet.reply_count;
        const engagementB = b.tweet.like_count + b.tweet.reply_count;
        return engagementA >= engagementB ? a : b;
      });
      keptFromConversations.push(best);
    }

    const result = [...noParent, ...keptFromConversations];
    const removedCount = candidates.length - result.length;
    console.log(`[RANK] ${this.name}: removed ${removedCount} candidates (${result.length} remaining)`);
    return result;
  }
}

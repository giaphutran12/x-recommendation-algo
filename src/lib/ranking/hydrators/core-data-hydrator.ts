import type { SupabaseClient } from '@supabase/supabase-js';
import type { Hydrator } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { Tweet, User } from '@/lib/types/database';

export class CoreDataHydrator implements Hydrator {
  readonly name = 'CoreDataHydrator';

  constructor(private supabase: SupabaseClient) {}

  async hydrate(
    _query: FeedQuery,
    candidates: ScoredCandidate[]
  ): Promise<ScoredCandidate[]> {
    if (candidates.length === 0) return candidates;

    const tweetIds = candidates.map((c) => c.tweet.id);
    const authorIds = [...new Set(candidates.map((c) => c.tweet.author_id))];

    const [tweetsResult, authorsResult] = await Promise.all([
      this.supabase.from('tweets').select('*').in('id', tweetIds),
      this.supabase.from('users').select('*').in('id', authorIds),
    ]);

    const tweetsMap = new Map<string, Tweet>();
    if (tweetsResult.data) {
      for (const tweet of tweetsResult.data) {
        tweetsMap.set(tweet.id, tweet as Tweet);
      }
    }

    const authorsMap = new Map<string, User>();
    if (authorsResult.data) {
      for (const author of authorsResult.data) {
        authorsMap.set(author.id, author as User);
      }
    }

    const hydrated: ScoredCandidate[] = [];
    const now = Date.now();

    for (const candidate of candidates) {
      const tweet = tweetsMap.get(candidate.tweet.id);
      const author = authorsMap.get(candidate.tweet.author_id);

      if (!tweet || !author) continue;

      const createdAt = new Date(tweet.created_at).getTime();
      const tweetAgeHours = (now - createdAt) / (1000 * 60 * 60);

      candidate.tweet = tweet;
      candidate.author = author;

      (candidate as ScoredCandidateWithDerived).tweet_age_hours = tweetAgeHours;
      (candidate as ScoredCandidateWithDerived).is_reply =
        tweet.parent_tweet_id !== null;
      (candidate as ScoredCandidateWithDerived).is_quote =
        tweet.quoted_tweet_id !== null;

      hydrated.push(candidate);
    }

    console.log(`[RANK] Hydrated ${hydrated.length} candidates with core data`);
    return hydrated;
  }
}

export interface ScoredCandidateWithDerived extends ScoredCandidate {
  tweet_age_hours: number;
  is_reply: boolean;
  is_quote: boolean;
}

import type { CandidateSource } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import { getLocalDataStore } from '@/lib/local-data';

const IN_NETWORK_TIME_WINDOW_HOURS = 8760;
const IN_NETWORK_MAX_CANDIDATES = 200;

export class LocalInNetworkSource implements CandidateSource {
  readonly name = 'InNetworkSource';

  async retrieve(query: FeedQuery): Promise<ScoredCandidate[]> {
    const store = getLocalDataStore();
    const followedIds = store.getFollowedIds(query.viewer_id);

    if (followedIds.length === 0) {
      console.log('[RANK] In-network source (local): retrieved 0 candidates from 0 followed accounts');
      return [];
    }

    const cutoff = new Date(Date.now() - IN_NETWORK_TIME_WINDOW_HOURS * 60 * 60 * 1000);
    const tweets = store.getTweetsByAuthors(followedIds, cutoff, IN_NETWORK_MAX_CANDIDATES);

    const candidates: ScoredCandidate[] = [];
    for (const tweet of tweets) {
      const author = store.getUser(tweet.author_id);
      if (!author) continue;
      candidates.push({
        tweet,
        author,
        score: 0,
        in_network: true,
        engagement_predictions: null,
        explanation: null,
      });
    }

    console.log(
      `[RANK] In-network source (local): retrieved ${candidates.length} candidates from ${followedIds.length} followed accounts`
    );
    return candidates;
  }
}

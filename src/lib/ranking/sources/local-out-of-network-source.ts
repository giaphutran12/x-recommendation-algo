import type { CandidateSource } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import { getLocalDataStore } from '@/lib/local-data';

const OON_TIME_WINDOW_HOURS = 8760;
const OON_MAX_CANDIDATES = 100;

export class LocalOutOfNetworkSource implements CandidateSource {
  readonly name = 'OutOfNetworkSource';

  async retrieve(query: FeedQuery): Promise<ScoredCandidate[]> {
    const store = getLocalDataStore();
    const followedIds = store.getFollowedIds(query.viewer_id);
    const excludedIds = [query.viewer_id, ...followedIds];
    const cutoff = new Date(Date.now() - OON_TIME_WINDOW_HOURS * 60 * 60 * 1000);
    const tweets = store.getTweetsByPopularity(excludedIds, cutoff, OON_MAX_CANDIDATES);

    const candidates: ScoredCandidate[] = [];
    for (const tweet of tweets) {
      const author = store.getUser(tweet.author_id);
      if (!author) continue;
      candidates.push({
        tweet,
        author,
        score: 0,
        in_network: false,
        engagement_predictions: null,
        explanation: null,
      });
    }

    console.log(
      `[RANK] Out-of-network source (local): retrieved ${candidates.length} candidates via popularity`
    );
    return candidates;
  }
}

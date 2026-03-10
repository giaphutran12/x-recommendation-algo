import type { Scorer } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate } from '@/lib/types/ranking';
import type { EngagementType } from '@/lib/types/database';

export const WeightedScorer: Scorer = {
  name: 'WeightedScorer',

  async score(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]> {
    const now = Date.now();
    const weights = query.algorithm_weights;

    const scored = candidates.map((candidate) => {
      const { tweet } = candidate;
      const predictions = candidate.engagement_predictions;

      const tweetAgeHours = (now - new Date(tweet.created_at).getTime()) / (1000 * 60 * 60);

      const recencyScore = weights.recency_weight * Math.max(0, 1 - tweetAgeHours / 48);

      const popularityScore =
        weights.popularity_weight *
        Math.log1p(tweet.like_count + tweet.reply_count + tweet.repost_count) /
        10;

      const networkScore = weights.network_weight * (candidate.in_network ? 1.0 : 0.3);

      const topicScore =
        weights.topic_relevance_weight *
        (candidate.author.interests.includes(tweet.topic) ? 1.0 : 0.2);

      const engagementTypeScores = {} as Record<EngagementType, number>;
      let engagementTotal = 0;

      if (predictions) {
        const engagementTypes: EngagementType[] = [
          'like',
          'reply',
          'repost',
          'click',
          'follow_author',
          'not_interested',
        ];
        for (const type of engagementTypes) {
          const weight = weights.engagement_type_weights[type] ?? 0;
          const prediction = predictions[type];
          const contribution = weight * prediction;
          engagementTypeScores[type] = contribution;
          engagementTotal += contribution;
        }
      } else {
        const engagementTypes: EngagementType[] = [
          'like',
          'reply',
          'repost',
          'click',
          'follow_author',
          'not_interested',
        ];
        for (const type of engagementTypes) {
          engagementTypeScores[type] = 0;
        }
      }

      const totalScore = recencyScore + popularityScore + networkScore + topicScore + engagementTotal;

      return {
        ...candidate,
        score: totalScore,
        explanation: {
          recencyScore,
          popularityScore,
          networkScore,
          topicScore,
          engagementTypeScores,
          authorDiversityMultiplier: 1.0,
          oonMultiplier: 1.0,
          totalScore,
        },
      };
    });

    const scores = scored.map((c) => c.score);
    const min = scores.length ? Math.min(...scores).toFixed(4) : 'N/A';
    const max = scores.length ? Math.max(...scores).toFixed(4) : 'N/A';

    console.log(`[RANK] Weighted scorer: scored ${scored.length} candidates, range [${min}, ${max}]`);

    return scored;
  },
};

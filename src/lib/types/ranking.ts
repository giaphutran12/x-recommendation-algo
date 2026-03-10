// Ranking and scoring types for the feed algorithm
// Carries candidate data through the pipeline with scores and explanations

import type { Tweet, User, AlgorithmWeights, EngagementType } from './database';

export interface FeedQuery {
  viewer_id: string;
  seen_ids: string[];
  served_ids: string[];
  algorithm_weights: AlgorithmWeights;
  limit: number;
}

export interface EngagementPredictions {
  like: number;
  reply: number;
  repost: number;
  click: number;
  follow_author: number;
  not_interested: number;
}

export interface ScoreExplanation {
  recencyScore: number;
  popularityScore: number;
  networkScore: number;
  topicScore: number;
  engagementTypeScores: Record<EngagementType, number>;
  authorDiversityMultiplier: number;
  oonMultiplier: number;
  totalScore: number;
}

export interface ScoredCandidate {
  tweet: Tweet;
  author: User;
  score: number;
  in_network: boolean;
  engagement_predictions: EngagementPredictions | null;
  explanation: ScoreExplanation | null;
}

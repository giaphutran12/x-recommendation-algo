// Database schema types
// Mirrors the Supabase schema for tweets, users, engagements, and algorithm configuration

export type PersonaType = 'founder' | 'journalist' | 'meme' | 'trader' | 'politician' | 'tech' | 'culture';
export type TweetType = 'original' | 'reply' | 'quote' | 'repost';
export type EngagementType = 'like' | 'reply' | 'repost' | 'click' | 'follow_author' | 'not_interested';

export interface User {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  persona_type: PersonaType;
  interests: string[];
  writing_style: string;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface Tweet {
  id: string;
  author_id: string;
  content: string;
  tweet_type: TweetType;
  parent_tweet_id: string | null;
  quoted_tweet_id: string | null;
  topic: string;
  embedding: number[] | null;
  like_count: number;
  reply_count: number;
  repost_count: number;
  click_count: number;
  created_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface Engagement {
  id: string;
  user_id: string;
  tweet_id: string;
  engagement_type: EngagementType;
  created_at: string;
}

export interface AlgorithmWeights {
  user_id: string;
  recency_weight: number;
  popularity_weight: number;
  network_weight: number;
  topic_relevance_weight: number;
  engagement_type_weights: Record<EngagementType, number>;
  updated_at: string;
}

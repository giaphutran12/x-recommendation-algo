-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Persona type enum
CREATE TYPE persona_type AS ENUM ('founder', 'journalist', 'meme', 'trader', 'politician', 'tech', 'culture');

-- Tweet type enum
CREATE TYPE tweet_type AS ENUM ('original', 'reply', 'quote', 'repost');

-- Engagement type enum
CREATE TYPE engagement_type AS ENUM ('like', 'reply', 'repost', 'click', 'follow_author', 'not_interested');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  persona_type persona_type NOT NULL,
  interests TEXT[] DEFAULT '{}',
  writing_style TEXT DEFAULT '',
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tweets table
CREATE TABLE tweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tweet_type tweet_type NOT NULL DEFAULT 'original',
  parent_tweet_id UUID REFERENCES tweets(id) ON DELETE SET NULL,
  quoted_tweet_id UUID REFERENCES tweets(id) ON DELETE SET NULL,
  topic TEXT DEFAULT '',
  embedding vector(1536),  -- Gemini embedding-001 via Matryoshka at 1536-dim
  like_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  repost_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Follows table
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

-- Engagements table
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
  engagement_type engagement_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Algorithm weights table
CREATE TABLE algorithm_weights (
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recency_weight FLOAT DEFAULT 0.5,
  popularity_weight FLOAT DEFAULT 0.5,
  network_weight FLOAT DEFAULT 0.5,
  topic_relevance_weight FLOAT DEFAULT 0.5,
  engagement_type_weights JSONB DEFAULT '{"like": 1.0, "reply": 1.5, "repost": 1.0, "click": 0.5, "follow_author": 2.0, "not_interested": -3.0}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tweets_author_created ON tweets(author_id, created_at DESC);
CREATE INDEX idx_engagements_user ON engagements(user_id);
CREATE INDEX idx_engagements_tweet ON engagements(tweet_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

-- pgvector ivfflat index for cosine similarity (needs data to build, so create after seed)
-- Note: ivfflat index requires existing data. We create it here but it will be rebuilt after seeding.
CREATE INDEX idx_tweets_embedding ON tweets USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- Insert viewer user (hardcoded UUID for single-user demo)
INSERT INTO users (id, username, display_name, bio, persona_type, interests)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'viewer',
  'You',
  'The person watching the feed',
  'tech',
  ARRAY['ai', 'startups', 'tech', 'open_source']
);

-- Insert default algorithm weights for viewer
INSERT INTO algorithm_weights (user_id)
VALUES ('00000000-0000-0000-0000-000000000001');

-- RLS policies (permissive for demo)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE algorithm_weights ENABLE ROW LEVEL SECURITY;

-- Allow all reads for anon
CREATE POLICY "Allow read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON tweets FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON follows FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON engagements FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON algorithm_weights FOR SELECT USING (true);

-- Allow all writes for service role (used by seed script)
CREATE POLICY "Allow service role write" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write" ON tweets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write" ON engagements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow service role write" ON algorithm_weights FOR ALL USING (true) WITH CHECK (true);

-- Allow anon to update algorithm_weights (for slider changes)
CREATE POLICY "Allow anon update weights" ON algorithm_weights FOR UPDATE USING (true) WITH CHECK (true);

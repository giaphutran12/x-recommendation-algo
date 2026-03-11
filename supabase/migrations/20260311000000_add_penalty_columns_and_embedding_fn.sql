-- Add missing oon_penalty and diversity_decay columns to algorithm_weights
-- These were added to the TypeScript types/API/UI but never to the DB schema
ALTER TABLE algorithm_weights
ADD COLUMN IF NOT EXISTS oon_penalty FLOAT DEFAULT 0.7,
ADD COLUMN IF NOT EXISTS diversity_decay FLOAT DEFAULT 0.5;

-- Notify PostgREST to reload schema cache immediately
NOTIFY pgrst, 'reload schema';

-- Create the embedding similarity search function for out-of-network retrieval
-- Called by OutOfNetworkSource.retrieveByEmbedding() via supabase.rpc()
CREATE OR REPLACE FUNCTION match_tweets_by_embedding(
  query_embedding TEXT,
  excluded_author_ids UUID[],
  time_cutoff TIMESTAMPTZ,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  author_id UUID,
  content TEXT,
  tweet_type tweet_type,
  parent_tweet_id UUID,
  quoted_tweet_id UUID,
  topic TEXT,
  embedding vector(1536),
  like_count INTEGER,
  reply_count INTEGER,
  repost_count INTEGER,
  click_count INTEGER,
  created_at TIMESTAMPTZ,
  author JSONB
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.author_id,
    t.content,
    t.tweet_type,
    t.parent_tweet_id,
    t.quoted_tweet_id,
    t.topic,
    t.embedding,
    t.like_count,
    t.reply_count,
    t.repost_count,
    t.click_count,
    t.created_at,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'display_name', u.display_name,
      'bio', u.bio,
      'avatar_url', u.avatar_url,
      'persona_type', u.persona_type,
      'interests', to_jsonb(u.interests),
      'writing_style', u.writing_style,
      'follower_count', u.follower_count,
      'following_count', u.following_count,
      'created_at', u.created_at
    ) AS author
  FROM tweets t
  JOIN users u ON u.id = t.author_id
  WHERE t.author_id != ALL(excluded_author_ids)
    AND t.created_at >= time_cutoff
    AND t.embedding IS NOT NULL
  ORDER BY t.embedding <=> query_embedding::vector(1536)
  LIMIT match_count;
END;
$$;

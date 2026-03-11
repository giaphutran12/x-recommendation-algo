import path from 'path';
import fs from 'fs';
import type { Scorer } from '@/lib/types/pipeline';
import type { FeedQuery, ScoredCandidate, EngagementPredictions } from '@/lib/types/ranking';

// ─── Feature config shape (from models/feature_config.json) ───

interface FeatureConfig {
  feature_names: string[];
  n_features: number;
  engagement_types: string[];
  follower_tier_map: Record<string, number>;
  tweet_type_map: Record<string, number>;
  topic_to_idx: Record<string, number>;
  user_to_idx: Record<string, number>;
  n_users: number;
  normalization: {
    age_hours_divisor: number;
    engagement_counts: string;
  };
}

// ─── ONNX session holder (loaded once at module init) ───

interface OnnxResources {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  config: FeatureConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ort: typeof import('onnxruntime-node');
}

let onnxResources: OnnxResources | null = null;
let onnxPermanentlyFailed = false;

async function tryLoadOnnx(): Promise<OnnxResources | null> {
  if (onnxResources) return onnxResources;
  if (onnxPermanentlyFailed) return null;

  const modelPath = path.join(process.cwd(), 'models', 'two_tower.onnx');
  const configPath = path.join(process.cwd(), 'models', 'feature_config.json');

  if (!fs.existsSync(modelPath) || !fs.existsSync(configPath)) {
    onnxPermanentlyFailed = true;
    return null;
  }

  try {
    const ort = await import('onnxruntime-node');
    const session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['cpu'],
    });
    const config: FeatureConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    onnxResources = { session, config, ort };
    console.log('[RANK] ONNX engagement model loaded');
    return onnxResources;
  } catch (err) {
    const errStr = String(err);
    if (errStr.includes('ENOENT') || errStr.includes('no such file')) {
      onnxPermanentlyFailed = true;
    }
    console.warn('[RANK] Failed to load ONNX model, falling back to heuristic:', err);
    return null;
  }
}

// ─── Feature extraction (mirrors training/two_tower.py encode_tweet_features) ───

function followerCountToTier(count: number, tierMap: Record<string, number>): number {
  if (count >= 1_000_000) return tierMap['mega'] ?? 3;
  if (count >= 100_000) return tierMap['macro'] ?? 2;
  if (count >= 10_000) return tierMap['mid'] ?? 1;
  return tierMap['micro'] ?? 0;
}

function buildTweetFeatures(
  candidate: ScoredCandidate,
  config: FeatureConfig,
  nowMs: number,
): Float32Array {
  const { tweet, author } = candidate;

  const tier = followerCountToTier(author.follower_count, config.follower_tier_map);
  const topicId = config.topic_to_idx[tweet.topic ?? ''] ?? 0;
  const tweetTypeStr = tweet.tweet_type ?? 'original';
  const tweetTypeId = config.tweet_type_map[tweetTypeStr] ?? 0;

  const createdAtMs = new Date(tweet.created_at).getTime();
  const ageHours = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60));
  const ageNorm = Math.min(1, ageHours / (config.normalization.age_hours_divisor ?? 168));

  const likeLog = Math.log1p(tweet.like_count ?? 0);
  const replyLog = Math.log1p(tweet.reply_count ?? 0);
  const repostLog = Math.log1p(tweet.repost_count ?? 0);

  const isReply = tweetTypeStr === 'reply' ? 1.0 : 0.0;
  const isQuote = tweetTypeStr === 'quote' ? 1.0 : 0.0;

  return new Float32Array([tier, topicId, tweetTypeId, ageNorm, likeLog, replyLog, repostLog, isReply, isQuote]);
}

// ─── ONNX inference path ───

async function scoreWithOnnx(
  resources: OnnxResources,
  query: FeedQuery,
  candidates: ScoredCandidate[],
): Promise<ScoredCandidate[]> {
  const { session, config, ort } = resources;
  const n = candidates.length;
  const nowMs = Date.now();

  const viewerIdx = BigInt(config.user_to_idx[query.viewer_id] ?? 0);
  const userIdData = new BigInt64Array(n).fill(viewerIdx);

  const N_FEATURES = config.n_features ?? 9;
  const tweetFeatData = new Float32Array(n * N_FEATURES);
  for (let i = 0; i < n; i++) {
    const feats = buildTweetFeatures(candidates[i], config, nowMs);
    tweetFeatData.set(feats, i * N_FEATURES);
  }

  const userIdTensor = new ort.Tensor('int64', userIdData, [n]);
  const tweetFeatTensor = new ort.Tensor('float32', tweetFeatData, [n, N_FEATURES]);

  const results = await session.run({ user_id: userIdTensor, tweet_features: tweetFeatTensor });
  const probs: Float32Array = results['engagement_probs'].data as Float32Array;

  return candidates.map((candidate, i) => {
    const base = i * 6;
    const predictions: EngagementPredictions = {
      like: probs[base + 0],
      reply: probs[base + 1],
      repost: probs[base + 2],
      click: probs[base + 3],
      follow_author: probs[base + 4],
      not_interested: probs[base + 5],
    };
    return { ...candidate, engagement_predictions: predictions };
  });
}

// ─── Heuristic fallback (original implementation) ───

function scoreWithHeuristic(candidates: ScoredCandidate[]): ScoredCandidate[] {
  const now = Date.now();

  return candidates.map((candidate) => {
    const { tweet, author } = candidate;

    const tweetAgeMs = now - new Date(tweet.created_at).getTime();
    const tweetAgeHours = tweetAgeMs / (1000 * 60 * 60);

    const like =
      Math.min(0.8, 0.05 + (author.follower_count / 100000) * 0.3) *
      Math.max(0.1, 1 - tweetAgeHours / 48);

    const reply = tweet.content.includes('?') ? 0.15 : 0.05;
    const repost = Math.min(0.5, 0.02 + (tweet.like_count + tweet.repost_count) / 1000);
    const click = 0.1;
    const follow_author = candidate.in_network ? 0.01 : 0.05;
    const not_interested = 0.05;

    return {
      ...candidate,
      engagement_predictions: { like, reply, repost, click, follow_author, not_interested },
    };
  });
}

// ─── Scorer ───

export const EngagementPredictor: Scorer = {
  name: 'EngagementPredictor',

  async score(query: FeedQuery, candidates: ScoredCandidate[]): Promise<ScoredCandidate[]> {
    const resources = await tryLoadOnnx();

    if (resources) {
      const t0 = Date.now();
      const scored = await scoreWithOnnx(resources, query, candidates);
      const ms = Date.now() - t0;
      console.log(`[RANK] Engagement predictions (ONNX): scored ${scored.length} candidates (${ms}ms)`);
      return scored;
    }

    const scored = scoreWithHeuristic(candidates);
    console.log(`[RANK] Engagement predictions (heuristic): scored ${scored.length} candidates`);
    return scored;
  },
};

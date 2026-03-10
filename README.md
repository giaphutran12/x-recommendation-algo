# X Recommendation Algorithm

A TypeScript reimplementation of X/Twitter's recommendation algorithm, inspired by their open-sourced `xai-org/x-algorithm`. This is a single-user demo app that ranks 50K tweets for one persona using a two-tower neural network and a 5-stage ranking pipeline.

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1 | Web framework (Turbopack, Server Components) |
| React | 19.2 | UI library |
| Supabase | v2 | Postgres database + pgvector for embeddings |
| PyTorch | latest | Neural network training |
| ONNX Runtime | 1.20 | Model inference in TypeScript |
| Tailwind CSS | v4 | CSS-first styling (no config.js) |
| shadcn/ui | latest | Component library |
| Vitest | 4.0 | Unit + integration tests |
| Bun | 1.3 | Package manager + test runner |

## The Big Picture

The ranking pipeline takes 50K tweets and 338K engagement records, then produces a ranked feed of 50 tweets tailored to one user.

```
50K tweets + 200 personas + 338K engagements
              |
    Stage 1: Candidate Retrieval (parallel)
    |-- In-Network: tweets from followed accounts
    |-- Out-of-Network: embedding similarity + popularity fallback
              |
    Stage 2: Hydration (sequential)
    |-- Enrich with engagement counts (like, reply, repost)
              |
    Stage 3: Filtering (sequential, 10 filters)
    |-- Drop duplicates, check age, blocked authors, muted keywords
    |-- Remove self-tweets, previously seen/served
    |-- Dedup reposts and conversation threads
              |
    Stage 4: Scoring (sequential, 4 scorers)
    |-- EngagementPredictor: Two-Tower ONNX model → P(like), P(reply), ...
    |-- WeightedScorer: combine predictions with user weights
    |-- AuthorDiversityScorer: penalize repeated authors
    |-- OON Scorer: penalize out-of-network tweets
              |
    Stage 5: Selection (sequential)
    |-- Top-K with diversity enforcement
              |
    Feed: 50 ranked tweets with score explanations
```

## The Ranking Pipeline

The pipeline is a **5-stage orchestrator** that processes candidates sequentially through retrieval, hydration, filtering, scoring, and selection. Sources run in parallel; everything else is sequential.

### Pipeline Wiring

```typescript
// src/lib/ranking/create-pipeline.ts
new RankingPipeline(
  [new InNetworkSource(supabase), new OutOfNetworkSource(supabase)],
  [new EngagementHydrator(supabase)],
  createFilterChain(),    // 10 filters
  createScorerChain(),    // 4 scorers
  [new TopKSelector()],
);
```

### Execute Method

```typescript
// src/lib/ranking/pipeline.ts (simplified)
async execute(query: FeedQuery): Promise<ScoredCandidate[]> {
  // 1. Retrieve from all sources in parallel
  const candidates = await Promise.all(
    this.sources.map(source => source.retrieve(query))
  ).then(results => results.flat());

  // 2-5. Hydrate, filter, score, select sequentially
  for (const hydrator of this.hydrators) {
    candidates = await hydrator.hydrate(query, candidates);
  }
  for (const filter of this.filters) {
    candidates = filter.filter(query, candidates);
  }
  for (const scorer of this.scorers) {
    candidates = await scorer.score(query, candidates);
  }
  for (const selector of this.selectors) {
    candidates = selector.select(query, candidates);
  }

  return candidates;
}
```

### The 10 Filters

1. **DropDuplicatesFilter** — Remove exact duplicate tweets
2. **CoreDataHydrationFilter** — Ensure tweet has required fields
3. **SelfTweetFilter** — Hide tweets from the user themselves
4. **PreviouslySeenFilter** — Hide tweets the user has already seen
5. **PreviouslyServedFilter** — Hide tweets already shown in this feed
6. **BlockedAuthorFilter** — Hide tweets from blocked authors
7. **MutedKeywordFilter** — Hide tweets with muted keywords
8. **AgeFilter** — Hide tweets older than 7 days
9. **RepostDedupFilter** — Keep only one repost of the same original
10. **ConversationDedupFilter** — Keep only one tweet per conversation thread

## The Two-Tower Neural Network

This is the core of the ranking system. It answers: "Given a user and a tweet, how likely is the user to like/reply/repost/click/follow/block?"

### Why "Two-Tower"?

A **two-tower architecture** is two separate neural networks (towers) that learn independent representations of users and tweets, then combine them via **dot product** (a measure of similarity). This design scales well because you can precompute user embeddings once, then quickly score any tweet against them.

### Architecture Diagram

```
User Tower:                    Tweet Tower:
user_id                        9 features
  |                              |
  v                              v
Embedding(64-dim)            Dense(9→64)
  |                              |
  v                              v
Dense(64→32)                  ReLU
  |                              |
  v                              v
user_vector (32-dim)         Dense(64→32)
  |                              |
  +---------- dot product -------+
             (u · t)
              |
              v
         Expand to 6 + bias
              |
              v
         6 sigmoid outputs
    [P(like), P(reply), P(repost), P(click), P(follow), P(not_interested)]
```

### The 9 Tweet Features

1. **author_follower_tier** — Bucketed follower count (micro/mid/macro/mega)
2. **topic_id** — Topic category (mapped to integer)
3. **tweet_type** — original/reply/quote/repost
4. **age_hours_norm** — Hours since creation, normalized to 0-1 over 1 week
5. **like_count_log1p** — log(1 + like_count)
6. **reply_count_log1p** — log(1 + reply_count)
7. **repost_count_log1p** — log(1 + repost_count)
8. **is_reply** — Binary flag
9. **is_quote** — Binary flag

### Training Details

- **Dataset**: 676K samples (338K positive + 338K negative via **negative sampling**)
- **Positive samples**: User-tweet pairs with at least one engagement
- **Negative samples**: Random user-tweet pairs with no engagement
- **Train/val split**: 80/20
- **Loss function**: **Binary cross-entropy (BCE)** — penalizes confident wrong answers heavily
- **Optimizer**: Adam, learning rate 0.001
- **Batch size**: 256
- **Early stopping**: Stopped at epoch 13 when validation loss plateaued (val_loss = 0.1845)

### PyTorch Model Class

```python
# training/two_tower.py
class TwoTowerModel(nn.Module):
    def __init__(self, n_users: int):
        super().__init__()
        self.user_tower = UserTower(n_users)
        self.tweet_tower = TweetTower()
        self.output_bias = nn.Parameter(torch.zeros(6))  # Per-task bias

    def forward(self, user_id: torch.Tensor, tweet_features: torch.Tensor) -> torch.Tensor:
        u = self.user_tower(user_id)           # (batch, 32)
        t = self.tweet_tower(tweet_features)   # (batch, 32)
        dot = (u * t).sum(dim=1, keepdim=True) # (batch, 1) — shared signal
        logits = dot.expand(-1, 6) + self.output_bias.unsqueeze(0)
        return torch.sigmoid(logits)            # (batch, 6)
```

### ONNX Inference in TypeScript

The trained PyTorch model is exported to **ONNX** (Open Neural Network Exchange), a format that lets you train in Python and run inference in any language.

```typescript
// src/lib/ranking/scorers/engagement-predictor.ts
async function scoreWithOnnx(
  resources: OnnxResources,
  query: FeedQuery,
  candidates: ScoredCandidate[],
): Promise<ScoredCandidate[]> {
  const { session, config, ort } = resources;
  const n = candidates.length;

  // Build user ID tensor (same for all candidates)
  const viewerIdx = BigInt(config.user_to_idx[query.viewer_id] ?? 0);
  const userIdData = new BigInt64Array(n).fill(viewerIdx);

  // Build tweet features tensor (9 features per tweet)
  const N_FEATURES = 9;
  const tweetFeatData = new Float32Array(n * N_FEATURES);
  for (let i = 0; i < n; i++) {
    const feats = buildTweetFeatures(candidates[i], config, Date.now());
    tweetFeatData.set(feats, i * N_FEATURES);
  }

  // Run inference
  const userIdTensor = new ort.Tensor('int64', userIdData, [n]);
  const tweetFeatTensor = new ort.Tensor('float32', tweetFeatData, [n, N_FEATURES]);
  const results = await session.run({
    user_id: userIdTensor,
    tweet_features: tweetFeatTensor,
  });

  // Extract 6 probabilities per candidate
  const probs: Float32Array = results['engagement_probs'].data;
  return candidates.map((candidate, i) => ({
    ...candidate,
    engagement_predictions: {
      like: probs[i * 6 + 0],
      reply: probs[i * 6 + 1],
      repost: probs[i * 6 + 2],
      click: probs[i * 6 + 3],
      follow_author: probs[i * 6 + 4],
      not_interested: probs[i * 6 + 5],
    },
  }));
}
```

### Heuristic Fallback

If the ONNX model file is missing, the system falls back to hand-tuned heuristic formulas. This keeps the app working during development.

## The Scoring Formula

The **WeightedScorer** combines multiple signals into a single score:

```
totalScore = recencyScore + popularityScore + networkScore + topicScore + engagementTotal

where:
  recencyScore = recency_weight * max(0, 1 - ageHours / 48)
  popularityScore = popularity_weight * log(likes + replies + reposts) / 10
  networkScore = network_weight * (in_network ? 1.0 : 0.3)
  topicScore = topic_relevance_weight * (author_interested ? 1.0 : 0.2)
  engagementTotal = sum of (engagement_type_weight * P(engagement_type)) for all 6 types
```

Then **AuthorDiversityScorer** applies exponential decay to repeated authors:

```
multiplier = (1 - FLOOR) * decay^position + FLOOR
newScore = score * multiplier

where FLOOR = 0.1, DECAY = 0.5, position = how many times this author appeared
```

Finally, **OON Scorer** penalizes out-of-network tweets:

```
score *= oon_penalty  (default 0.8)
```

## Data: Seed Pipeline

The system is seeded with synthetic data:

- **200 personas** across 7 types: founder, journalist, meme, trader, politician, tech, culture
- **50K tweets** generated from templates (no LLM needed)
- **338K engagement records** simulated based on persona interests
- **Follow graph** connecting personas
- **Gemini embeddings** for tweets (embedding-001, 1536-dim via Matryoshka)

## How to Run

### Install dependencies

```bash
bun install
pip install -r training/requirements.txt  # in training/.venv
```

### Set up environment

```bash
cp .env.local.example .env.local
# Fill in:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   DATABASE_URL (for training)
```

### Run migrations

```bash
npx supabase db push
```

### Seed database

```bash
bun run seed
```

### Train the neural network

```bash
DATABASE_URL=postgresql://... python3 training/two_tower.py
python3 training/export_onnx.py
```

This creates `models/two_tower.onnx` (3.6KB) and `models/feature_config.json`.

### Start the app

```bash
bun dev
# Open http://localhost:3000
```

## Project Structure

```
src/
  app/
    api/
      feed/route.ts          -- Feed endpoint (calls ranking pipeline)
      weights/route.ts       -- Algorithm weights CRUD
      seed/route.ts          -- Seed trigger
    v7/                      -- Main UI (dark theme, algorithm panel)
  lib/
    ranking/
      sources/               -- InNetworkSource, OutOfNetworkSource
      hydrators/             -- EngagementHydrator
      filters/               -- 10 filters
      scorers/               -- EngagementPredictor, WeightedScorer, AuthorDiversity, OON
      selectors/             -- TopKSelector
      pipeline.ts            -- RankingPipeline orchestrator
      create-pipeline.ts     -- Factory wiring all stages
    types/
      pipeline.ts            -- CandidateSource, Hydrator, Filter, Scorer, Selector interfaces
      ranking.ts             -- FeedQuery, ScoredCandidate, EngagementPredictions
      database.ts            -- Supabase schema types
    seed/                    -- Seed scripts (personas, tweets, engagements)
training/
  two_tower.py               -- PyTorch Two-Tower model + training loop
  export_onnx.py             -- ONNX export + verification
models/
  two_tower.onnx             -- Trained model (3.6KB)
  feature_config.json        -- Feature metadata + user/topic mappings
```

## Key Files Reference

| File | What it does |
|---|---|
| `src/lib/ranking/pipeline.ts` | Orchestrates the 5-stage ranking pipeline |
| `src/lib/ranking/create-pipeline.ts` | Factory that wires all stages together |
| `src/lib/ranking/scorers/engagement-predictor.ts` | Loads ONNX model, runs inference, falls back to heuristics |
| `src/lib/ranking/scorers/weighted-scorer.ts` | Combines predictions with user-tunable weights |
| `src/lib/ranking/scorers/author-diversity-scorer.ts` | Penalizes repeated authors with exponential decay |
| `src/lib/ranking/scorers/oon-scorer.ts` | Penalizes out-of-network tweets |
| `training/two_tower.py` | PyTorch Two-Tower model definition + training loop |
| `training/export_onnx.py` | Exports trained model to ONNX format |
| `src/app/api/feed/route.ts` | API endpoint that triggers the pipeline |
| `src/lib/seed/index.ts` | Master seed orchestrator |

## Key Concepts

**Two-Tower architecture**: Two separate neural networks that learn independent representations, combined via dot product. Scales well because user embeddings are precomputed once.

**Embedding**: A learned dense vector (list of numbers) that represents something (a user, a word) in a way that captures meaning. Similar things have similar embeddings.

**Dot product**: Multiply two vectors element-wise and sum. Higher values mean more similar. Used to measure how well a user embedding matches a tweet embedding.

**Sigmoid**: A function that squishes any number into the 0-1 range. Used to turn raw scores into probabilities.

**Binary cross-entropy (BCE)**: A loss function for yes/no predictions. Heavily penalizes confident wrong answers.

**Early stopping**: Stop training when validation loss stops improving. Prevents overfitting (memorizing training data instead of learning patterns).

**ONNX**: Open Neural Network Exchange. A format that lets you train a model in Python (PyTorch) and run inference in any language (TypeScript via onnxruntime-node).

**Negative sampling**: Creating fake "no engagement" examples so the model learns what disinterest looks like. Without negatives, the model only sees positive examples.

**Multi-task learning**: One model predicting multiple things at once (6 engagement types). Shared layers learn general patterns; task-specific biases learn differences.

**Exponential decay**: A multiplier that decreases exponentially with position. Used to penalize repeated authors: first mention gets 1.0x, second gets 0.5x, third gets 0.25x, etc.

## Notes for Future Self

- The ONNX model is tiny (3.6KB) because it's just 2 dense layers per tower + 6 output biases. The real complexity is in the training data and feature engineering.
- The heuristic fallback means the app works even if you delete the ONNX file. Useful for debugging.
- All server-side operations log with `[RANK]` or `[FEED]` tags. Check Vercel logs to see what's happening.
- The pipeline is designed to be extensible. Add new sources, filters, or scorers by implementing the interface and adding them to the chain.
- Personas are the "users" in this system. Each persona has interests, follower count, and a follow graph. The single-user demo always uses the first persona.

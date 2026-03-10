"""
Two-Tower Neural Network for Engagement Prediction.

Architecture:
  - User Tower:  user_id embedding (64-dim) → dense (64→32) → user_vector (32-dim)
  - Tweet Tower: tweet features (9) → dense (9→64→32) → tweet_vector (32-dim)
  - Interaction: dot product → 6 sigmoid outputs (P(like/reply/repost/click/follow_author/not_interested))

Usage:
    DATABASE_URL=postgresql://... python3 training/two_tower.py

Saves:
    models/two_tower.pt
"""

import os
import sys
import json
import math
import random
import time
from collections import defaultdict

from dotenv import load_dotenv

import numpy as np

# Load .env.local (Next.js convention)
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

# ─── Ensure we can import from venv ───
VENV = os.path.join(os.path.dirname(__file__), ".venv")
if os.path.isdir(VENV):
    sys.path.insert(0, os.path.join(VENV, "lib", "python3.14", "site-packages"))

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader, random_split

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    print("psycopg2 not found. Install via: pip install psycopg2-binary")
    sys.exit(1)

# ─── Config ───

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "two_tower.pt")

EMBEDDING_DIM = 64
TOWER_OUT_DIM = 32
N_ENGAGEMENT_TYPES = 6
ENGAGEMENT_TYPES = [
    "like",
    "reply",
    "repost",
    "click",
    "follow_author",
    "not_interested",
]

BATCH_SIZE = 256
EPOCHS = 50
PATIENCE = 5
LEARNING_RATE = 0.001
NEGATIVE_RATIO = 1  # 1:1 positive:negative

FOLLOWER_TIER_MAP = {"micro": 0, "mid": 1, "macro": 2, "mega": 3}
TWEET_TYPE_MAP = {"original": 0, "reply": 1, "quote": 2, "repost": 3}

N_TWEET_FEATURES = 9  # author_follower_tier, topic_id, tweet_type, age_hours, like_count, reply_count, repost_count, is_reply, is_quote

# ─── Feature helpers ───


def follower_count_to_tier(count: int) -> int:
    if count >= 1_000_000:
        return FOLLOWER_TIER_MAP["mega"]
    elif count >= 100_000:
        return FOLLOWER_TIER_MAP["macro"]
    elif count >= 10_000:
        return FOLLOWER_TIER_MAP["mid"]
    else:
        return FOLLOWER_TIER_MAP["micro"]


def encode_tweet_features(
    tweet: dict, author: dict, topic_to_idx: dict, now_ts: float
) -> list:
    """Return 9-dim float feature vector for a tweet."""
    tier = follower_count_to_tier(author.get("follower_count", 0))
    topic = tweet.get("topic", "") or ""
    topic_id = topic_to_idx.get(topic, 0)
    tweet_type_str = tweet.get("tweet_type", "original") or "original"
    tweet_type_id = TWEET_TYPE_MAP.get(tweet_type_str, 0)

    created_ts = tweet.get("created_ts", now_ts)
    age_hours = max(0.0, (now_ts - created_ts) / 3600)
    age_norm = min(1.0, age_hours / 168.0)  # normalise to 0-1 over 1 week

    like_count = math.log1p(tweet.get("like_count", 0))
    reply_count = math.log1p(tweet.get("reply_count", 0))
    repost_count = math.log1p(tweet.get("repost_count", 0))

    is_reply = 1.0 if tweet_type_str == "reply" else 0.0
    is_quote = 1.0 if tweet_type_str == "quote" else 0.0

    return [
        float(tier),
        float(topic_id),
        float(tweet_type_id),
        age_norm,
        like_count,
        reply_count,
        repost_count,
        is_reply,
        is_quote,
    ]


# ─── Model ───


class UserTower(nn.Module):
    def __init__(
        self,
        n_users: int,
        embedding_dim: int = EMBEDDING_DIM,
        out_dim: int = TOWER_OUT_DIM,
    ):
        super().__init__()
        self.embedding = nn.Embedding(n_users + 1, embedding_dim, padding_idx=0)
        self.fc = nn.Sequential(
            nn.Linear(embedding_dim, embedding_dim),
            nn.ReLU(),
            nn.Linear(embedding_dim, out_dim),
        )

    def forward(self, user_id: torch.Tensor) -> torch.Tensor:
        emb = self.embedding(user_id)
        return self.fc(emb)  # (batch, out_dim)


class TweetTower(nn.Module):
    def __init__(
        self, n_features: int = N_TWEET_FEATURES, out_dim: int = TOWER_OUT_DIM
    ):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(n_features, EMBEDDING_DIM),
            nn.ReLU(),
            nn.Linear(EMBEDDING_DIM, out_dim),
        )

    def forward(self, features: torch.Tensor) -> torch.Tensor:
        return self.fc(features)  # (batch, out_dim)


class TwoTowerModel(nn.Module):
    def __init__(self, n_users: int):
        super().__init__()
        self.user_tower = UserTower(n_users)
        self.tweet_tower = TweetTower()
        # Per-task bias for each engagement type
        self.output_bias = nn.Parameter(torch.zeros(N_ENGAGEMENT_TYPES))

    def forward(
        self, user_id: torch.Tensor, tweet_features: torch.Tensor
    ) -> torch.Tensor:
        u = self.user_tower(user_id)  # (batch, 32)
        t = self.tweet_tower(tweet_features)  # (batch, 32)
        dot = (u * t).sum(dim=1, keepdim=True)  # (batch, 1) — shared signal
        # Expand dot product to 6 tasks and add per-task bias
        logits = dot.expand(-1, N_ENGAGEMENT_TYPES) + self.output_bias.unsqueeze(0)
        return torch.sigmoid(logits)  # (batch, 6)


# ─── Dataset ───


class EngagementDataset(Dataset):
    def __init__(self, samples: list):
        """
        Each sample: (user_idx, tweet_features, labels)
          user_idx: int
          tweet_features: list of 9 floats
          labels: list of 6 floats (binary engagement flags per type)
        """
        self.samples = samples

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        user_idx, features, labels = self.samples[idx]
        return (
            torch.tensor(user_idx, dtype=torch.long),
            torch.tensor(features, dtype=torch.float32),
            torch.tensor(labels, dtype=torch.float32),
        )


# ─── Data loading ───


def load_data(db_url: str):
    """
    Connect to Supabase Postgres, load engagements + tweets + users.
    Returns (samples, topic_to_idx, user_to_idx, n_users).
    """
    print("[TRAIN] Connecting to database…")
    conn = psycopg2.connect(db_url)
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    now_ts = time.time()

    # ─── Load users (for follower_count lookup) ───
    print("[TRAIN] Loading users…")
    cur.execute("SELECT id, follower_count FROM users")
    users_raw = cur.fetchall()
    user_id_to_info = {
        row["id"]: {"follower_count": row["follower_count"]} for row in users_raw
    }

    # ─── Build user_id → idx mapping (stable order) ───
    user_ids = sorted(user_id_to_info.keys())
    user_to_idx = {
        uid: i + 1 for i, uid in enumerate(user_ids)
    }  # 1-indexed (0 = padding)
    n_users = len(user_ids)
    print(f"[TRAIN] Loaded {n_users} users")

    # ─── Load tweets ───
    print("[TRAIN] Loading tweets…")
    cur.execute("""
        SELECT id, author_id, topic, tweet_type, like_count, reply_count, repost_count,
               EXTRACT(EPOCH FROM created_at) AS created_ts
        FROM tweets
    """)
    tweets_raw = cur.fetchall()
    tweet_id_to_info = {
        row["id"]: {
            "author_id": row["author_id"],
            "topic": row["topic"] or "",
            "tweet_type": row["tweet_type"],
            "like_count": row["like_count"],
            "reply_count": row["reply_count"],
            "repost_count": row["repost_count"],
            "created_ts": float(row["created_ts"]),
        }
        for row in tweets_raw
    }
    tweet_ids = list(tweet_id_to_info.keys())
    print(f"[TRAIN] Loaded {len(tweet_ids)} tweets")

    # ─── Build topic → idx mapping ───
    all_topics = sorted(
        set(t["topic"] for t in tweet_id_to_info.values() if t["topic"])
    )
    topic_to_idx = {topic: i + 1 for i, topic in enumerate(all_topics)}  # 1-indexed
    print(f"[TRAIN] Found {len(topic_to_idx)} unique topics")

    # ─── Load engagements ───
    print("[TRAIN] Loading engagements…")
    cur.execute("SELECT user_id, tweet_id, engagement_type FROM engagements")
    engagements_raw = cur.fetchall()
    cur.close()
    conn.close()
    print(f"[TRAIN] Loaded {len(engagements_raw)} engagements")

    # ─── Build positive samples ───
    # user_tweet_engagements: {(user_id, tweet_id): set of engagement_types}
    user_tweet_engagements = defaultdict(set)
    for row in engagements_raw:
        user_tweet_engagements[(row["user_id"], row["tweet_id"])].add(
            row["engagement_type"]
        )

    # Set of tweet_ids engaged by each user (for negative sampling)
    user_engaged_tweets = defaultdict(set)
    for uid, tid in user_tweet_engagements:
        user_engaged_tweets[uid].add(tid)

    positive_samples = []
    for (uid, tid), eng_types in user_tweet_engagements.items():
        if uid not in user_to_idx or tid not in tweet_id_to_info:
            continue
        tweet = tweet_id_to_info[tid]
        author = user_id_to_info.get(tweet["author_id"], {"follower_count": 0})
        features = encode_tweet_features(tweet, author, topic_to_idx, now_ts)
        labels = [1.0 if etype in eng_types else 0.0 for etype in ENGAGEMENT_TYPES]
        positive_samples.append((user_to_idx[uid], features, labels))

    print(f"[TRAIN] Built {len(positive_samples)} positive samples")

    # ─── Build negative samples (1:1 ratio) ───
    print("[TRAIN] Generating negative samples…")
    n_negatives = len(positive_samples) * NEGATIVE_RATIO
    negative_samples = []
    all_user_ids = [uid for uid in user_to_idx if uid in user_engaged_tweets]
    rng = random.Random(42)

    attempts = 0
    max_attempts = n_negatives * 10
    while len(negative_samples) < n_negatives and attempts < max_attempts:
        attempts += 1
        uid = rng.choice(all_user_ids)
        tid = rng.choice(tweet_ids)
        if tid in user_engaged_tweets[uid]:
            continue  # skip — it's a positive
        if tid not in tweet_id_to_info:
            continue
        tweet = tweet_id_to_info[tid]
        author = user_id_to_info.get(tweet["author_id"], {"follower_count": 0})
        features = encode_tweet_features(tweet, author, topic_to_idx, now_ts)
        labels = [0.0] * N_ENGAGEMENT_TYPES  # all-zero labels for negatives
        negative_samples.append((user_to_idx[uid], features, labels))

    print(f"[TRAIN] Built {len(negative_samples)} negative samples")

    all_samples = positive_samples + negative_samples
    rng.shuffle(all_samples)
    print(f"[TRAIN] Total samples: {len(all_samples)}")

    return all_samples, topic_to_idx, user_to_idx, n_users


# ─── Training loop ───


def train(db_url: str):
    os.makedirs(MODELS_DIR, exist_ok=True)

    samples, topic_to_idx, user_to_idx, n_users = load_data(db_url)

    dataset = EngagementDataset(samples)
    n_train = int(len(dataset) * 0.8)
    n_val = len(dataset) - n_train
    train_ds, val_ds = random_split(
        dataset, [n_train, n_val], generator=torch.Generator().manual_seed(42)
    )

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_ds, batch_size=BATCH_SIZE, shuffle=False)

    model = TwoTowerModel(n_users=n_users)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.BCELoss()

    best_val_loss = float("inf")
    patience_counter = 0

    print(f"\n[TRAIN] Starting training: {n_train} train / {n_val} val samples")
    print(
        f"[TRAIN] Model: n_users={n_users}, epochs={EPOCHS}, batch={BATCH_SIZE}, lr={LEARNING_RATE}\n"
    )

    for epoch in range(1, EPOCHS + 1):
        model.train()
        train_loss = 0.0
        for user_ids, tweet_feats, labels in train_loader:
            optimizer.zero_grad()
            preds = model(user_ids, tweet_feats)
            loss = criterion(preds, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item() * len(user_ids)
        train_loss /= n_train

        model.eval()
        val_loss = 0.0
        with torch.no_grad():
            for user_ids, tweet_feats, labels in val_loader:
                preds = model(user_ids, tweet_feats)
                loss = criterion(preds, labels)
                val_loss += loss.item() * len(user_ids)
        val_loss /= n_val

        print(
            f"[TRAIN] Epoch {epoch:3d}/{EPOCHS} | train_loss={train_loss:.4f} | val_loss={val_loss:.4f}"
        )

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            patience_counter = 0
            # Save best model
            torch.save(
                {
                    "model_state": model.state_dict(),
                    "n_users": n_users,
                    "user_to_idx": user_to_idx,
                    "topic_to_idx": topic_to_idx,
                },
                MODEL_PATH,
            )
            print(f"[TRAIN]   ✓ Saved best model (val_loss={best_val_loss:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE:
                print(
                    f"[TRAIN] Early stopping at epoch {epoch} (no improvement for {PATIENCE} epochs)"
                )
                break

    print(f"\n[TRAIN] Training complete. Best val_loss={best_val_loss:.4f}")
    print(f"[TRAIN] Model saved to: {MODEL_PATH}")


# ─── Entry point ───

if __name__ == "__main__":
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        print("ERROR: DATABASE_URL environment variable is not set.")
        print("")
        print("Set it to your Supabase Postgres connection string:")
        print(
            "  export DATABASE_URL='postgresql://postgres.bqbvajvckanctysglyqj:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'"
        )
        print("")
        print("Then run:")
        print("  python3 training/two_tower.py")
        sys.exit(1)

    t0 = time.time()
    train(db_url)
    elapsed = time.time() - t0
    print(f"[TRAIN] Total time: {elapsed:.1f}s ({elapsed / 60:.1f} min)")

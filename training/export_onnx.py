"""
ONNX export for the Two-Tower model.

Usage:
    python3 training/export_onnx.py

Reads:  models/two_tower.pt
Writes: models/two_tower.onnx
        models/feature_config.json
"""

import os
import sys
import json

VENV = os.path.join(os.path.dirname(__file__), ".venv")
if os.path.isdir(VENV):
    sys.path.insert(0, os.path.join(VENV, "lib", "python3.14", "site-packages"))

import numpy as np
import torch
import onnx
import onnxruntime as ort

from two_tower import (
    TwoTowerModel,
    ENGAGEMENT_TYPES,
    N_TWEET_FEATURES,
    FOLLOWER_TIER_MAP,
    TWEET_TYPE_MAP,
)

MODELS_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
MODEL_PT_PATH = os.path.join(MODELS_DIR, "two_tower.pt")
MODEL_ONNX_PATH = os.path.join(MODELS_DIR, "two_tower.onnx")
FEATURE_CONFIG_PATH = os.path.join(MODELS_DIR, "feature_config.json")

MAX_DIFF_THRESHOLD = 0.001


def export():
    if not os.path.exists(MODEL_PT_PATH):
        print(f"ERROR: {MODEL_PT_PATH} not found. Run training/two_tower.py first.")
        sys.exit(1)

    print(f"[EXPORT] Loading model from {MODEL_PT_PATH}")
    checkpoint = torch.load(MODEL_PT_PATH, map_location="cpu", weights_only=False)

    n_users = checkpoint["n_users"]
    user_to_idx = checkpoint["user_to_idx"]
    topic_to_idx = checkpoint["topic_to_idx"]

    model = TwoTowerModel(n_users=n_users)
    model.load_state_dict(checkpoint["model_state"])
    model.eval()
    print(f"[EXPORT] Model loaded: n_users={n_users}")

    dummy_user_id = torch.tensor([1], dtype=torch.long)
    dummy_tweet_features = torch.zeros(1, N_TWEET_FEATURES, dtype=torch.float32)

    print("[EXPORT] Exporting to ONNX…")
    torch.onnx.export(
        model,
        (dummy_user_id, dummy_tweet_features),
        MODEL_ONNX_PATH,
        input_names=["user_id", "tweet_features"],
        output_names=["engagement_probs"],
        dynamic_axes={
            "user_id": {0: "batch_size"},
            "tweet_features": {0: "batch_size"},
            "engagement_probs": {0: "batch_size"},
        },
        opset_version=17,
    )
    print(f"[EXPORT] ONNX model saved to {MODEL_ONNX_PATH}")

    onnx_model = onnx.load(MODEL_ONNX_PATH)
    onnx.checker.check_model(onnx_model)
    print("[EXPORT] ONNX model check passed")

    print("[EXPORT] Verifying PyTorch vs ONNX output agreement…")
    with torch.no_grad():
        pt_out = model(dummy_user_id, dummy_tweet_features).numpy()

    sess = ort.InferenceSession(MODEL_ONNX_PATH, providers=["CPUExecutionProvider"])
    ort_out = sess.run(
        ["engagement_probs"],
        {
            "user_id": dummy_user_id.numpy(),
            "tweet_features": dummy_tweet_features.numpy(),
        },
    )[0]

    max_diff = float(np.abs(pt_out - ort_out).max())
    print(f"[EXPORT] Max diff PyTorch vs ONNX: {max_diff:.6f}")
    assert max_diff < MAX_DIFF_THRESHOLD, (
        f"ONNX output differs too much from PyTorch: max_diff={max_diff:.6f} >= {MAX_DIFF_THRESHOLD}"
    )
    print("[EXPORT] ✓ Verification passed")

    feature_config = {
        "feature_names": [
            "author_follower_tier",
            "topic_id",
            "tweet_type",
            "age_hours_norm",
            "like_count_log1p",
            "reply_count_log1p",
            "repost_count_log1p",
            "is_reply",
            "is_quote",
        ],
        "n_features": N_TWEET_FEATURES,
        "engagement_types": ENGAGEMENT_TYPES,
        "follower_tier_map": FOLLOWER_TIER_MAP,
        "tweet_type_map": TWEET_TYPE_MAP,
        "topic_to_idx": topic_to_idx,
        "user_to_idx": user_to_idx,
        "n_users": n_users,
        "normalization": {
            "age_hours_divisor": 168.0,
            "engagement_counts": "log1p",
        },
    }

    with open(FEATURE_CONFIG_PATH, "w") as f:
        json.dump(feature_config, f, indent=2)
    print(f"[EXPORT] Feature config saved to {FEATURE_CONFIG_PATH}")

    print("\n[EXPORT] Export complete:")
    print(f"  {MODEL_ONNX_PATH}")
    print(f"  {FEATURE_CONFIG_PATH}")


if __name__ == "__main__":
    export()

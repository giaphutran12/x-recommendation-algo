# Decisions — x-rec-algo

## [2026-03-10] Architecture Decisions (Pre-Implementation)
- Two-Tower NN: PyTorch training → ONNX export → onnxruntime-node inference
- Embeddings: Gemini embedding-001 (1536-dim Matryoshka) + pgvector
- Tweet generation: OpenCode subagents ($0 cost), NOT LLM API
- ML framework: PyTorch (not TensorFlow.js — 10-50x slower, abandoned)
- Heuristic fallback: engagement predictor works without ONNX model

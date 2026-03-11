import type { NextConfig } from "next";

/**
 * Server-side logging conventions:
 * - [RANK]: Ranking pipeline operations (scoring, filtering, selection)
 * - [SEED]: Seed data generation and loading
 * - [FEED]: Feed generation and retrieval
 * - [EMBED]: Embedding generation and retrieval
 * - [API]: API endpoint operations
 */

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    tsconfigPath: "./tsconfig.json",
  },
  serverExternalPackages: ["onnxruntime-node"],
};

export default nextConfig;

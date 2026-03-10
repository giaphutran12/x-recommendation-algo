/**
 * CLI script to generate ~50K tweets and write them to batch JSON files.
 * Run with: bun src/lib/seed/generate-batches.ts
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { personas } from './personas';
import { topics } from './topics';
import { generateTweetsForPersonas } from './tweet-generator';

const OUTPUT_DIR = join(__dirname, 'generated');

mkdirSync(OUTPUT_DIR, { recursive: true });

const BATCH_COUNT = 10;
const personaGroupSize = Math.ceil(personas.length / BATCH_COUNT);

console.log(`[SEED] Generating tweets for ${personas.length} personas in ${BATCH_COUNT} batches...`);

let totalWritten = 0;

for (let i = 0; i < BATCH_COUNT; i++) {
  const batchPersonas = personas.slice(i * personaGroupSize, (i + 1) * personaGroupSize);
  const batchTweets = generateTweetsForPersonas(batchPersonas, topics, 250);

  const batchNum = String(i + 1).padStart(2, '0');
  const filename = join(OUTPUT_DIR, `batch-${batchNum}.json`);

  writeFileSync(filename, JSON.stringify(batchTweets, null, 2), 'utf-8');
  totalWritten += batchTweets.length;
  console.log(`[SEED] batch-${batchNum}.json → ${batchTweets.length} tweets (${batchPersonas.length} personas)`);
}

console.log(`[SEED] Done. Total tweets written: ${totalWritten}`);

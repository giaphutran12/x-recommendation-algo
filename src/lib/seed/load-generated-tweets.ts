import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { GeneratedTweet } from './tweet-generator';

const GENERATED_DIR = join(__dirname, 'generated');

export function loadGeneratedTweets(): GeneratedTweet[] {
  const files = readdirSync(GENERATED_DIR)
    .filter((f) => f.match(/^batch-\d+\.json$/))
    .sort();

  const allTweets: GeneratedTweet[] = [];

  for (const file of files) {
    const raw = readFileSync(join(GENERATED_DIR, file), 'utf-8');
    const batch = JSON.parse(raw) as GeneratedTweet[];
    allTweets.push(...batch);
  }

  console.log(`[SEED] Loaded ${allTweets.length} pre-generated tweets from ${files.length} batch files`);
  return allTweets;
}

import type { Persona, PersonaType } from './personas';

export interface FollowRecord {
  follower_id: string;
  following_id: string;
  created_at: Date;
}

export interface FollowGraphResult {
  follows: FollowRecord[];
  followerCounts: Map<string, number>;
  followingCounts: Map<string, number>;
}

const SAME_TYPE_BOOST = 3.0;
const SHARED_INTEREST_BOOST = 2.0;
const SAME_TIER_BOOST = 1.5;

// m parameter in the BA model: engagement_rate ∈ [0.02, 0.12] → m ∈ [5, 15]
// Higher engagement_rate → more active persona → follows more accounts
function computeM(engagementRate: number): number {
  const normalized = Math.min(Math.max(engagementRate, 0.02), 0.12);
  const t = (normalized - 0.02) / 0.1;
  return Math.round(5 + t * 10);
}

function sharedInterestCount(a: Persona, b: Persona): number {
  const setB = new Set(b.interests);
  return a.interests.filter((i) => setB.has(i)).length;
}

function homophilyFactor(source: Persona, target: Persona): number {
  let factor = 1.0;
  if (source.persona_type === target.persona_type) factor *= SAME_TYPE_BOOST;
  if (sharedInterestCount(source, target) >= 1) factor *= SHARED_INTEREST_BOOST;
  if (source.follower_tier === target.follower_tier) factor *= SAME_TIER_BOOST;
  return factor;
}

function randomDate(monthsBack: number): Date {
  const now = Date.now();
  const past = now - monthsBack * 30 * 24 * 60 * 60 * 1000;
  return new Date(past + Math.random() * (now - past));
}

// Weighted random selection without replacement from `weights`, skipping `exclude` indices.
// Uses linear scan; adequate for N=200.
function weightedSampleWithoutReplacement(
  weights: number[],
  count: number,
  exclude: Set<number>,
): number[] {
  const picked: number[] = [];
  const available = weights.map((w, i) => ({ w, i })).filter(({ i }) => !exclude.has(i));

  for (let pick = 0; pick < count && available.length > 0; pick++) {
    const total = available.reduce((s, { w }) => s + w, 0);
    if (total === 0) break;

    let r = Math.random() * total;
    let chosen = available.length - 1;
    for (let j = 0; j < available.length; j++) {
      r -= available[j].w;
      if (r <= 0) {
        chosen = j;
        break;
      }
    }
    picked.push(available[chosen].i);
    available.splice(chosen, 1);
  }
  return picked;
}

export function generateFollowGraph(
  personas: Persona[],
  viewerUserId: string,
): FollowGraphResult {
  const follows: FollowRecord[] = [];
  const followSet = new Set<string>();
  const followerCounts = new Map<string, number>();
  const followingCounts = new Map<string, number>();

  for (const p of personas) {
    followerCounts.set(p.username, 0);
    followingCounts.set(p.username, 0);
  }

  function addFollow(followerId: string, followingId: string): boolean {
    if (followerId === followingId) return false;
    // Viewer follows handled separately to guarantee diversity constraints
    if (followerId === viewerUserId || followingId === viewerUserId) return false;
    const key = `${followerId}:${followingId}`;
    if (followSet.has(key)) return false;
    followSet.add(key);
    follows.push({ follower_id: followerId, following_id: followingId, created_at: randomDate(6) });
    followerCounts.set(followingId, (followerCounts.get(followingId) ?? 0) + 1);
    followingCounts.set(followerId, (followingCounts.get(followerId) ?? 0) + 1);
    return true;
  }

  // Complete graph on first 10 nodes bootstraps non-zero follower counts for BA weights
  const seedSize = Math.min(10, personas.length);
  for (let i = 0; i < seedSize; i++) {
    for (let j = 0; j < seedSize; j++) {
      if (i !== j) addFollow(personas[i].username, personas[j].username);
    }
  }

  // Barabási-Albert: weight = (follower_count + 1) × homophily_factor
  // +1 prevents zero weight for isolated nodes not yet followed by anyone
  for (let idx = seedSize; idx < personas.length; idx++) {
    const newPersona = personas[idx];
    const m = computeM(newPersona.engagement_rate);

    const weights = personas.slice(0, idx).map((target, targetIdx) => {
      const fc = followerCounts.get(target.username) ?? 0;
      return (fc + 1) * homophilyFactor(newPersona, personas[targetIdx]);
    });

    const chosen = weightedSampleWithoutReplacement(weights, m, new Set());

    for (const targetIdx of chosen) {
      addFollow(newPersona.username, personas[targetIdx].username);
      // 20% reciprocal follow — models mutual interest between similar personas
      if (Math.random() < 0.2) {
        addFollow(personas[targetIdx].username, newPersona.username);
      }
    }
  }

  const viewerFollows: FollowRecord[] = [];
  const viewerFollowSet = new Set<string>();
  let viewerFollowCount = 0;

  function addViewerFollow(followingUsername: string): boolean {
    if (viewerUserId === followingUsername) return false;
    if (viewerFollowSet.has(followingUsername)) return false;
    viewerFollowSet.add(followingUsername);
    viewerFollows.push({
      follower_id: viewerUserId,
      following_id: followingUsername,
      created_at: randomDate(6),
    });
    followerCounts.set(followingUsername, (followerCounts.get(followingUsername) ?? 0) + 1);
    viewerFollowCount++;
    return true;
  }

  const byType = new Map<PersonaType, Persona[]>();
  for (const p of personas) {
    const list = byType.get(p.persona_type) ?? [];
    list.push(p);
    byType.set(p.persona_type, list);
  }

  for (const [, group] of byType) {
    const shuffled = [...group].sort(() => Math.random() - 0.5);
    let added = 0;
    for (const p of shuffled) {
      if (added >= 5) break;
      if (addViewerFollow(p.username)) added++;
    }
  }

  const remaining = 50 - viewerFollowCount;
  if (remaining > 0) {
    const sortedByFollowers = [...personas].sort(
      (a, b) => (followerCounts.get(b.username) ?? 0) - (followerCounts.get(a.username) ?? 0),
    );
    let filled = 0;
    for (const p of sortedByFollowers) {
      if (filled >= remaining) break;
      if (addViewerFollow(p.username)) filled++;
    }
  }

  for (const vf of viewerFollows) {
    const key = `${vf.follower_id}:${vf.following_id}`;
    if (!followSet.has(key)) {
      followSet.add(key);
      follows.push(vf);
    }
  }

  followingCounts.set(viewerUserId, viewerFollowCount);

  const totalFollows = follows.length;
  const avg = (totalFollows / personas.length).toFixed(1);
  console.log(`[SEED] Follow graph: ${totalFollows} relationships, avg ${avg} followers/user`);
  console.log(
    `[SEED] Viewer follows ${viewerFollowCount} accounts across ${byType.size} persona types`,
  );

  return { follows, followerCounts, followingCounts };
}

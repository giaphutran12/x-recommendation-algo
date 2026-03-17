import { readFileSync } from 'fs';
import path from 'path';
import type { Tweet, User, Follow, Engagement } from './types/database';

class LocalDataStore {
  private _users: Map<string, User> | null = null;
  private _tweets: Tweet[] | null = null;
  private _tweetMap: Map<string, Tweet> | null = null;
  private _follows: Follow[] | null = null;
  private _engagements: Engagement[] | null = null;

  private get users(): Map<string, User> {
    if (!this._users) this.load();
    return this._users!;
  }

  private get tweets(): Tweet[] {
    if (!this._tweets) this.load();
    return this._tweets!;
  }

  private get tweetMap(): Map<string, Tweet> {
    if (!this._tweetMap) this.load();
    return this._tweetMap!;
  }

  private get follows(): Follow[] {
    if (!this._follows) this.load();
    return this._follows!;
  }

  private get engagements(): Engagement[] {
    if (!this._engagements) this.load();
    return this._engagements!;
  }

  private load(): void {
    const dataDir = path.join(process.cwd(), 'src/lib/data');

    const usersRaw: User[] = JSON.parse(
      readFileSync(path.join(dataDir, 'users.json'), 'utf-8')
    );
    this._users = new Map(usersRaw.map((u) => [u.id, u]));

    this._tweets = JSON.parse(
      readFileSync(path.join(dataDir, 'tweets.json'), 'utf-8')
    );
    this._tweetMap = new Map(this._tweets!.map((t) => [t.id, t]));

    this._follows = JSON.parse(
      readFileSync(path.join(dataDir, 'follows.json'), 'utf-8')
    );

    this._engagements = JSON.parse(
      readFileSync(path.join(dataDir, 'engagements.json'), 'utf-8')
    );

    console.log(
      `[LOCAL] Loaded ${this._users.size} users, ${this._tweets!.length} tweets, ${this._follows!.length} follows, ${this._engagements!.length} engagements`
    );
  }

  getFollowedIds(viewerId: string): string[] {
    return this.follows
      .filter((f) => f.follower_id === viewerId)
      .map((f) => f.following_id);
  }

  getTweetsByAuthors(authorIds: string[], cutoffDate: Date, limit: number): Tweet[] {
    const authorSet = new Set(authorIds);
    return this.tweets
      .filter(
        (t) => authorSet.has(t.author_id) && new Date(t.created_at) >= cutoffDate
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  getTweetsByPopularity(excludeAuthorIds: string[], cutoffDate: Date, limit: number): Tweet[] {
    const excludeSet = new Set(excludeAuthorIds);
    return this.tweets
      .filter(
        (t) => !excludeSet.has(t.author_id) && new Date(t.created_at) >= cutoffDate
      )
      .sort((a, b) => b.like_count - a.like_count)
      .slice(0, limit);
  }

  getEngagementCountsForTweets(
    tweetIds: string[]
  ): Map<string, { like_count: number; reply_count: number; repost_count: number; click_count: number }> {
    const result = new Map<
      string,
      { like_count: number; reply_count: number; repost_count: number; click_count: number }
    >();
    for (const id of tweetIds) {
      const tweet = this.tweetMap.get(id);
      if (tweet) {
        result.set(id, {
          like_count: tweet.like_count,
          reply_count: tweet.reply_count,
          repost_count: tweet.repost_count,
          click_count: tweet.click_count,
        });
      }
    }
    return result;
  }

  getViewerEngagements(viewerId: string): { tweet_id: string }[] {
    return this.engagements
      .filter((e) => e.user_id === viewerId)
      .map((e) => ({ tweet_id: e.tweet_id }));
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }
}

let instance: LocalDataStore | null = null;

export function getLocalDataStore(): LocalDataStore {
  if (!instance) instance = new LocalDataStore();
  return instance;
}

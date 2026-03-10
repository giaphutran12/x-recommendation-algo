import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PersonaType, Tweet, User } from '@/lib/types/database';
import type { ScoredCandidate } from '@/lib/types/ranking';
import TweetCard from '../../_components/tweet-card';
import { FollowButton } from './follow-button';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const PERSONA_AVATAR_COLOR: Record<PersonaType, string> = {
  founder: '#1d4ed8',
  journalist: '#059669',
  meme: '#d97706',
  trader: '#ea580c',
  politician: '#dc2626',
  tech: '#7c3aed',
  culture: '#db2777',
};

const PERSONA_BADGE_CLASS: Record<PersonaType, string> = {
  founder: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  journalist: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  meme: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40',
  trader: 'bg-orange-900/40 text-orange-400 border-orange-700/40',
  politician: 'bg-red-900/40 text-red-400 border-red-700/40',
  tech: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
  culture: 'bg-pink-900/40 text-pink-400 border-pink-700/40',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface ProfileHeaderProps {
  user: User;
  tweetCount: number;
  isFollowing: boolean;
}

function ProfileHeader({ user, tweetCount, isFollowing }: ProfileHeaderProps) {
  const avatarColor = PERSONA_AVATAR_COLOR[user.persona_type];
  const badgeClass = PERSONA_BADGE_CLASS[user.persona_type];
  const initial = user.display_name.charAt(0).toUpperCase();

  return (
    <div>
      <div
        className="flex items-center gap-4 px-4 py-3 sticky top-0 z-10 border-b border-[#2F3336]"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <Link
          href="/v3"
          className="p-2 rounded-full hover:bg-[#E7E9EA]/10 transition-colors text-[#E7E9EA]"
          aria-label="Go back to home"
        >
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="text-[#E7E9EA] font-bold text-xl leading-tight">{user.display_name}</h1>
          <p className="text-[#71767B] text-sm">{formatCount(tweetCount)} posts</p>
        </div>
      </div>

      <div
        className="h-[200px]"
        style={{
          background: `linear-gradient(135deg, ${avatarColor}33 0%, ${avatarColor}11 50%, #000 100%)`,
        }}
        aria-hidden="true"
      />

      <div className="px-4 flex items-end justify-between" style={{ marginTop: '-52px' }}>
        <div
          className="w-[104px] h-[104px] rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-black select-none"
          style={{ backgroundColor: avatarColor }}
          role="img"
          aria-label={`${user.display_name}'s avatar`}
        >
          {initial}
        </div>
        <div className="pb-3">
          <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[#E7E9EA] font-bold text-xl">{user.display_name}</h2>
            <Badge
              variant="outline"
              className={cn('text-[11px] rounded-full font-medium border', badgeClass)}
            >
              {user.persona_type}
            </Badge>
          </div>
          <p className="text-[#71767B] text-sm">@{user.username}</p>
        </div>

        {user.bio && (
          <p className="text-[#E7E9EA] text-sm leading-relaxed">{user.bio}</p>
        )}

        <div className="flex gap-5" role="list" aria-label="Profile statistics">
          <div role="listitem" className="flex gap-1 items-baseline">
            <span className="text-[#E7E9EA] font-bold text-sm tabular-nums">
              {formatCount(user.following_count)}
            </span>
            <span className="text-[#71767B] text-sm">Following</span>
          </div>
          <div role="listitem" className="flex gap-1 items-baseline">
            <span className="text-[#E7E9EA] font-bold text-sm tabular-nums">
              {formatCount(user.follower_count)}
            </span>
            <span className="text-[#71767B] text-sm">Followers</span>
          </div>
          <div role="listitem" className="flex gap-1 items-baseline">
            <span className="text-[#E7E9EA] font-bold text-sm tabular-nums">
              {formatCount(tweetCount)}
            </span>
            <span className="text-[#71767B] text-sm">Posts</span>
          </div>
        </div>
      </div>

      <Separator className="bg-[#2F3336]" />
    </div>
  );
}

interface TweetListProps {
  tweets: Tweet[];
  author: User;
  isFollowing: boolean;
}

function TweetList({ tweets, author, isFollowing }: TweetListProps) {
  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <p className="text-[#E7E9EA] font-bold text-2xl mb-2">No posts yet</p>
        <p className="text-[#71767B] text-sm">
          When @{author.username} posts, they&apos;ll show up here.
        </p>
      </div>
    );
  }

  return (
    <section aria-label={`${author.display_name}'s posts`}>
      {tweets.map((tweet) => {
        const candidate: ScoredCandidate = {
          tweet,
          author,
          score: 0,
          in_network: isFollowing,
          engagement_predictions: null,
          explanation: null,
        };
        return <TweetCard key={tweet.id} candidate={candidate} />;
      })}
    </section>
  );
}

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function V3ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  console.log(`[V3:PROFILE] Loading profile for @${username}`);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userError || !user) {
    console.log(`[V3:PROFILE] User not found: @${username}`);
    notFound();
  }

  const [tweetsResult, followResult] = await Promise.all([
    supabase
      .from('tweets')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('follows')
      .select('*')
      .eq('follower_id', VIEWER_ID)
      .eq('following_id', user.id)
      .maybeSingle(),
  ]);

  const tweets: Tweet[] = tweetsResult.data ?? [];
  const isFollowing = followResult.data !== null;

  console.log(
    `[V3:PROFILE] @${username} — tweets=${tweets.length}, isFollowing=${isFollowing}`,
  );

  return (
    <div className="min-h-screen">
      <ProfileHeader user={user as User} tweetCount={tweets.length} isFollowing={isFollowing} />
      <TweetList tweets={tweets} author={user as User} isFollowing={isFollowing} />
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PersonaType, Tweet, User } from '@/lib/types/database';
import type { ScoredCandidate } from '@/lib/types/ranking';
import { TweetCard } from '../../_components/tweet-card';
import { FollowButton } from './follow-button';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const PERSONA_AVATAR_BG: Record<PersonaType, string> = {
  founder: '#1d4ed8',
  journalist: '#059669',
  meme: '#d97706',
  trader: '#ea580c',
  politician: '#dc2626',
  tech: '#7c3aed',
  culture: '#db2777',
};

const PERSONA_BADGE_CLASS: Record<PersonaType, string> = {
  founder: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  journalist: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  meme: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  trader: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  politician: 'bg-red-500/15 text-red-400 border-red-500/30',
  tech: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  culture: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  console.log(`[V4-PROFILE] Loading profile for @${username}`);

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
    console.log(`[V4-PROFILE] User not found: @${username}`);
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
  const typedUser = user as User;
  const avatarColor = PERSONA_AVATAR_BG[typedUser.persona_type];
  const badgeClass = PERSONA_BADGE_CLASS[typedUser.persona_type];

  console.log(`[V4-PROFILE] @${username} — tweets=${tweets.length}, isFollowing=${isFollowing}`);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-30 backdrop-blur-md bg-black/80 border-b border-[#2F3336]">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link
            href="/v4"
            className="flex items-center justify-center size-9 rounded-full hover:bg-white/10 transition-colors text-[#E7E9EA]"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-[#E7E9EA] font-bold text-[17px] leading-tight">
              {typedUser.display_name}
            </h1>
            <p className="text-[#71767B] text-[13px]">
              {formatCount(tweets.length)} posts
            </p>
          </div>
        </div>
      </div>

      <div
        className="h-[200px] relative"
        style={{
          background: `linear-gradient(135deg, ${avatarColor}44 0%, ${avatarColor}11 50%, #000 100%)`,
        }}
      />

      <div className="px-4 flex items-end justify-between" style={{ marginTop: '-52px' }}>
        <div
          className="w-[104px] h-[104px] rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-black select-none ring-2 ring-white/5"
          style={{ backgroundColor: avatarColor }}
        >
          {typedUser.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="pb-3">
          <FollowButton userId={typedUser.id} initialIsFollowing={isFollowing} />
        </div>
      </div>

      <div className="px-4 pt-3 pb-4 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[#E7E9EA] font-bold text-[20px] leading-tight">
              {typedUser.display_name}
            </h2>
            <Badge
              variant="outline"
              className={cn('text-[11px] rounded-full font-medium capitalize', badgeClass)}
            >
              {typedUser.persona_type}
            </Badge>
          </div>
          <p className="text-[#71767B] text-[15px]">@{typedUser.username}</p>
        </div>

        {typedUser.bio && (
          <p className="text-[#E7E9EA] text-[15px] leading-relaxed">{typedUser.bio}</p>
        )}

        <div className="flex gap-5">
          <div className="flex gap-1 items-baseline">
            <span className="text-[#E7E9EA] font-bold text-[15px] tabular-nums">
              {formatCount(typedUser.following_count)}
            </span>
            <span className="text-[#71767B] text-[15px]">Following</span>
          </div>
          <div className="flex gap-1 items-baseline">
            <span className="text-[#E7E9EA] font-bold text-[15px] tabular-nums">
              {formatCount(typedUser.follower_count)}
            </span>
            <span className="text-[#71767B] text-[15px]">Followers</span>
          </div>
        </div>
      </div>

      <Separator className="bg-[#2F3336]" />

      {tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <p className="text-[#E7E9EA] font-bold text-[24px] mb-2">No posts yet</p>
          <p className="text-[#71767B] text-[15px]">
            When @{typedUser.username} posts, they&apos;ll show up here.
          </p>
        </div>
      ) : (
        <div>
          {tweets.map((tweet) => {
            const candidate: ScoredCandidate = {
              tweet,
              author: typedUser,
              score: 0,
              in_network: isFollowing,
              engagement_predictions: null,
              explanation: null,
            };
            return <TweetCard key={tweet.id} candidate={candidate} />;
          })}
        </div>
      )}
    </div>
  );
}

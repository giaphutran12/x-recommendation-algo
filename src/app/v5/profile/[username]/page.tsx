import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Calendar } from 'lucide-react';
import FollowButton from './follow-button';
import type { User, Tweet, PersonaType } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const PERSONA_COLORS: Record<PersonaType, string> = {
  founder: 'bg-[#1D9BF0]/15 text-[#1D9BF0]',
  journalist: 'bg-emerald-500/15 text-emerald-400',
  meme: 'bg-yellow-500/15 text-yellow-400',
  trader: 'bg-orange-500/15 text-orange-400',
  politician: 'bg-red-500/15 text-red-400',
  tech: 'bg-purple-500/15 text-purple-400',
  culture: 'bg-pink-500/15 text-pink-400',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Parallel fetches
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (userError || !userData) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <p className="text-xl font-bold text-[#E7E9EA]">
          User not found
        </p>
        <Link
          href="/v5"
          className="mt-4 text-[15px] text-[#1D9BF0] hover:underline"
        >
          Back to feed
        </Link>
      </div>
    );
  }

  const user = userData as User;

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

  const tweets = (tweetsResult.data ?? []) as Tweet[];
  const isFollowing = !!followResult.data;
  const isOwnProfile = user.id === VIEWER_ID;

  const joined = new Date(user.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-[53px] items-center gap-6 border-b border-[#2F3336] bg-[#000000]/70 px-4 backdrop-blur-xl">
        <Link
          href="/v5"
          className="rounded-full p-2 transition-colors hover:bg-[#E7E9EA]/10"
        >
          <ArrowLeft className="h-5 w-5 text-[#E7E9EA]" />
        </Link>
        <div>
          <p className="text-[17px] font-bold leading-tight text-[#E7E9EA]">
            {user.display_name}
          </p>
          <p className="text-[13px] text-[#71767B]">
            {tweets.length} post{tweets.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {/* Banner placeholder */}
      <div className="h-[200px] bg-[#333639]" />

      {/* Profile info */}
      <div className="relative border-b border-[#2F3336] px-4 pb-4">
        {/* Avatar */}
        <div className="-mt-[68px] mb-3 flex items-end justify-between">
          <Avatar className="h-[134px] w-[134px] border-4 border-[#000000]">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback className="bg-[#2F3336] text-3xl font-bold text-[#E7E9EA]">
              {user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isOwnProfile && (
            <FollowButton userId={user.id} initialFollowing={isFollowing} />
          )}
        </div>

        {/* Name + handle */}
        <h1 className="text-xl font-extrabold text-[#E7E9EA]">
          {user.display_name}
        </h1>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[15px] text-[#71767B]">
            @{user.username}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PERSONA_COLORS[user.persona_type]}`}
          >
            {user.persona_type}
          </span>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-[1.5] text-[#E7E9EA]">
            {user.bio}
          </p>
        )}

        {/* Joined date */}
        <div className="mt-3 flex items-center gap-1.5 text-[15px] text-[#71767B]">
          <Calendar className="h-[18px] w-[18px]" />
          <span>Joined {joined}</span>
        </div>

        {/* Stats */}
        <div className="mt-3 flex gap-5 text-[14px]">
          <span>
            <span className="font-bold text-[#E7E9EA]">
              {formatCount(user.following_count)}
            </span>{' '}
            <span className="text-[#71767B]">Following</span>
          </span>
          <span>
            <span className="font-bold text-[#E7E9EA]">
              {formatCount(user.follower_count)}
            </span>{' '}
            <span className="text-[#71767B]">Followers</span>
          </span>
        </div>
      </div>

      {/* Tweets */}
      {tweets.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-[15px] text-[#71767B]">No posts yet</p>
        </div>
      ) : (
        <div>
          {tweets.map((tweet) => (
            <article
              key={tweet.id}
              className="border-b border-[#2F3336] px-4 py-3 transition-colors hover:bg-white/[0.03]"
            >
              <div className="flex gap-3">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage
                    src={user.avatar_url}
                    alt={user.display_name}
                  />
                  <AvatarFallback className="bg-[#2F3336] text-sm text-[#E7E9EA]">
                    {user.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[15px] font-bold text-[#E7E9EA]">
                      {user.display_name}
                    </span>
                    <span className="text-[15px] text-[#71767B]">
                      @{user.username}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-[1.5] text-[#E7E9EA]">
                    {tweet.content}
                  </p>
                  <div className="mt-2 flex gap-6 text-[13px] text-[#71767B]">
                    <span>{formatCount(tweet.reply_count)} replies</span>
                    <span>{formatCount(tweet.repost_count)} reposts</span>
                    <span>{formatCount(tweet.like_count)} likes</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { User, Tweet } from '@/lib/types/database';
import { FollowButton } from './follow-button';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const db = getSupabase();

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('username', username)
    .single<User>();

  if (!user) notFound();

  const [{ data: tweets }, { data: followRow }] = await Promise.all([
    db
      .from('tweets')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<Tweet[]>(),
    db
      .from('follows')
      .select('follower_id')
      .eq('follower_id', VIEWER_ID)
      .eq('following_id', user.id)
      .maybeSingle(),
  ]);

  const isFollowing = !!followRow;
  const userTweets = tweets ?? [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000', color: '#E7E9EA' }}>
      <div
        className="sticky top-0 z-20 flex items-center gap-4 px-4 py-3 border-b border-[#2F3336]"
        style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <Link
          href="/v6"
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#E7E9EA]"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" className="size-5">
            <path
              d="M20 12H4M10 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <div>
          <h1 className="font-bold text-[#E7E9EA] text-[17px] leading-tight">
            {user.display_name}
          </h1>
          <p className="text-[13px] text-[#71767B]">{userTweets.length} posts</p>
        </div>
      </div>

      <div className="h-32 bg-[#16181C]" />

      <div className="px-4 pb-4 border-b border-[#2F3336]">
        <div className="flex justify-between items-end -mt-12 mb-3">
          <Avatar className="size-24 rounded-full ring-4 ring-black">
            <AvatarImage src={user.avatar_url} alt={user.display_name} className="object-cover" />
            <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-2xl">
              {user.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {user.id !== VIEWER_ID && (
            <FollowButton
              viewerId={VIEWER_ID}
              targetId={user.id}
              initialFollowing={isFollowing}
            />
          )}
        </div>

        <h2 className="font-bold text-[20px] text-[#E7E9EA]">{user.display_name}</h2>
        <p className="text-[#71767B] text-[15px]">@{user.username}</p>

        <div className="flex gap-2 mt-2 flex-wrap">
          <Badge className="bg-[#1D9BF0]/20 text-[#1D9BF0] border-0 text-[12px]">
            {user.persona_type}
          </Badge>
          {user.interests.slice(0, 3).map((tag) => (
            <Badge
              key={tag}
              className="bg-white/10 text-[#71767B] border-0 text-[12px]"
            >
              {tag}
            </Badge>
          ))}
        </div>

        {user.bio && (
          <p className="mt-3 text-[15px] text-[#E7E9EA] leading-normal">{user.bio}</p>
        )}

        <div className="flex gap-5 mt-3 text-[14px]">
          <span>
            <strong className="text-[#E7E9EA]">{formatCount(user.following_count)}</strong>{' '}
            <span className="text-[#71767B]">Following</span>
          </span>
          <span>
            <strong className="text-[#E7E9EA]">{formatCount(user.follower_count)}</strong>{' '}
            <span className="text-[#71767B]">Followers</span>
          </span>
        </div>
      </div>

      <Separator className="bg-[#2F3336]" />

      <div className="divide-y divide-[#2F3336]">
        {userTweets.map((tweet) => (
          <article key={tweet.id} className="px-4 py-3 hover:bg-white/[0.03] transition-colors">
            <p className="text-[15px] text-[#E7E9EA] leading-normal whitespace-pre-wrap">
              {tweet.content}
            </p>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-[#71767B]">
              <span>{timeAgo(tweet.created_at)}</span>
              <span>{formatCount(tweet.like_count)} likes</span>
              <span>{formatCount(tweet.reply_count)} replies</span>
              <span>{formatCount(tweet.repost_count)} reposts</span>
            </div>
          </article>
        ))}
        {userTweets.length === 0 && (
          <div className="p-8 text-center text-[#71767B]">No posts yet</div>
        )}
      </div>
    </div>
  );
}

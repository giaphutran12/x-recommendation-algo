import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { User, Tweet, PersonaType } from '@/lib/types/database';
import { FollowButton } from './follow-button';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const PERSONA_COLORS: Record<PersonaType, { bg: string; text: string; border: string }> = {
  founder:    { bg: 'bg-blue-900/40',    text: 'text-blue-400',    border: 'border-blue-700/40' },
  journalist: { bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-700/40' },
  meme:       { bg: 'bg-yellow-900/40',  text: 'text-yellow-400',  border: 'border-yellow-700/40' },
  trader:     { bg: 'bg-orange-900/40',  text: 'text-orange-400',  border: 'border-orange-700/40' },
  politician: { bg: 'bg-red-900/40',     text: 'text-red-400',     border: 'border-red-700/40' },
  tech:       { bg: 'bg-purple-900/40',  text: 'text-purple-400',  border: 'border-purple-700/40' },
  culture:    { bg: 'bg-pink-900/40',    text: 'text-pink-400',    border: 'border-pink-700/40' },
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function formatTweetDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffH = (now.getTime() - d.getTime()) / 3_600_000;
  if (diffH < 1) return `${Math.round(diffH * 60)}m`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single<User>();

  if (!user) notFound();

  const [{ data: tweets }, { data: followRow }] = await Promise.all([
    supabase
      .from('tweets')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<Tweet[]>(),
    supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', VIEWER_ID)
      .eq('following_id', user.id)
      .maybeSingle(),
  ]);

  const isFollowing = !!followRow;
  const personaColors = PERSONA_COLORS[user.persona_type];

  return (
    <div>
      <div
        className="sticky top-0 z-10 flex items-center gap-6 px-4 h-[53px] border-b border-[#2F3336]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
      >
        <Link
          href="/v2"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#E7E9EA]" />
        </Link>
        <div>
          <p className="text-[#E7E9EA] font-bold text-[17px] leading-none">{user.display_name}</p>
          <p className="text-[#71767B] text-[13px]">{tweets?.length ?? 0} posts</p>
        </div>
      </div>

      <div className="h-32 bg-[#16181C]" />

      <div className="px-4 pb-4 border-b border-[#2F3336]">
        <div className="flex items-end justify-between -mt-10 mb-3">
          <Avatar className="w-20 h-20 border-4 border-black">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-2xl">
              {user.display_name.charAt(0).toUpperCase()}
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

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[#E7E9EA] text-[20px] font-extrabold">{user.display_name}</h1>
            <Badge
              className={cn(
                'text-[11px] px-1.5 py-0 border rounded-md font-medium',
                personaColors.bg,
                personaColors.text,
                personaColors.border
              )}
            >
              {user.persona_type}
            </Badge>
          </div>
          <p className="text-[#71767B] text-[15px]">@{user.username}</p>

          {user.bio && (
            <p className="text-[#E7E9EA] text-[15px] leading-[1.5]">{user.bio}</p>
          )}

          <div className="flex items-center gap-1.5 text-[#71767B] text-[15px]">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(user.created_at)}</span>
          </div>

          <div className="flex items-center gap-5">
            <span className="text-[15px]">
              <span className="text-[#E7E9EA] font-bold">{formatCount(user.following_count)}</span>
              <span className="text-[#71767B] ml-1">Following</span>
            </span>
            <span className="text-[15px]">
              <span className="text-[#E7E9EA] font-bold">{formatCount(user.follower_count)}</span>
              <span className="text-[#71767B] ml-1">Followers</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        {!tweets || tweets.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#E7E9EA] text-[20px] font-extrabold">No posts yet</p>
          </div>
        ) : (
          tweets.map((tweet) => (
            <article key={tweet.id} className="flex gap-3 px-4 py-3 border-b border-[#2F3336] hover:bg-[#080808] transition-colors">
              <Avatar className="w-12 h-12 shrink-0">
                <AvatarImage src={user.avatar_url} alt={user.display_name} />
                <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA]">
                  {user.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[15px] text-[#E7E9EA] truncate">{user.display_name}</span>
                  <span className="text-[#71767B] text-[15px]">@{user.username}</span>
                  <span className="text-[#71767B] text-[15px]">·</span>
                  <span className="text-[#71767B] text-[15px]">{formatTweetDate(tweet.created_at)}</span>
                </div>
                <p className="mt-1 text-[15px] text-[#E7E9EA] leading-[1.5] break-words whitespace-pre-wrap">
                  {tweet.content}
                </p>
                <div className="flex items-center gap-6 mt-3 text-[#71767B] text-[13px]">
                  <span>{tweet.reply_count} replies</span>
                  <span>{tweet.repost_count} reposts</span>
                  <span>{tweet.like_count} likes</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

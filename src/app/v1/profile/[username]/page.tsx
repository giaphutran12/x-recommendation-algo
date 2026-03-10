import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FollowButton } from './follow-button';
import type { User, Tweet } from '@/lib/types';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!user) notFound();

  const profileUser = user as User;

  const { data: tweetsData } = await supabase
    .from('tweets')
    .select('*')
    .eq('author_id', profileUser.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const tweets = (tweetsData ?? []) as Tweet[];

  const { data: followData } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', VIEWER_ID)
    .eq('following_id', profileUser.id)
    .maybeSingle();

  const isFollowing = !!followData;
  const isOwnProfile = profileUser.id === VIEWER_ID;

  const joinDate = new Date(profileUser.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center gap-6 px-4 h-14 bg-black/60 backdrop-blur-[12px] border-b border-[#2F3336]">
        <Link
          href="/v1"
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#E7E9EA]/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#E7E9EA]" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#E7E9EA] leading-tight">{profileUser.display_name}</h1>
          <p className="text-sm text-[#71767B]">{tweets.length} posts</p>
        </div>
      </div>

      <div className="px-4 pt-4 pb-3 border-b border-[#2F3336]">
        <div className="flex items-start justify-between mb-3">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profileUser.avatar_url} alt={profileUser.display_name} />
            <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-2xl">
              {profileUser.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!isOwnProfile && (
            <FollowButton
              viewerId={VIEWER_ID}
              targetId={profileUser.id}
              initialIsFollowing={isFollowing}
            />
          )}
        </div>

        <div className="space-y-1 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-[#E7E9EA]">{profileUser.display_name}</h2>
            <Badge variant="secondary" className="bg-[#16181C] text-[#71767B] border-[#2F3336]">
              {profileUser.persona_type}
            </Badge>
          </div>
          <p className="text-[#71767B]">@{profileUser.username}</p>
        </div>

        {profileUser.bio && (
          <p className="text-[15px] text-[#E7E9EA] leading-[1.5] mb-3">{profileUser.bio}</p>
        )}

        <div className="flex items-center gap-1.5 text-[#71767B] text-sm mb-3">
          <Calendar className="w-4 h-4" />
          <span>Joined {joinDate}</span>
        </div>

        <div className="flex gap-5 text-sm">
          <div>
            <span className="font-bold text-[#E7E9EA]">
              {profileUser.following_count.toLocaleString()}
            </span>{' '}
            <span className="text-[#71767B]">Following</span>
          </div>
          <div>
            <span className="font-bold text-[#E7E9EA]">
              {profileUser.follower_count.toLocaleString()}
            </span>{' '}
            <span className="text-[#71767B]">Followers</span>
          </div>
        </div>
      </div>

      <div className="flex border-b border-[#2F3336]">
        <div className="flex-1 flex items-center justify-center h-12 text-sm font-semibold text-[#E7E9EA] border-b-2 border-[#1D9BF0]">
          Posts
        </div>
      </div>

      {tweets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <p className="text-[#E7E9EA] text-xl font-bold mb-2">No posts yet</p>
          <p className="text-[#71767B] text-sm">
            When {profileUser.display_name} posts, their tweets will appear here.
          </p>
        </div>
      ) : (
        tweets.map((tweet, idx) => (
          <div key={tweet.id}>
            <div className="px-4 py-3">
              <p className="text-[15px] text-[#E7E9EA] leading-[1.5]">{tweet.content}</p>
              <div className="flex items-center gap-4 mt-3 text-[#71767B] text-sm">
                <span>{new Date(tweet.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>·</span>
                <span>{tweet.like_count.toLocaleString()} likes</span>
                <span>·</span>
                <span>{tweet.reply_count.toLocaleString()} replies</span>
              </div>
            </div>
            {idx < tweets.length - 1 && <Separator className="bg-[#2F3336]" />}
          </div>
        ))
      )}
    </div>
  );
}

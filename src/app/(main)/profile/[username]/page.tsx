import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import TweetCard from '../../_components/tweet-card';
import FollowButton from './follow-button';
import type { ScoredCandidate } from '@/lib/types/ranking';
import type { User, Tweet, PersonaType } from '@/lib/types/database';
import { VIEWER_ID } from '@/lib/constants';

const PERSONA_COLORS: Record<PersonaType, string> = {
  founder: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  journalist: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  meme: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  trader: 'text-green-400 border-green-500/30 bg-green-500/10',
  politician: 'text-red-400 border-red-500/30 bg-red-500/10',
  tech: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  culture: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (!userData) notFound();

  const user = userData as User;

  const { data: tweetsData } = await supabase
    .from('tweets')
    .select('*')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false });

  const { count: followCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', VIEWER_ID)
    .eq('following_id', user.id);

  const isFollowing = (followCount ?? 0) > 0;

  const candidates: ScoredCandidate[] = ((tweetsData ?? []) as Tweet[]).map((tweet) => ({
    tweet,
    author: user,
    score: 0,
    in_network: true,
    engagement_predictions: null,
    explanation: null,
  }));

  return (
    <div className="bg-background text-foreground">
      <div className="px-4 pt-4 pb-4 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <Avatar className="size-16">
            <AvatarImage src={user.avatar_url} alt={user.display_name} />
            <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">
              {user.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
        </div>

        <div className="mt-1">
          <h1 className="text-xl font-bold text-foreground">
            {user.display_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            @{user.username}
          </p>
        </div>

        <Badge
          variant="outline"
          className={`mt-2 capitalize text-[11px] border ${PERSONA_COLORS[user.persona_type]}`}
        >
          {user.persona_type}
        </Badge>

        {user.bio && (
          <p className="mt-3 text-sm leading-relaxed text-foreground">
            {user.bio}
          </p>
        )}

        <div className="flex gap-5 mt-3 text-sm">
          <span>
            <span className="font-bold text-foreground">
              {user.following_count}
            </span>
            <span className="ml-1 text-muted-foreground">
              Following
            </span>
          </span>
          <span>
            <span className="font-bold text-foreground">
              {user.follower_count}
            </span>
            <span className="ml-1 text-muted-foreground">
              Followers
            </span>
          </span>
        </div>
      </div>

      <div>
        {candidates.map((candidate) => (
          <TweetCard key={candidate.tweet.id} candidate={candidate} />
        ))}
        {candidates.length === 0 && (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            No tweets yet.
          </p>
        )}
      </div>
    </div>
  );
}

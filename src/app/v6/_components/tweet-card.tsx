'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, BarChart2 } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';

interface TweetCardProps {
  candidate: ScoredCandidate;
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
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const PERSONA_COLORS: Record<string, string> = {
  founder: 'bg-[#1D9BF0]/20 text-[#1D9BF0]',
  journalist: 'bg-[#F91A82]/20 text-[#F91A82]',
  meme: 'bg-yellow-500/20 text-yellow-400',
  trader: 'bg-[#00B87A]/20 text-[#00B87A]',
  politician: 'bg-orange-500/20 text-orange-400',
  tech: 'bg-purple-500/20 text-purple-400',
  culture: 'bg-pink-500/20 text-pink-400',
};

export function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, explanation } = candidate;
  const [liked, setLiked] = useState(false);
  const [reposted, setReposted] = useState(false);

  const personaClass =
    PERSONA_COLORS[author.persona_type] ?? 'bg-white/10 text-[#E7E9EA]';

  return (
    <article className="px-4 py-3 hover:bg-white/[0.03] transition-colors cursor-pointer border-b border-[#2F3336]">
      <div className="flex gap-3">
        <Link
          href={`/v6/profile/${author.username}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <Avatar className="size-12 rounded-full">
            <AvatarImage
              src={author.avatar_url}
              alt={author.display_name}
              className="object-cover"
            />
            <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-sm">
              {author.display_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/v6/profile/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[#E7E9EA] text-[15px] hover:underline truncate"
            >
              {author.display_name}
            </Link>
            <span className="text-[#71767B] text-[15px] truncate">
              @{author.username}
            </span>
            <Badge className={cn('text-[11px] px-1.5 py-0 h-5 border-0', personaClass)}>
              {author.persona_type}
            </Badge>
            <span className="text-[#71767B] text-[15px] ml-auto">
              {timeAgo(tweet.created_at)}
            </span>
          </div>

          <p className="mt-1 text-[15px] text-[#E7E9EA] leading-normal break-words whitespace-pre-wrap">
            {tweet.content}
          </p>

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <button
              type="button"
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[#71767B] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 transition-colors group"
            >
              <MessageCircle size={18} strokeWidth={1.75} />
              <span className="text-[13px] group-hover:text-[#1D9BF0]">
                {formatCount(tweet.reply_count)}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setReposted((v) => !v);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors group',
                reposted
                  ? 'text-[#00B87A]'
                  : 'text-[#71767B] hover:text-[#00B87A] hover:bg-[#00B87A]/10'
              )}
            >
              <Repeat2 size={18} strokeWidth={1.75} />
              <span className="text-[13px]">
                {formatCount(tweet.repost_count + (reposted ? 1 : 0))}
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLiked((v) => !v);
              }}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors group',
                liked
                  ? 'text-[#F91A82]'
                  : 'text-[#71767B] hover:text-[#F91A82] hover:bg-[#F91A82]/10'
              )}
            >
              <Heart
                size={18}
                strokeWidth={1.75}
                fill={liked ? 'currentColor' : 'none'}
              />
              <span className="text-[13px]">
                {formatCount(tweet.like_count + (liked ? 1 : 0))}
              </span>
            </button>

            <div className="flex items-center gap-1.5 px-2 py-1.5 text-[#71767B]">
              <BarChart2 size={18} strokeWidth={1.75} />
              <span className="text-[13px]">
                {formatCount(tweet.click_count)}
              </span>
            </div>
          </div>

          {explanation && (
            <Collapsible>
              <CollapsibleTrigger className="mt-2 text-[13px] text-[#1D9BF0] hover:underline cursor-pointer text-left">
                Why this tweet? · score {explanation.totalScore.toFixed(3)}
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 p-3 rounded-xl bg-[#16181C] border border-[#2F3336] space-y-1.5 text-[13px]">
                  <div className="flex justify-between text-[#71767B]">
                    <span>Recency</span>
                    <span className="text-[#E7E9EA]">
                      {explanation.recencyScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71767B]">
                    <span>Popularity</span>
                    <span className="text-[#E7E9EA]">
                      {explanation.popularityScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71767B]">
                    <span>Network</span>
                    <span className="text-[#E7E9EA]">
                      {explanation.networkScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71767B]">
                    <span>Topic</span>
                    <span className="text-[#E7E9EA]">
                      {explanation.topicScore.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71767B]">
                    <span>Author diversity</span>
                    <span className="text-[#E7E9EA]">
                      ×{explanation.authorDiversityMultiplier.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#71767B]">
                    <span>OON multiplier</span>
                    <span className="text-[#E7E9EA]">
                      ×{explanation.oonMultiplier.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-[#2F3336] pt-1.5 text-[#E7E9EA]">
                    <span>Total</span>
                    <span className="text-[#1D9BF0]">
                      {explanation.totalScore.toFixed(4)}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </article>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, BarChart2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';
import type { PersonaType, EngagementType } from '@/lib/types/database';

const PERSONA_COLORS: Record<PersonaType, string> = {
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
  return n.toString();
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow',
  not_interested: 'Not Int.',
};

interface TweetCardProps {
  candidate: ScoredCandidate;
}

export function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, score, in_network, engagement_predictions, explanation } = candidate;
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [liked, setLiked] = useState(false);

  return (
    <article className="flex gap-3 px-4 py-3 border-b border-[#2F3336] hover:bg-white/[0.03] transition-colors cursor-pointer group">
      <Link
        href={`/v4/profile/${author.username}`}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0"
      >
        <Avatar className="size-10 ring-2 ring-transparent hover:ring-[#1D9BF0]/30 transition-all">
          <AvatarImage src={author.avatar_url} alt={author.display_name} />
          <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-sm font-bold">
            {author.display_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <Link
              href={`/v4/profile/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[15px] text-[#E7E9EA] hover:underline truncate"
            >
              {author.display_name}
            </Link>
            <span className="text-[15px] text-[#71767B] truncate">@{author.username}</span>
            <span className="text-[15px] text-[#71767B]">·</span>
            <span className="text-[15px] text-[#71767B] shrink-0">
              {formatTimestamp(tweet.created_at)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge
              className={cn(
                'text-[10px] px-1.5 py-0 border capitalize font-medium',
                PERSONA_COLORS[author.persona_type],
              )}
            >
              {author.persona_type}
            </Badge>
            {!in_network && (
              <span className="text-[10px] px-1.5 py-0 rounded-full border border-[#71767B]/30 text-[#71767B] font-medium">
                OON
              </span>
            )}
          </div>
        </div>

        <p className="text-[15px] leading-[1.5] text-[#E7E9EA] mb-3 whitespace-pre-wrap break-words">
          {tweet.content}
        </p>

        <div className="flex items-center justify-between max-w-[425px]">
          <button
            className="flex items-center gap-1.5 group/btn text-[#71767B] hover:text-[#1D9BF0] transition-colors"
            aria-label={`${tweet.reply_count} replies`}
          >
            <span className="flex items-center justify-center size-8 rounded-full group-hover/btn:bg-[#1D9BF0]/10 transition-colors">
              <MessageCircle className="size-4" />
            </span>
            <span className="text-sm">{formatCount(tweet.reply_count)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 group/btn text-[#71767B] hover:text-[#00B87A] transition-colors"
            aria-label={`${tweet.repost_count} reposts`}
          >
            <span className="flex items-center justify-center size-8 rounded-full group-hover/btn:bg-[#00B87A]/10 transition-colors">
              <Repeat2 className="size-4" />
            </span>
            <span className="text-sm">{formatCount(tweet.repost_count)}</span>
          </button>

          <button
            className={cn(
              'flex items-center gap-1.5 group/btn transition-colors',
              liked ? 'text-[#F91A82]' : 'text-[#71767B] hover:text-[#F91A82]',
            )}
            aria-label={`${tweet.like_count} likes`}
            onClick={() => setLiked((l) => !l)}
          >
            <span
              className={cn(
                'flex items-center justify-center size-8 rounded-full transition-colors',
                liked ? 'bg-[#F91A82]/10' : 'group-hover/btn:bg-[#F91A82]/10',
              )}
            >
              <Heart className={cn('size-4', liked && 'fill-current')} />
            </span>
            <span className="text-sm">{formatCount(tweet.like_count + (liked ? 1 : 0))}</span>
          </button>

          <button
            className="flex items-center gap-1.5 group/btn text-[#71767B] hover:text-[#1D9BF0] transition-colors"
            aria-label={`${tweet.click_count} views`}
          >
            <span className="flex items-center justify-center size-8 rounded-full group-hover/btn:bg-[#1D9BF0]/10 transition-colors">
              <BarChart2 className="size-4" />
            </span>
            <span className="text-sm">{formatCount(tweet.click_count)}</span>
          </button>

          <div className="flex items-center gap-1 text-[#71767B]">
            <Zap className="size-3.5 text-[#1D9BF0]" />
            <span className="text-xs text-[#1D9BF0] font-semibold tabular-nums">
              {(score * 100).toFixed(1)}
            </span>
          </div>
        </div>

        {explanation && (
          <Collapsible open={explanationOpen} onOpenChange={setExplanationOpen}>
            <CollapsibleTrigger className="flex items-center gap-1 mt-2 text-[12px] text-[#71767B] hover:text-[#1D9BF0] transition-colors group/why">
              <span className="group-hover/why:underline">Why this tweet?</span>
              {explanationOpen ? (
                <ChevronUp className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 rounded-xl bg-[#1D9BF0]/5 border border-[#1D9BF0]/10 space-y-2">
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <ScoreRow label="Recency" value={explanation.recencyScore} />
                  <ScoreRow label="Popularity" value={explanation.popularityScore} />
                  <ScoreRow label="Network" value={explanation.networkScore} />
                  <ScoreRow label="Topic" value={explanation.topicScore} />
                  {explanation.authorDiversityMultiplier !== 1 && (
                    <ScoreRow
                      label="Diversity"
                      value={explanation.authorDiversityMultiplier}
                      isMultiplier
                    />
                  )}
                  {explanation.oonMultiplier !== 1 && (
                    <ScoreRow
                      label="OON Boost"
                      value={explanation.oonMultiplier}
                      isMultiplier
                    />
                  )}
                </div>

                {engagement_predictions && (
                  <div className="pt-2 border-t border-[#2F3336]">
                    <p className="text-[11px] text-[#71767B] mb-1.5 font-medium uppercase tracking-wide">
                      Predicted engagement
                    </p>
                    <div className="grid grid-cols-3 gap-1">
                      {(Object.entries(engagement_predictions) as [EngagementType, number][]).map(
                        ([type, prob]) => (
                          <div key={type} className="flex flex-col items-center">
                            <span className="text-[11px] text-[#71767B]">
                              {ENGAGEMENT_LABELS[type]}
                            </span>
                            <span className="text-[12px] font-semibold text-[#E7E9EA]">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  );
}

function ScoreRow({
  label,
  value,
  isMultiplier = false,
}: {
  label: string;
  value: number;
  isMultiplier?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[12px] text-[#71767B]">{label}</span>
      <span className="text-[12px] font-semibold text-[#E7E9EA] tabular-nums">
        {isMultiplier ? `×${value.toFixed(2)}` : value.toFixed(3)}
      </span>
    </div>
  );
}

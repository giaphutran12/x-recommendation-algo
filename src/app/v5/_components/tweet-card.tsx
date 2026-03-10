'use client';

import Link from 'next/link';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Heart,
  MessageCircle,
  Repeat2,
  BarChart2,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';
import type { PersonaType } from '@/lib/types/database';

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

function formatTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return `${sec}s`;
  if (min < 60) return `${min}m`;
  if (hr < 24) return `${hr}h`;
  if (day < 7) return `${day}d`;
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const SCORE_BARS = [
  { key: 'recencyScore' as const, label: 'Recency', color: 'bg-blue-500' },
  { key: 'popularityScore' as const, label: 'Popularity', color: 'bg-green-500' },
  { key: 'networkScore' as const, label: 'Network', color: 'bg-purple-500' },
  { key: 'topicScore' as const, label: 'Topic', color: 'bg-yellow-500' },
];

interface TweetCardProps {
  candidate: ScoredCandidate;
}

export default function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, score, in_network, explanation } = candidate;

  return (
    <article className="border-b border-[#2F3336] px-4 py-3 transition-colors hover:bg-white/[0.03]">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link href={`/v5/profile/${author.username}`} className="shrink-0">
          <Avatar className="h-12 w-12">
            <AvatarImage src={author.avatar_url} alt={author.display_name} />
            <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA] text-sm font-bold">
              {author.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          {/* Author row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              href={`/v5/profile/${author.username}`}
              className="truncate text-[15px] font-bold text-[#E7E9EA] hover:underline"
            >
              {author.display_name}
            </Link>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize',
                PERSONA_COLORS[author.persona_type]
              )}
            >
              {author.persona_type}
            </span>
            <span className="text-[15px] text-[#71767B]">
              @{author.username}
            </span>
            <span className="text-[#71767B]">&middot;</span>
            <time className="text-[15px] text-[#71767B]">
              {formatTime(tweet.created_at)}
            </time>
          </div>

          {/* Tweet content */}
          <p className="mt-1 whitespace-pre-wrap break-words text-[15px] leading-[1.5] text-[#E7E9EA]">
            {tweet.content}
          </p>

          {/* Engagement bar */}
          <div className="mt-3 flex max-w-[425px] items-center justify-between">
            <EngagementButton
              icon={MessageCircle}
              count={tweet.reply_count}
              hoverColor="text-[#1D9BF0]"
              hoverBg="group-hover:bg-[#1D9BF0]/10"
            />
            <EngagementButton
              icon={Repeat2}
              count={tweet.repost_count}
              hoverColor="text-[#00B87A]"
              hoverBg="group-hover:bg-[#00B87A]/10"
            />
            <EngagementButton
              icon={Heart}
              count={tweet.like_count}
              hoverColor="text-[#F91A82]"
              hoverBg="group-hover:bg-[#F91A82]/10"
            />
            <EngagementButton
              icon={BarChart2}
              count={tweet.click_count}
              hoverColor="text-[#1D9BF0]"
              hoverBg="group-hover:bg-[#1D9BF0]/10"
            />
          </div>

          {/* Why this tweet? */}
          {explanation && (
            <Collapsible>
              <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-[13px] text-[#1D9BF0] hover:underline cursor-pointer">
                <ChevronDown className="h-3.5 w-3.5 transition-transform [[data-open]_&]:rotate-180" />
                Why this tweet? (Score: {score.toFixed(2)})
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-lg border border-[#2F3336] bg-[#16181C] p-3 text-[13px]">
                  <div className="space-y-2">
                    {SCORE_BARS.map(({ key, label, color }) => (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-[#71767B]">
                          {label}
                        </span>
                        <div className="h-1.5 flex-1 rounded-full bg-[#2F3336]">
                          <div
                            className={cn('h-full rounded-full', color)}
                            style={{
                              width: `${Math.min(explanation[key] * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="w-10 text-right tabular-nums text-[#E7E9EA]">
                          {explanation[key].toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Multipliers */}
                  <div className="mt-3 flex gap-4 border-t border-[#2F3336] pt-3 text-[#71767B]">
                    {in_network ? (
                      <span className="text-[#00B87A]">In-Network</span>
                    ) : (
                      <span>
                        OON &times;{explanation.oonMultiplier.toFixed(2)}
                      </span>
                    )}
                    <span>
                      Diversity &times;
                      {explanation.authorDiversityMultiplier.toFixed(2)}
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

/* ─── Engagement Button ─── */

interface EngagementButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  hoverColor: string;
  hoverBg: string;
}

function EngagementButton({
  icon: Icon,
  count,
  hoverColor,
  hoverBg,
}: EngagementButtonProps) {
  return (
    <button
      className={cn(
        'group flex items-center gap-1 text-[#71767B] transition-colors',
        `hover:${hoverColor}`
      )}
      type="button"
    >
      <div
        className={cn(
          'rounded-full p-2 transition-colors',
          hoverBg
        )}
      >
        <Icon className="h-[18px] w-[18px]" />
      </div>
      <span className="text-[13px]">{formatCount(count)}</span>
    </button>
  );
}

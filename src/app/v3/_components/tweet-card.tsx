'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MessageCircle, Repeat2, Heart, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';
import type { PersonaType, EngagementType } from '@/lib/types/database';

const PERSONA_BADGE_CLASS: Record<PersonaType, string> = {
  founder: 'bg-blue-900/40 text-blue-400 border-blue-700/40',
  journalist: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40',
  meme: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/40',
  trader: 'bg-orange-900/40 text-orange-400 border-orange-700/40',
  politician: 'bg-red-900/40 text-red-400 border-red-700/40',
  tech: 'bg-purple-900/40 text-purple-400 border-purple-700/40',
  culture: 'bg-pink-900/40 text-pink-400 border-pink-700/40',
};

const PERSONA_AVATAR_COLOR: Record<PersonaType, string> = {
  founder: '#1d4ed8',
  journalist: '#059669',
  meme: '#d97706',
  trader: '#ea580c',
  politician: '#dc2626',
  tech: '#7c3aed',
  culture: '#db2777',
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow',
  not_interested: 'Not Interested',
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n > 0 ? String(n) : '';
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

function ScoreBar({ label, value, max = 1, color = '#1D9BF0' }: ScoreBarProps) {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#71767B] w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1 bg-[#2F3336] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[#71767B] w-10 text-right tabular-nums font-mono">
        {value.toFixed(3)}
      </span>
    </div>
  );
}

interface TweetCardProps {
  candidate: ScoredCandidate;
}

export default function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, score, in_network, explanation } = candidate;
  const [whyOpen, setWhyOpen] = useState(false);

  const avatarColor = PERSONA_AVATAR_COLOR[author.persona_type];
  const badgeClass = PERSONA_BADGE_CLASS[author.persona_type];
  const initial = author.display_name.charAt(0).toUpperCase();

  return (
    <article
      className="flex gap-3 px-4 py-3 border-b border-[#2F3336] hover:bg-[#080808] transition-colors"
      aria-label={`Tweet by ${author.display_name}`}
    >
      <Link
        href={`/v3/profile/${author.username}`}
        className="flex-shrink-0"
        aria-label={`${author.display_name}'s profile`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg select-none hover:opacity-90 transition-opacity"
          style={{ backgroundColor: avatarColor }}
          role="img"
          aria-label={`${author.display_name}'s avatar`}
        >
          {initial}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          <Link
            href={`/v3/profile/${author.username}`}
            className="font-bold text-[15px] text-[#E7E9EA] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {author.display_name}
          </Link>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] rounded-full px-1.5 py-0 font-medium border leading-5 shrink-0',
              badgeClass,
            )}
          >
            {author.persona_type}
          </Badge>
          {!in_network && (
            <Badge
              variant="outline"
              className="text-[10px] rounded-full px-1.5 py-0 font-medium border leading-5 shrink-0 bg-[#1D9BF0]/10 text-[#1D9BF0] border-[#1D9BF0]/30"
            >
              OON
            </Badge>
          )}
          <span className="text-[#71767B] text-[15px] truncate">@{author.username}</span>
          <span className="text-[#71767B] text-[15px] shrink-0">·</span>
          <time
            className="text-[#71767B] text-[15px] shrink-0"
            dateTime={tweet.created_at}
            title={new Date(tweet.created_at).toLocaleString()}
          >
            {formatRelativeTime(tweet.created_at)}
          </time>
        </div>

        <p className="text-[#E7E9EA] text-[15px] leading-[1.5] font-normal whitespace-pre-wrap break-words">
          {tweet.content}
        </p>

        {tweet.topic && (
          <div className="mt-1">
            <span className="text-[#71767B] text-xs">#{tweet.topic}</span>
          </div>
        )}

        <div
          className="flex items-center gap-0 mt-2 -ml-2"
          role="group"
          aria-label="Engagement actions"
        >
          <button
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0] transition-colors min-w-[44px]"
            aria-label={`${tweet.reply_count} replies`}
          >
            <MessageCircle className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{formatCount(tweet.reply_count)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#00B87A]/10 text-[#71767B] hover:text-[#00B87A] transition-colors min-w-[44px]"
            aria-label={`${tweet.repost_count} reposts`}
          >
            <Repeat2 className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{formatCount(tweet.repost_count)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#F91A82]/10 text-[#71767B] hover:text-[#F91A82] transition-colors min-w-[44px]"
            aria-label={`${tweet.like_count} likes`}
          >
            <Heart className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{formatCount(tweet.like_count)}</span>
          </button>

          <button
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-[#1D9BF0]/10 text-[#71767B] hover:text-[#1D9BF0] transition-colors min-w-[44px]"
            aria-label={`${tweet.click_count} views`}
          >
            <BarChart2 className="w-5 h-5" aria-hidden="true" />
            <span className="text-xs tabular-nums">{formatCount(tweet.click_count)}</span>
          </button>
        </div>

        {explanation && (
          <Collapsible open={whyOpen} onOpenChange={(open) => setWhyOpen(open)}>
            <CollapsibleTrigger
              className="flex items-center gap-1 mt-2 text-[#71767B] hover:text-[#1D9BF0] text-xs transition-colors cursor-pointer"
              aria-expanded={whyOpen}
            >
              {whyOpen ? (
                <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Why this tweet?
              <span className="ml-1 text-[#1D9BF0] font-mono font-semibold">
                {score.toFixed(3)}
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div
                className="mt-2 p-3 rounded-xl border border-[#2F3336] bg-[#16181C] space-y-1.5"
                aria-label="Score breakdown"
              >
                <p className="text-[#71767B] text-xs font-semibold uppercase tracking-wide mb-2">
                  Score Breakdown
                </p>
                <ScoreBar label="Recency" value={explanation.recencyScore} />
                <ScoreBar
                  label="Popularity"
                  value={explanation.popularityScore}
                  color="#00B87A"
                />
                <ScoreBar label="Network" value={explanation.networkScore} color="#F91A82" />
                <ScoreBar label="Topic" value={explanation.topicScore} color="#a855f7" />

                {Object.keys(explanation.engagementTypeScores).length > 0 && (
                  <div className="pt-1 border-t border-[#2F3336]">
                    <p className="text-[#71767B] text-[10px] font-semibold uppercase tracking-wide mb-1.5">
                      Engagement
                    </p>
                    {(
                      Object.entries(explanation.engagementTypeScores) as [
                        EngagementType,
                        number,
                      ][]
                    ).map(([type, val]) => (
                      <ScoreBar
                        key={type}
                        label={ENGAGEMENT_LABELS[type]}
                        value={val}
                        max={5}
                        color={type === 'not_interested' ? '#F91A82' : '#1D9BF0'}
                      />
                    ))}
                  </div>
                )}

                <div className="pt-1 border-t border-[#2F3336] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71767B]">Diversity ×</span>
                    <span className="text-[#E7E9EA] font-mono">
                      {explanation.authorDiversityMultiplier.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#71767B]">OON ×</span>
                    <span className="text-[#E7E9EA] font-mono">
                      {explanation.oonMultiplier.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold border-t border-[#2F3336] pt-1">
                    <span className="text-[#E7E9EA]">Total Score</span>
                    <span className="text-[#1D9BF0] font-mono">
                      {explanation.totalScore.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  );
}

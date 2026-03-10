'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Eye, ChevronDown } from 'lucide-react';
import type { ScoredCandidate, ScoreExplanation } from '@/lib/types/ranking';
import type { PersonaType } from '@/lib/types/database';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// ─── Persona Styling ───────────────────────────────────────────────────────────

const PERSONA_AVATAR_COLOR: Record<PersonaType, string> = {
  founder: '#1d4ed8',
  journalist: '#059669',
  meme: '#d97706',
  trader: '#ea580c',
  politician: '#dc2626',
  tech: '#7c3aed',
  culture: '#db2777',
};

// Full static class strings so Tailwind v4 scanner picks them up
const PERSONA_BADGE_CLASS: Record<PersonaType, string> = {
  founder: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  journalist: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  meme: 'bg-yellow-900/40 text-yellow-400 border border-yellow-700/40',
  trader: 'bg-orange-900/40 text-orange-400 border border-orange-700/40',
  politician: 'bg-red-900/40 text-red-400 border border-red-700/40',
  tech: 'bg-purple-900/40 text-purple-400 border border-purple-700/40',
  culture: 'bg-pink-900/40 text-pink-400 border border-pink-700/40',
};

// ─── Utilities ─────────────────────────────────────────────────────────────────

function getRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diffMs / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);

  if (s < 60) return `${s}s`;
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 30) return `${d}d`;
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ─── Score Bar ─────────────────────────────────────────────────────────────────

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.round(Math.abs(value) * 100));
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#71767b] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-[#2f3336] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1d9bf0] rounded-full"
          style={{ width: `${pct}%`, transition: 'width 300ms ease' }}
        />
      </div>
      <span className="text-[10px] text-[#e7e9ea] w-10 text-right tabular-nums font-mono">
        {value.toFixed(3)}
      </span>
    </div>
  );
}

// ─── Why This Tweet ────────────────────────────────────────────────────────────

function WhyThisTweet({ explanation }: { explanation: ScoreExplanation }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2 pt-2 border-t border-[#2f3336]">
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 text-xs text-[#71767b] hover:text-[#1d9bf0] transition-colors"
        >
          <ChevronDown
            size={12}
            strokeWidth={2.5}
            className={cn('transition-transform duration-150', open && 'rotate-180')}
            aria-hidden="true"
          />
          Why this tweet?
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[10px] font-semibold text-[#71767b] uppercase tracking-widest">
              Score breakdown
            </span>
            <span className="text-[11px] font-mono font-bold text-[#1d9bf0]">
              {explanation.totalScore.toFixed(4)}
            </span>
          </div>

          <div className="space-y-2">
            <ScoreBar label="Recency" value={explanation.recencyScore} />
            <ScoreBar label="Popularity" value={explanation.popularityScore} />
            <ScoreBar label="Network" value={explanation.networkScore} />
            <ScoreBar label="Topic" value={explanation.topicScore} />
          </div>

          <div className="flex gap-5 mt-3 pt-2.5 border-t border-[#2f3336]">
            <div className="text-[10px] text-[#71767b]">
              <span className="font-mono text-[#e7e9ea]">
                {explanation.authorDiversityMultiplier.toFixed(2)}×
              </span>{' '}
              diversity
            </div>
            <div className="text-[10px] text-[#71767b]">
              <span className="font-mono text-[#e7e9ea]">
                {explanation.oonMultiplier.toFixed(2)}×
              </span>{' '}
              out-of-network
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export interface TweetCardProps {
  candidate: ScoredCandidate;
}

export function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, in_network, explanation } = candidate;

  const avatarColor = PERSONA_AVATAR_COLOR[author.persona_type];
  const badgeClass = PERSONA_BADGE_CLASS[author.persona_type];
  const initials = author.display_name.charAt(0).toUpperCase();
  const relTime = getRelativeTime(tweet.created_at);

  return (
    <article
      className="px-4 py-3 border-b border-[#2f3336] hover:bg-[#080808] transition-colors cursor-pointer"
      role="article"
      aria-label={`Tweet by ${author.display_name}`}
    >
      {tweet.tweet_type === 'repost' && (
        <div className="flex items-center gap-2 mb-2 pl-10 text-[#71767b] text-xs font-medium">
          <Repeat2 size={14} strokeWidth={1.75} aria-hidden="true" />
          <span>{author.display_name} Reposted</span>
        </div>
      )}

      <div className="flex gap-3">
        <div className="shrink-0 pt-0.5">
          <Link
            href={`/profile/${author.username}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`View ${author.display_name}'s profile`}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white select-none"
              style={{ backgroundColor: avatarColor }}
              aria-hidden="true"
            >
              {initials}
            </div>
          </Link>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 leading-none">
            <Link
              href={`/profile/${author.username}`}
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-[#e7e9ea] text-sm hover:underline truncate max-w-[180px]"
            >
              {author.display_name}
            </Link>
            <span className="text-[#71767b] text-sm truncate max-w-[140px]">
              @{author.username}
            </span>
            <span className="text-[#71767b] text-sm" aria-hidden="true">·</span>
            <time
              dateTime={tweet.created_at}
              className="text-[#71767b] text-sm"
              title={new Date(tweet.created_at).toLocaleString()}
            >
              {relTime}
            </time>

            <div className="ml-auto flex items-center gap-1.5">
              <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 rounded-full font-medium h-auto', badgeClass)}>
                {author.persona_type}
              </Badge>
              {!in_network && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 rounded-full font-medium h-auto bg-[#1d9bf0]/10 text-[#1d9bf0] border-[#1d9bf0]/20">
                  suggested
                </Badge>
              )}
            </div>
          </div>

          {tweet.tweet_type === 'reply' && tweet.parent_tweet_id && (
            <p className="text-[#71767b] text-xs mt-0.5">
              Replying to{' '}
              <span className="text-[#1d9bf0]">a tweet</span>
            </p>
          )}

          <p className="mt-1 text-[#e7e9ea] text-[15px] leading-[20px] whitespace-pre-wrap break-words">
            {tweet.content}
          </p>

          {tweet.tweet_type === 'quote' && tweet.quoted_tweet_id && (
            <div className="mt-2 rounded-xl border border-[#2f3336] p-3">
              <p className="text-[#71767b] text-xs">
                Quoted tweet ·{' '}
                <span className="font-mono text-[10px]">
                  {tweet.quoted_tweet_id.slice(0, 8)}…
                </span>
              </p>
            </div>
          )}

          <div
            className="flex items-center mt-3 -ml-2"
            role="group"
            aria-label="Tweet engagement actions"
          >
            <Tooltip>
              <TooltipTrigger
                className="flex items-center gap-1 text-[#71767b] hover:text-[#1d9bf0] group transition-colors mr-5"
                aria-label={`${tweet.reply_count} replies`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                  <MessageCircle size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {tweet.reply_count > 0 && (
                  <span className="text-xs tabular-nums">{formatCount(tweet.reply_count)}</span>
                )}
              </TooltipTrigger>
              <TooltipContent>Reply</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                className="flex items-center gap-1 text-[#71767b] hover:text-[#00ba7c] group transition-colors mr-5"
                aria-label={`${tweet.repost_count} reposts`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors">
                  <Repeat2 size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {tweet.repost_count > 0 && (
                  <span className="text-xs tabular-nums">{formatCount(tweet.repost_count)}</span>
                )}
              </TooltipTrigger>
              <TooltipContent>Repost</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                className="flex items-center gap-1 text-[#71767b] hover:text-[#f91880] group transition-colors mr-5"
                aria-label={`${tweet.like_count} likes`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#f91880]/10 transition-colors">
                  <Heart size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {tweet.like_count > 0 && (
                  <span className="text-xs tabular-nums">{formatCount(tweet.like_count)}</span>
                )}
              </TooltipTrigger>
              <TooltipContent>Like</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger
                className="flex items-center gap-1 text-[#71767b] hover:text-[#1d9bf0] group transition-colors ml-auto"
                aria-label={`${tweet.click_count} views`}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="p-1.5 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors">
                  <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
                </span>
                {tweet.click_count > 0 && (
                  <span className="text-xs tabular-nums">{formatCount(tweet.click_count)}</span>
                )}
              </TooltipTrigger>
              <TooltipContent>Views</TooltipContent>
            </Tooltip>
          </div>

          {explanation !== null && <WhyThisTweet explanation={explanation} />}
        </div>
      </div>
    </article>
  );
}

export default TweetCard;

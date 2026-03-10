'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { ScoredCandidate } from '@/lib/types/ranking';
import type { PersonaType, EngagementType } from '@/lib/types/database';

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
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / 3_600_000;
  if (diffH < 1) return `${Math.round(diffMs / 60_000)}m`;
  if (diffH < 24) return `${Math.round(diffH)}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[#71767B] text-xs">{label}</span>
      <span className="text-[#E7E9EA] text-xs font-mono">{value.toFixed(4)}</span>
    </div>
  );
}

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow Author',
  not_interested: 'Not Interested',
};

export function TweetCard({ candidate }: { candidate: ScoredCandidate }) {
  const { tweet, author, score, in_network, explanation } = candidate;
  const [whyOpen, setWhyOpen] = useState(false);

  const personaColors = PERSONA_COLORS[author.persona_type];

  return (
    <article className="flex gap-3 px-4 py-3 border-b border-[#2F3336] hover:bg-[#080808] transition-colors cursor-pointer">
      <Link href={`/v2/profile/${author.username}`} onClick={(e) => e.stopPropagation()} className="shrink-0">
        <Avatar className="w-12 h-12">
          <AvatarImage src={author.avatar_url} alt={author.display_name} />
          <AvatarFallback className="bg-[#2F3336] text-[#E7E9EA]">
            {author.display_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/v2/profile/${author.username}`}
            className="font-bold text-[15px] text-[#E7E9EA] hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {author.display_name}
          </Link>
          <Badge
            className={cn(
              'text-[11px] px-1.5 py-0 border rounded-md font-medium',
              personaColors.bg,
              personaColors.text,
              personaColors.border
            )}
          >
            {author.persona_type}
          </Badge>
          {!in_network && (
            <Badge className="text-[11px] px-1.5 py-0 border rounded-md bg-transparent text-[#71767B] border-[#2F3336]">
              OON
            </Badge>
          )}
          <span className="text-[#71767B] text-[15px] truncate">@{author.username}</span>
          <span className="text-[#71767B] text-[15px]">·</span>
          <span className="text-[#71767B] text-[15px]">{formatDate(tweet.created_at)}</span>
        </div>

        <p className="mt-1 text-[15px] text-[#E7E9EA] leading-[1.5] break-words whitespace-pre-wrap">
          {tweet.content}
        </p>

        <div className="flex items-center gap-6 mt-3">
          <button
            className="flex items-center gap-1.5 group"
            aria-label={`${tweet.reply_count} replies`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
              <MessageCircle className="w-5 h-5 text-[#71767B] group-hover:text-[#1D9BF0]" />
            </span>
            <span className="text-[13px] text-[#71767B] group-hover:text-[#1D9BF0]">
              {formatCount(tweet.reply_count)}
            </span>
          </button>

          <button
            className="flex items-center gap-1.5 group"
            aria-label={`${tweet.repost_count} reposts`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#00B87A]/10 transition-colors">
              <Repeat2 className="w-5 h-5 text-[#71767B] group-hover:text-[#00B87A]" />
            </span>
            <span className="text-[13px] text-[#71767B] group-hover:text-[#00B87A]">
              {formatCount(tweet.repost_count)}
            </span>
          </button>

          <button
            className="flex items-center gap-1.5 group"
            aria-label={`${tweet.like_count} likes`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#F91A82]/10 transition-colors">
              <Heart className="w-5 h-5 text-[#71767B] group-hover:text-[#F91A82]" />
            </span>
            <span className="text-[13px] text-[#71767B] group-hover:text-[#F91A82]">
              {formatCount(tweet.like_count)}
            </span>
          </button>

          <button
            className="flex items-center gap-1.5 group"
            aria-label={`${tweet.click_count} views`}
          >
            <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
              <BarChart2 className="w-5 h-5 text-[#71767B] group-hover:text-[#1D9BF0]" />
            </span>
            <span className="text-[13px] text-[#71767B] group-hover:text-[#1D9BF0]">
              {formatCount(tweet.click_count)}
            </span>
          </button>
        </div>

        {explanation && (
          <Collapsible open={whyOpen} onOpenChange={setWhyOpen}>
            <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-[13px] text-[#1D9BF0] hover:underline">
              Why this tweet?
              {whyOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 p-3 rounded-xl bg-[#16181C] border border-[#2F3336]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#E7E9EA] text-sm font-bold">Score breakdown</span>
                  <span className="text-[#1D9BF0] text-sm font-mono font-bold">{score.toFixed(4)}</span>
                </div>
                <div className="space-y-0.5">
                  <ScoreRow label="Recency" value={explanation.recencyScore} />
                  <ScoreRow label="Popularity" value={explanation.popularityScore} />
                  <ScoreRow label="Network" value={explanation.networkScore} />
                  <ScoreRow label="Topic" value={explanation.topicScore} />
                </div>
                <div className="mt-2 pt-2 border-t border-[#2F3336] space-y-0.5">
                  {(Object.entries(explanation.engagementTypeScores) as [EngagementType, number][]).map(([type, val]) => (
                    <ScoreRow key={type} label={ENGAGEMENT_LABELS[type]} value={val} />
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-[#2F3336] space-y-0.5">
                  <ScoreRow label="Author diversity ×" value={explanation.authorDiversityMultiplier} />
                  <ScoreRow label="OON ×" value={explanation.oonMultiplier} />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  );
}

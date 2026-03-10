'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle, Repeat2, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ScoredCandidate } from '@/lib/types';

interface TweetCardProps {
  candidate: ScoredCandidate;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  if (diffH < 24) return `${Math.max(1, Math.floor(diffH))}h`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TweetCard({ candidate }: TweetCardProps) {
  const { tweet, author, score, in_network, explanation } = candidate;
  const [open, setOpen] = useState(false);

  return (
    <Card className="rounded-none border-0 border-b border-[#2F3336] bg-black hover:bg-[#080808] transition-colors px-0 py-0 gap-0">
      <div className="flex gap-3 px-4 py-3">
        <Link href={`/v1/profile/${author.username}`} className="shrink-0 mt-0.5">
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
              href={`/v1/profile/${author.username}`}
              className="font-bold text-[15px] text-[#E7E9EA] hover:underline truncate"
            >
              {author.display_name}
            </Link>
            <span className="text-[15px] text-[#71767B] truncate">@{author.username}</span>
            <span className="text-[#71767B] text-sm">·</span>
            <span className="text-[#71767B] text-sm">{formatDate(tweet.created_at)}</span>
            {!in_network && (
              <Badge variant="outline" className="text-xs border-[#2F3336] text-[#71767B] ml-1">
                Suggested
              </Badge>
            )}
            <Badge
              variant="secondary"
              className="text-xs bg-[#16181C] text-[#71767B] border-[#2F3336]"
            >
              {author.persona_type}
            </Badge>
          </div>

          <p className="text-[15px] text-[#E7E9EA] leading-[1.5] mt-1 break-words">{tweet.content}</p>

          <div className="flex items-center gap-6 mt-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-[#71767B] hover:text-[#1D9BF0] group"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#1D9BF0]/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </span>
              <span className="text-sm">{formatCount(tweet.reply_count)}</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 text-[#71767B] hover:text-[#00B87A] group"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#00B87A]/10 transition-colors">
                <Repeat2 className="w-5 h-5" />
              </span>
              <span className="text-sm">{formatCount(tweet.repost_count)}</span>
            </button>

            <button
              type="button"
              className="flex items-center gap-1.5 text-[#71767B] hover:text-[#F91A82] group"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full group-hover:bg-[#F91A82]/10 transition-colors">
                <Heart className="w-5 h-5" />
              </span>
              <span className="text-sm">{formatCount(tweet.like_count)}</span>
            </button>

            <div className="flex items-center gap-1.5 text-[#71767B]">
              <span className="flex items-center justify-center w-9 h-9">
                <Eye className="w-5 h-5" />
              </span>
              <span className="text-sm">{formatCount(tweet.click_count)}</span>
            </div>

            <span className="ml-auto text-sm text-[#71767B] font-medium">
              {(score * 100).toFixed(1)}
            </span>
          </div>

          {explanation && (
            <Collapsible open={open} onOpenChange={setOpen}>
              <CollapsibleTrigger
                className={cn(
                  'mt-2 flex items-center gap-1 text-xs text-[#71767B] hover:text-[#1D9BF0] transition-colors cursor-pointer select-none'
                )}
              >
                <span>Why this tweet?</span>
                <ChevronDown
                  className={cn('w-3 h-3 transition-transform', open && 'rotate-180')}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <div className="rounded-lg bg-[#16181C] border border-[#2F3336] p-3 space-y-1.5 text-xs">
                  <ScoreRow label="Recency" value={explanation.recencyScore} />
                  <ScoreRow label="Popularity" value={explanation.popularityScore} />
                  <ScoreRow label="Network" value={explanation.networkScore} />
                  <ScoreRow label="Topic" value={explanation.topicScore} />
                  <ScoreRow label="Author Diversity" value={explanation.authorDiversityMultiplier} />
                  <ScoreRow label="OON Multiplier" value={explanation.oonMultiplier} />
                  <div className="pt-1.5 border-t border-[#2F3336] flex justify-between font-semibold text-[#E7E9EA]">
                    <span>Total Score</span>
                    <span>{explanation.totalScore.toFixed(4)}</span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </div>
    </Card>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[#71767B]">
      <span>{label}</span>
      <span className="text-[#E7E9EA]">{value.toFixed(4)}</span>
    </div>
  );
}

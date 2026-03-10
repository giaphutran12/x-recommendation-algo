'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MessageCircle, Repeat2, Heart, BarChart2, ChevronDown } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { ScoredCandidate } from '@/lib/types/ranking'
import type { PersonaType } from '@/lib/types/database'

const PERSONA_COLORS: Record<PersonaType, string> = {
  founder: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  journalist: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10',
  meme: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  trader: 'text-green-400 border-green-500/30 bg-green-500/10',
  politician: 'text-red-400 border-red-500/30 bg-red-500/10',
  tech: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  culture: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function formatPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`
}

function formatRelativeTime(iso: string): string {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diffSec = Math.floor((now - then) / 1000)

  if (diffSec < 60) return `${diffSec}s`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d`

  const d = new Date(iso)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getDate()}`
}

interface ScoreBarProps {
  label: string
  value: number
  max: number
  color?: string
}

function ScoreBar({ label, value, max, color = 'var(--chart-1)' }: ScoreBarProps) {
   const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
   return (
     <div className="flex items-center gap-3">
       <span className="w-[100px] shrink-0 text-sm text-muted-foreground">{label}</span>
       <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
         <div
           className="h-full rounded-full transition-all"
           style={{ width: `${pct}%`, backgroundColor: color }}
         />
       </div>
       <span className="w-10 text-right text-sm tabular-nums text-foreground">
         {value.toFixed(2)}
       </span>
     </div>
   )
 }

export default function TweetCard({ candidate }: { candidate: ScoredCandidate }) {
  const { tweet, author, score, in_network, engagement_predictions, explanation } = candidate
  const [open, setOpen] = useState(false)

  const maxComponentScore = explanation
    ? Math.max(
        explanation.recencyScore,
        explanation.popularityScore,
        explanation.networkScore,
        explanation.topicScore,
        0.001,
      )
    : 1

  return (
    <TooltipProvider>
      <article className="border-b border-border mx-4 px-8 py-7 transition-colors hover:bg-accent">
        <div className="flex gap-4">
          <div className="shrink-0">
            <Link href={`/v7/profile/${author.username}`} tabIndex={-1} aria-hidden="true">
              <Avatar className="size-12">
                <AvatarImage src={author.avatar_url} alt={author.display_name} />
                <AvatarFallback className="bg-muted text-base font-semibold text-foreground">
                  {author.display_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Link
                href={`/v7/profile/${author.username}`}
                className="text-[15px] font-bold text-foreground hover:underline"
              >
                {author.display_name}
              </Link>
              <Link
                href={`/v7/profile/${author.username}`}
                className="text-[15px] text-muted-foreground hover:underline"
              >
                @{author.username}
              </Link>
              <span className="text-muted-foreground">·</span>
              <Tooltip>
                <TooltipTrigger className="text-[15px] text-muted-foreground hover:underline">
                  {formatRelativeTime(tweet.created_at)}
                </TooltipTrigger>
                <TooltipContent>
                  {new Date(tweet.created_at).toLocaleString()}
                </TooltipContent>
              </Tooltip>
              <Badge
                variant="outline"
                className={cn(
                  'h-4 border capitalize text-[10px]',
                  PERSONA_COLORS[author.persona_type],
                )}
              >
                {author.persona_type}
              </Badge>
            </div>

            <p className="mt-1 whitespace-pre-wrap break-words text-[15px] font-normal leading-relaxed text-foreground">
              {tweet.content}
            </p>

            <div className="-ml-2 mt-4 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  className="group flex min-h-9 min-w-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-primary/10"
                  aria-label={`${tweet.reply_count} replies`}
                >
                  <MessageCircle className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  {tweet.reply_count > 0 && (
                    <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
                      {formatCount(tweet.reply_count)}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>Reply</TooltipContent>
              </Tooltip>

               <Tooltip>
                 <TooltipTrigger
                   className="group flex min-h-9 min-w-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-emerald-500/10"
                   aria-label={`${tweet.repost_count} reposts`}
                 >
                   <Repeat2 className="size-5 text-muted-foreground transition-colors group-hover:text-emerald-500" />
                   {tweet.repost_count > 0 && (
                     <span className="text-xs text-muted-foreground transition-colors group-hover:text-emerald-500">
                       {formatCount(tweet.repost_count)}
                     </span>
                   )}
                 </TooltipTrigger>
                 <TooltipContent>Repost</TooltipContent>
               </Tooltip>

               <Tooltip>
                 <TooltipTrigger
                   className="group flex min-h-9 min-w-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-pink-500/10"
                   aria-label={`${tweet.like_count} likes`}
                 >
                   <Heart className="size-5 text-muted-foreground transition-colors group-hover:text-pink-500" />
                   {tweet.like_count > 0 && (
                     <span className="text-xs text-muted-foreground transition-colors group-hover:text-pink-500">
                       {formatCount(tweet.like_count)}
                     </span>
                   )}
                 </TooltipTrigger>
                 <TooltipContent>Like</TooltipContent>
               </Tooltip>

              <Tooltip>
                <TooltipTrigger
                  className="group flex min-h-9 min-w-9 items-center gap-1.5 rounded-full px-2 transition-colors hover:bg-primary/10"
                  aria-label={`${tweet.click_count} views`}
                >
                  <BarChart2 className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  {tweet.click_count > 0 && (
                    <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">
                      {formatCount(tweet.click_count)}
                    </span>
                  )}
                </TooltipTrigger>
                <TooltipContent>Views</TooltipContent>
              </Tooltip>
            </div>

            {explanation ? (
              <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
                  <ChevronDown
                    className={cn(
                      'size-3.5 transition-transform duration-200',
                      open && 'rotate-180',
                    )}
                  />
                  Why this tweet?
                  <span className="ml-0.5 font-medium text-primary">
                    {score.toFixed(2)}
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-5 space-y-5 pb-3">
                   <div className="space-y-4">
                    <ScoreBar
                      label="Recency"
                      value={explanation.recencyScore}
                      max={maxComponentScore}
                      color="var(--chart-1)"
                    />
                    <ScoreBar
                      label="Popularity"
                      value={explanation.popularityScore}
                      max={maxComponentScore}
                      color="var(--chart-2)"
                    />
                    <ScoreBar
                      label="Network"
                      value={explanation.networkScore}
                      max={maxComponentScore}
                      color="var(--chart-3)"
                    />
                    <ScoreBar
                      label="Topic"
                      value={explanation.topicScore}
                      max={maxComponentScore}
                      color="var(--chart-4)"
                    />
                  </div>

                   <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-sm">
                    <span className="text-muted-foreground">
                      Total:{' '}
                      <span className="font-medium text-foreground">
                        {explanation.totalScore.toFixed(2)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      In-network:
                       <Badge
                         variant="outline"
                         className={cn(
                           'h-4 border text-[10px]',
                           in_network
                             ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                             : 'border-border text-muted-foreground',
                         )}
                       >
                         {in_network ? 'Yes' : 'No'}
                       </Badge>
                    </span>
                  </div>

                   <div className="flex flex-wrap gap-x-6 gap-y-1 pt-3 text-sm text-muted-foreground">
                    <span>
                      Author diversity:{' '}
                      <span className="text-foreground">
                        ×{explanation.authorDiversityMultiplier.toFixed(2)}
                      </span>
                    </span>
                    <span>
                      OON penalty:{' '}
                      <span className="text-foreground">
                        ×{explanation.oonMultiplier.toFixed(2)}
                      </span>
                    </span>
                  </div>

                   {engagement_predictions ? (
                     <div className="border-t border-border pt-5">
                       <p className="mb-3 text-sm text-muted-foreground">Predicted engagement</p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                         {[
                           { label: 'Like', value: engagement_predictions.like },
                           { label: 'Reply', value: engagement_predictions.reply },
                           { label: 'Repost', value: engagement_predictions.repost },
                           { label: 'Click', value: engagement_predictions.click },
                         ].map(({ label, value }) => (
                           <div key={label} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="tabular-nums text-foreground">
                              {formatPct(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </div>
        </div>
      </article>
    </TooltipProvider>
  )
}

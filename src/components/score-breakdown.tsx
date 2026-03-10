// Score breakdown panel — explainability UI for feed ranking
// Rendered inside TweetCard when user expands "Why this tweet?"

import type { ScoreExplanation } from '@/lib/types/ranking';
import type { EngagementType } from '@/lib/types/database';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScoreBreakdownProps {
  explanation: ScoreExplanation;
  rank: number;
  inNetwork: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toFixed(2);
}

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow Author',
  not_interested: 'Not Interested',
};

function buildSummary(
  explanation: ScoreExplanation,
  rank: number,
  inNetwork: boolean,
): string {
  const ranked = [
    { label: 'recency', value: explanation.recencyScore },
    { label: 'popularity', value: explanation.popularityScore },
    { label: 'network affinity', value: explanation.networkScore },
    { label: 'topic relevance', value: explanation.topicScore },
  ].sort((a, b) => b.value - a.value);

  const top = ranked[0];
  const second = ranked[1];

  const networkNote = inNetwork
    ? 'from someone you follow'
    : explanation.oonMultiplier < 1.0
      ? 'from outside your network'
      : 'from a new account';

  const topLabel = top.label === 'network affinity' && inNetwork
    ? 'network affinity (you follow this account)'
    : top.label;

  return (
    `This tweet ranks #${rank} because it scores high on ${topLabel} (${fmt(top.value)}) ` +
    `and ${second.label} (${fmt(second.value)}). It's ${networkNote}.`
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SignalBar({
  label,
  value,
  maxValue,
  colorClass,
}: {
  label: string;
  value: number;
  maxValue: number;
  colorClass: string;
}) {
  const widthPct = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="w-32 shrink-0 text-right text-xs leading-tight"
        style={{ color: '#71767b' }}
      >
        {label}
      </span>

      <div
        className="relative h-2 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: '#2f3336' }}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${widthPct}%` }}
        />
      </div>

      <span
        className="w-10 shrink-0 text-right font-mono text-xs tabular-nums"
        style={{ color: '#e7e9ea' }}
      >
        {fmt(value)}
      </span>
    </div>
  );
}

function EngagementRow({
  type,
  score,
}: {
  type: EngagementType;
  score: number;
}) {
  const isNegative = type === 'not_interested';
  const valueColor = isNegative && score > 0 ? '#f87171' : '#71767b';

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs" style={{ color: '#71767b' }}>
        {ENGAGEMENT_LABELS[type]}
      </span>
      <span
        className="font-mono text-xs tabular-nums"
        style={{ color: valueColor }}
      >
        {fmt(score)}
      </span>
    </div>
  );
}

function MultiplierBadge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  let bgColor: string;
  let textColor: string;
  let borderColor: string;

  if (value < 1.0) {
    bgColor = label.includes('network') ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)';
    textColor = label.includes('network') ? '#f87171' : '#facc15';
    borderColor = label.includes('network') ? 'rgba(239,68,68,0.3)' : 'rgba(234,179,8,0.3)';
  } else {
    bgColor = 'rgba(34,197,94,0.15)';
    textColor = '#4ade80';
    borderColor = 'rgba(34,197,94,0.3)';
  }

  return (
    <Badge
      variant="outline"
      className="rounded-full px-2 py-0.5 font-medium"
      style={{ backgroundColor: bgColor, color: textColor, borderColor }}
    >
      <span className="font-mono">×{fmt(value)}</span>
      <span>{label}</span>
    </Badge>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ScoreBreakdown({ explanation, rank, inNetwork }: ScoreBreakdownProps) {
  const {
    recencyScore,
    popularityScore,
    networkScore,
    topicScore,
    engagementTypeScores,
    authorDiversityMultiplier,
    oonMultiplier,
    totalScore,
  } = explanation;

  const signals: Array<{ label: string; value: number; colorClass: string }> = [
    { label: 'Recency', value: recencyScore, colorClass: 'bg-blue-500' },
    { label: 'Popularity', value: popularityScore, colorClass: 'bg-green-500' },
    { label: 'Network', value: networkScore, colorClass: 'bg-purple-500' },
    { label: 'Topic Relevance', value: topicScore, colorClass: 'bg-orange-500' },
  ];

  const maxSignalValue = Math.max(recencyScore, popularityScore, networkScore, topicScore, 0.001);

  const engagementTypes: EngagementType[] = [
    'like',
    'reply',
    'repost',
    'click',
    'follow_author',
    'not_interested',
  ];

  const summary = buildSummary(explanation, rank, inNetwork);

  return (
    <Card className="bg-[#16181c] border border-[#2f3336] text-[#e7e9ea] ring-0 gap-0 py-0 text-sm">
      <CardHeader className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#71767b' }}>
              Rank
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: '#1d9bf0' }}>
              #{rank}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-widest" style={{ color: '#71767b' }}>
              Total Score
            </p>
            <p className="font-mono text-2xl font-bold tabular-nums" style={{ color: '#e7e9ea' }}>
              {totalScore.toFixed(4)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex flex-col gap-4">
        <p
          className="rounded-lg p-3 text-xs leading-relaxed"
          style={{ backgroundColor: 'rgba(29,155,240,0.08)', color: '#93c5fd', borderLeft: '2px solid #1d9bf0' }}
        >
          {summary}
        </p>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#71767b' }}>
            Signal Breakdown
          </p>
          <div className="flex flex-col gap-2">
            {signals.map((sig) => (
              <SignalBar
                key={sig.label}
                label={sig.label}
                value={sig.value}
                maxValue={maxSignalValue}
                colorClass={sig.colorClass}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-[#2f3336]" />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#71767b' }}>
            Predicted Engagement
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            {engagementTypes.map((type) => (
              <EngagementRow
                key={type}
                type={type}
                score={engagementTypeScores[type] ?? 0}
              />
            ))}
          </div>
        </div>

        <Separator className="bg-[#2f3336]" />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: '#71767b' }}>
            Modifiers
          </p>
          <div className="flex flex-wrap gap-2">
            <MultiplierBadge
              value={authorDiversityMultiplier}
              label="author diversity"
            />
            {oonMultiplier < 1.0 && (
              <MultiplierBadge
                value={oonMultiplier}
                label="out-of-network"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ScoreBreakdown;

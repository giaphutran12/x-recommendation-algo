'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const ENGAGEMENT_TYPES: EngagementType[] = [
  'like',
  'reply',
  'repost',
  'click',
  'follow_author',
  'not_interested',
];

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow Author',
  not_interested: 'Not Interested',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type SaveStatus = 'idle' | 'saving' | 'saved';

type MainWeightKey = 'recency' | 'popularity' | 'network' | 'topicRelevance';

interface WeightState {
  recency: number;
  popularity: number;
  network: number;
  topicRelevance: number;
  engagement: Record<EngagementType, number>;
}

const DEFAULT_WEIGHT_STATE: WeightState = {
  recency: 1.0,
  popularity: 1.0,
  network: 1.0,
  topicRelevance: 1.0,
  engagement: {
    like: 1.0,
    reply: 1.0,
    repost: 1.0,
    click: 1.0,
    follow_author: 1.0,
    not_interested: 1.0,
  },
};

function cloneDefaultState(): WeightState {
  return {
    ...DEFAULT_WEIGHT_STATE,
    engagement: { ...DEFAULT_WEIGHT_STATE.engagement },
  };
}

function cloneWeightState(w: WeightState): WeightState {
  return { ...w, engagement: { ...w.engagement } };
}

function weightsEqual(a: WeightState, b: WeightState): boolean {
  if (
    a.recency !== b.recency ||
    a.popularity !== b.popularity ||
    a.network !== b.network ||
    a.topicRelevance !== b.topicRelevance
  ) {
    return false;
  }
  for (const type of ENGAGEMENT_TYPES) {
    if (a.engagement[type] !== b.engagement[type]) return false;
  }
  return true;
}

// ─── SliderRow component ──────────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="text-[13px] text-[#e7e9ea]">{label}</span>
        <span className="text-[13px] font-mono font-semibold text-[#1d9bf0] tabular-nums w-[2.5rem] text-right">
          {value.toFixed(1)}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => {
          const next = typeof v === 'number' ? v : v[0];
          if (next !== undefined) onChange(next);
        }}
        min={0}
        max={2}
        step={0.1}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={value}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface AlgorithmPanelProps {
  userId?: string;
}

export function AlgorithmPanel({ userId = DEFAULT_VIEWER_ID }: AlgorithmPanelProps) {
  const [weights, setWeights] = useState<WeightState>(cloneDefaultState);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  const [savedWeights, setSavedWeights] = useState<WeightState>(cloneDefaultState);

  const isMounted = useRef(false);

  const isDirty = useMemo(
    () => !weightsEqual(weights, savedWeights),
    [weights, savedWeights],
  );

  // ── Fetch initial weights on mount ──────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    const fetchWeights = async () => {
      try {
        const res = await fetch(`/api/weights?userId=${encodeURIComponent(userId)}`);
        if (!res.ok) return;

        const data = (await res.json()) as { weights?: AlgorithmWeights };
        if (!data.weights || !isMounted.current) return;

        const w = data.weights;
        const loaded: WeightState = {
          recency: w.recency_weight,
          popularity: w.popularity_weight,
          network: w.network_weight,
          topicRelevance: w.topic_relevance_weight,
          engagement: w.engagement_type_weights ?? { ...DEFAULT_WEIGHT_STATE.engagement },
        };

        setWeights(loaded);
        setSavedWeights(cloneWeightState(loaded));

        console.log('[ALGO-PANEL] Loaded weights for userId:', userId);
      } catch {
        // Fallback to defaults — silently ignore
      }
    };

    fetchWeights();

    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  // ── Save weights to API (only called on explicit "Update Feed" click) ───────
  const executeSave = useCallback(
    async (w: WeightState) => {
      setSaveStatus('saving');
      try {
        const res = await fetch('/api/weights', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            recency_weight: w.recency,
            popularity_weight: w.popularity,
            network_weight: w.network,
            topic_relevance_weight: w.topicRelevance,
            engagement_type_weights: w.engagement,
            updated_at: new Date().toISOString(),
          } satisfies Omit<AlgorithmWeights, 'engagement_type_weights'> & {
            engagement_type_weights: Record<EngagementType, number>;
          }),
        });

        if (!isMounted.current) return;

        if (res.ok) {
          setSavedWeights(cloneWeightState(w));
          setSaveStatus('saved');
          setTimeout(() => {
            if (isMounted.current) setSaveStatus('idle');
          }, 1500);
        } else {
          setSaveStatus('idle');
        }

        console.log('[ALGO-PANEL] PUT weights status:', res.status, 'userId:', userId);
      } catch {
        if (isMounted.current) setSaveStatus('idle');
      }
    },
    [userId],
  );

  // ── "Update Feed" handler — saves weights + triggers SSE re-rank ────────────
  const handleUpdateFeed = useCallback(() => {
    executeSave(weights);
    console.log('[ALGO-PANEL] Update Feed clicked — saving weights and triggering re-rank');
  }, [executeSave, weights]);

  // ── Main weight slider handler (local state only, no save) ──────────────────
  const handleMainChange = useCallback(
    (key: MainWeightKey, value: number) => {
      setWeights((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ── Engagement weight slider handler (local state only, no save) ────────────
  const handleEngagementChange = useCallback(
    (type: EngagementType, value: number) => {
      setWeights((prev) => ({
        ...prev,
        engagement: { ...prev.engagement, [type]: value },
      }));
    },
    [],
  );

  // ── Reset handler ─────────────────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    const reset = cloneDefaultState();
    setWeights(reset);
    executeSave(reset);
    console.log('[ALGO-PANEL] Reset weights to defaults');
  }, [executeSave]);

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Card
      className="bg-[#16181c] border border-[#2f3336] ring-0 shadow-none rounded-2xl"
      role="region"
      aria-label="Algorithm weight controls"
    >
      <CardHeader>
        <CardTitle className="text-[15px] font-semibold text-[#e7e9ea] leading-tight">
          Algorithm Weights
        </CardTitle>
        <CardAction className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span
              className="text-[11px] text-[#71767b]"
              role="status"
              aria-live="polite"
              style={{ animation: 'pulse 1.5s ease-in-out infinite' }}
            >
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span
              className="text-[11px] text-[#1d9bf0]"
              role="status"
              aria-live="polite"
            >
              Saved ✓
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-[12px] text-[#71767b] hover:text-[#e7e9ea] hover:bg-[#2f3336]"
            aria-label="Reset all weights to defaults (1.0)"
          >
            Reset
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* ── Main sliders ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <SliderRow
            label="Recency"
            value={weights.recency}
            onChange={(v) => handleMainChange('recency', v)}
          />
          <SliderRow
            label="Popularity"
            value={weights.popularity}
            onChange={(v) => handleMainChange('popularity', v)}
          />
          <SliderRow
            label="Network Proximity"
            value={weights.network}
            onChange={(v) => handleMainChange('network', v)}
          />
          <SliderRow
            label="Topic Relevance"
            value={weights.topicRelevance}
            onChange={(v) => handleMainChange('topicRelevance', v)}
          />
        </div>

        {/* ── Advanced collapsible ──────────────────────────────────────── */}
        <div className="border-t border-[#2f3336] pt-4">
          <Collapsible open={isAdvancedOpen} onOpenChange={(open) => setIsAdvancedOpen(open)}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-[12px] text-[#71767b] hover:text-[#e7e9ea] transition-colors py-1.5">
              <span>Advanced: Engagement Weights</span>
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  isAdvancedOpen && 'rotate-180',
                )}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              id="algo-panel-advanced"
              className="flex flex-col gap-4 mt-3"
              role="group"
              aria-label="Engagement type weights"
            >
              {ENGAGEMENT_TYPES.map((type) => (
                <SliderRow
                  key={type}
                  label={ENGAGEMENT_LABELS[type]}
                  value={weights.engagement[type]}
                  onChange={(v) => handleEngagementChange(type, v)}
                />
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* ── Update Feed button — only visible when weights have changed ── */}
        {isDirty && (
          <Button
            onClick={handleUpdateFeed}
            disabled={saveStatus === 'saving'}
            className="w-full rounded-full bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] font-bold text-[14px] active:scale-[0.98] h-auto py-2.5"
            aria-label="Apply weight changes and refresh feed"
          >
            {saveStatus === 'saving' ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Updating…
              </span>
            ) : (
              'Update Feed'
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default AlgorithmPanel;

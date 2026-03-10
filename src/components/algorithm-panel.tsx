'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';

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

// ─── Slider component ─────────────────────────────────────────────────────────

interface SliderRowProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
}

function SliderRow({ label, value, onChange }: SliderRowProps) {
  const pct = ((value - 0) / (2.0 - 0)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[13px] text-[#e7e9ea]">{label}</span>
        <span className="text-[13px] font-mono font-semibold text-[#1d9bf0] tabular-nums w-[2.5rem] text-right">
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={2}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="algo-panel-range w-full appearance-none cursor-pointer rounded-full"
        style={{
          height: '3px',
          background: `linear-gradient(to right, #1d9bf0 ${pct}%, #2f3336 ${pct}%)`,
        }}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={value}
      />
    </div>
  );
}

// ─── Chevron icon ─────────────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="transition-transform duration-200 flex-shrink-0"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
    <>
      {/* Scoped styles for range slider thumb */}
      <style>{`
        .algo-panel-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d9bf0;
          cursor: pointer;
          border: 2px solid #16181c;
          box-shadow: 0 0 0 1px #1d9bf0;
          transition: box-shadow 0.15s ease;
        }
        .algo-panel-range:focus-visible::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(29, 155, 240, 0.3);
        }
        .algo-panel-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #1d9bf0;
          cursor: pointer;
          border: 2px solid #16181c;
          box-shadow: 0 0 0 1px #1d9bf0;
        }
        .algo-panel-range::-moz-range-progress {
          background-color: #1d9bf0;
          height: 3px;
          border-radius: 9999px;
        }
        .algo-panel-range::-moz-range-track {
          background-color: #2f3336;
          height: 3px;
          border-radius: 9999px;
        }
        .algo-panel-range:focus-visible {
          outline: none;
        }
      `}</style>

      <div
        className="bg-[#16181c] border border-[#2f3336] rounded-2xl p-4 flex flex-col gap-4"
        role="region"
        aria-label="Algorithm weight controls"
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[#e7e9ea] leading-tight">
            Algorithm Weights
          </h2>
          <div className="flex items-center gap-2">
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
            <button
              onClick={handleReset}
              className="text-[12px] text-[#71767b] hover:text-[#e7e9ea] px-2 py-0.5 rounded-lg hover:bg-[#2f3336] transition-colors"
              aria-label="Reset all weights to defaults (1.0)"
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── Main sliders ────────────────────────────────────────────────── */}
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

        {/* ── Advanced collapsible ────────────────────────────────────────── */}
        <div className="border-t border-[#2f3336] pt-3 flex flex-col gap-0">
          <button
            onClick={() => setIsAdvancedOpen((o) => !o)}
            className="flex items-center justify-between w-full text-[12px] text-[#71767b] hover:text-[#e7e9ea] transition-colors py-0.5"
            aria-expanded={isAdvancedOpen}
            aria-controls="algo-panel-advanced"
          >
            <span>Advanced: Engagement Weights</span>
            <ChevronIcon open={isAdvancedOpen} />
          </button>

          {isAdvancedOpen && (
            <div
              id="algo-panel-advanced"
              className="flex flex-col gap-3 mt-3"
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
            </div>
          )}
        </div>

        {/* ── Update Feed button — only visible when weights have changed ── */}
        {isDirty && (
          <button
            onClick={handleUpdateFeed}
            disabled={saveStatus === 'saving'}
            className="w-full py-2.5 rounded-full font-bold text-[14px] transition-all duration-200 bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
          </button>
        )}
      </div>
    </>
  );
}

export default AlgorithmPanel;

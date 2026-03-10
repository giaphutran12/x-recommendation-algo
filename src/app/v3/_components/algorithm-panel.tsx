'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 0.3,
  popularity_weight: 0.3,
  network_weight: 0.2,
  topic_relevance_weight: 0.2,
  engagement_type_weights: {
    like: 1.0,
    reply: 2.0,
    repost: 1.5,
    click: 0.5,
    follow_author: 3.0,
    not_interested: -3.0,
  },
  updated_at: new Date().toISOString(),
};

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

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (val: number) => void;
}

function SliderRow({ label, value, min, max, step, onChange }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[#E7E9EA] text-sm">{label}</span>
        <span className="text-[#71767B] text-xs font-mono tabular-nums w-10 text-right">
          {value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(val) => onChange(Array.isArray(val) ? val[0] : val)}
        aria-label={label}
      />
    </div>
  );
}

function PanelContent() {
  const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [savedWeights, setSavedWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadWeights() {
      try {
        const res = await fetch(`/api/weights?userId=${VIEWER_ID}`);
        if (!res.ok) throw new Error('Failed to fetch weights');
        const data = (await res.json()) as { weights: AlgorithmWeights };
        setWeights(data.weights);
        setSavedWeights(data.weights);
        console.log('[V3:ALGO] Weights loaded');
      } catch (err) {
        console.error('[V3:ALGO] Failed to load weights:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWeights();
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(weights) !== JSON.stringify(savedWeights);
  }, [weights, savedWeights]);

  const updateMainWeight = useCallback(
    (
      key: keyof Pick<
        AlgorithmWeights,
        'recency_weight' | 'popularity_weight' | 'network_weight' | 'topic_relevance_weight'
      >,
      val: number,
    ) => {
      setWeights((prev) => ({ ...prev, [key]: val }));
    },
    [],
  );

  const updateEngagementWeight = useCallback((type: EngagementType, val: number) => {
    setWeights((prev) => ({
      ...prev,
      engagement_type_weights: {
        ...prev.engagement_type_weights,
        [type]: val,
      },
    }));
  }, []);

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const payload: AlgorithmWeights = {
        ...weights,
        user_id: VIEWER_ID,
        updated_at: new Date().toISOString(),
      };
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Save failed: ${res.status}`);

      setSavedWeights({ ...weights });
      setSaveStatus('saved');
      console.log('[V3:ALGO] Weights saved successfully');

      window.dispatchEvent(new Event('v3:weights-saved'));
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      setSaveStatus('error');
      console.error('[V3:ALGO] Failed to save weights:', err);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }

  function handleReset() {
    setWeights(savedWeights);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-5 h-5 border-2 border-[#1D9BF0] border-t-transparent rounded-full animate-spin"
          aria-label="Loading weights"
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[#E7E9EA] font-bold text-lg">Algorithm</h2>
        <div className="flex items-center gap-1.5 text-xs" aria-live="polite">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-[#00B87A]">
              <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-[#F91A82]">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Error
            </span>
          )}
          {isDirty && saveStatus === 'idle' && (
            <span className="text-[#71767B]">Unsaved changes</span>
          )}
        </div>
      </div>

      <section aria-label="Main weights">
        <h3 className="text-[#71767B] text-xs font-semibold uppercase tracking-wider mb-3">
          Main Weights
        </h3>
        <div className="space-y-4">
          <SliderRow
            label="Recency"
            value={weights.recency_weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateMainWeight('recency_weight', v)}
          />
          <SliderRow
            label="Popularity"
            value={weights.popularity_weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateMainWeight('popularity_weight', v)}
          />
          <SliderRow
            label="Network"
            value={weights.network_weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateMainWeight('network_weight', v)}
          />
          <SliderRow
            label="Topic Relevance"
            value={weights.topic_relevance_weight}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => updateMainWeight('topic_relevance_weight', v)}
          />
        </div>
      </section>

      <Separator className="bg-[#2F3336]" />

      <Collapsible open={advancedOpen} onOpenChange={(open) => setAdvancedOpen(open)}>
        <CollapsibleTrigger
          className="flex items-center justify-between w-full text-left group cursor-pointer"
          aria-expanded={advancedOpen}
        >
          <h3 className="text-[#71767B] text-xs font-semibold uppercase tracking-wider group-hover:text-[#E7E9EA] transition-colors">
            Engagement Weights
          </h3>
          {advancedOpen ? (
            <ChevronUp className="w-4 h-4 text-[#71767B]" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#71767B]" aria-hidden="true" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="space-y-4 mt-3" aria-label="Engagement type weights">
            {ENGAGEMENT_TYPES.map((type) => (
              <SliderRow
                key={type}
                label={ENGAGEMENT_LABELS[type]}
                value={weights.engagement_type_weights[type]}
                min={type === 'not_interested' ? -5 : 0}
                max={type === 'not_interested' ? 0 : 5}
                step={0.1}
                onChange={(v) => updateEngagementWeight(type, v)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator className="bg-[#2F3336]" />

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
          className={cn(
            'flex-1 rounded-full font-bold text-sm transition-all',
            isDirty
              ? 'bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white'
              : 'bg-[#2F3336] text-[#71767B] cursor-not-allowed',
          )}
          aria-disabled={!isDirty}
        >
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-2">
              <div
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Saving...
            </span>
          ) : (
            'Update Feed'
          )}
        </Button>
        <Button
          onClick={handleReset}
          disabled={!isDirty}
          variant="outline"
          size="icon"
          className="rounded-full border-[#2F3336] text-[#71767B] hover:bg-[#E7E9EA]/10 hover:text-[#E7E9EA] hover:border-[#536471]"
          aria-label="Reset to saved values"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export default function AlgorithmPanel() {
  const [portalEl, setPortalEl] = useState<Element | null>(null);

  useEffect(() => {
    setPortalEl(document.getElementById('v3-algorithm-panel'));
  }, []);

  if (!portalEl) return null;

  return createPortal(
    <div className="sticky top-0 h-screen overflow-y-auto p-4">
      <PanelContent />
    </div>,
    portalEl,
  );
}

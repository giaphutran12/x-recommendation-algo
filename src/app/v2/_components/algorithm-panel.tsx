'use client';

import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';

const USER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_WEIGHTS: Omit<AlgorithmWeights, 'user_id' | 'updated_at'> = {
  recency_weight: 0.3,
  popularity_weight: 0.25,
  network_weight: 0.25,
  topic_relevance_weight: 0.2,
  engagement_type_weights: {
    like: 1.0,
    reply: 2.0,
    repost: 1.5,
    click: 0.5,
    follow_author: 3.0,
    not_interested: -2.0,
  },
};

const ENGAGEMENT_LABELS: Record<EngagementType, string> = {
  like: 'Like',
  reply: 'Reply',
  repost: 'Repost',
  click: 'Click',
  follow_author: 'Follow Author',
  not_interested: 'Not Interested',
};

interface AlgorithmPanelProps {
  onWeightsSaved?: () => void;
}

export function AlgorithmPanel({ onWeightsSaved }: AlgorithmPanelProps) {
  const [weights, setWeights] = useState<Omit<AlgorithmWeights, 'user_id' | 'updated_at'>>(DEFAULT_WEIGHTS);
  const [savedWeights, setSavedWeights] = useState<Omit<AlgorithmWeights, 'user_id' | 'updated_at'>>(DEFAULT_WEIGHTS);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/weights?userId=${USER_ID}`)
      .then((r) => r.json())
      .then((data: { weights: AlgorithmWeights }) => {
        const { user_id: _uid, updated_at: _ua, ...rest } = data.weights;
        setWeights(rest);
        setSavedWeights(rest);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const dirty =
      weights.recency_weight !== savedWeights.recency_weight ||
      weights.popularity_weight !== savedWeights.popularity_weight ||
      weights.network_weight !== savedWeights.network_weight ||
      weights.topic_relevance_weight !== savedWeights.topic_relevance_weight ||
      (Object.keys(weights.engagement_type_weights) as EngagementType[]).some(
        (k) => weights.engagement_type_weights[k] !== savedWeights.engagement_type_weights[k]
      );
    setIsDirty(dirty);
  }, [weights, savedWeights]);

  const setMain = useCallback((key: keyof Omit<AlgorithmWeights, 'user_id' | 'updated_at' | 'engagement_type_weights'>, val: number) => {
    setWeights((w) => ({ ...w, [key]: val }));
  }, []);

  const setEngagement = useCallback((key: EngagementType, val: number) => {
    setWeights((w) => ({
      ...w,
      engagement_type_weights: { ...w.engagement_type_weights, [key]: val },
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const body: AlgorithmWeights = {
        user_id: USER_ID,
        updated_at: new Date().toISOString(),
        ...weights,
      };
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Failed to save');
      setSavedWeights(weights);
      setSaveStatus('saved');
      onWeightsSaved?.();
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#E7E9EA] text-[20px] font-extrabold">Algorithm</h3>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-[13px] text-[#71767B] hover:text-[#E7E9EA] transition-colors"
          aria-label="Reset to defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-5">
        <SliderRow
          label="Recency"
          value={weights.recency_weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setMain('recency_weight', v)}
        />
        <SliderRow
          label="Popularity"
          value={weights.popularity_weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setMain('popularity_weight', v)}
        />
        <SliderRow
          label="Network"
          value={weights.network_weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setMain('network_weight', v)}
        />
        <SliderRow
          label="Topic Relevance"
          value={weights.topic_relevance_weight}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => setMain('topic_relevance_weight', v)}
        />
      </div>

      <Separator className="my-5 bg-[#2F3336]" />

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full text-[#71767B] hover:text-[#E7E9EA] transition-colors mb-3">
          <span className="text-[15px] font-semibold">Engagement Weights</span>
          {advancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-5 pb-1">
            {(Object.keys(weights.engagement_type_weights) as EngagementType[]).map((key) => (
              <SliderRow
                key={key}
                label={ENGAGEMENT_LABELS[key]}
                value={weights.engagement_type_weights[key]}
                min={-5}
                max={5}
                step={0.1}
                onChange={(v) => setEngagement(key, v)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-6 space-y-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={cn(
            'w-full font-bold rounded-full',
            isDirty
              ? 'bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white'
              : 'bg-[#1D9BF0]/50 text-white/50 cursor-not-allowed'
          )}
        >
          {isSaving ? 'Saving…' : 'Update Feed'}
        </Button>

        {saveStatus === 'saved' && (
          <p className="text-center text-[13px] text-[#00B87A] flex items-center justify-center gap-1.5">
            <Save className="w-3.5 h-3.5" />
            Weights saved — feed updating…
          </p>
        )}
        {saveStatus === 'error' && (
          <p className="text-center text-[13px] text-red-400">
            Failed to save. Try again.
          </p>
        )}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#E7E9EA] text-[14px]">{label}</span>
        <span className="text-[#71767B] text-[13px] font-mono w-12 text-right">{value.toFixed(2)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals: number | readonly number[]) => {
        const v = Array.isArray(vals) ? (vals as number[])[0] : (vals as number);
        onChange(v);
      }}
      />
    </div>
  );
}

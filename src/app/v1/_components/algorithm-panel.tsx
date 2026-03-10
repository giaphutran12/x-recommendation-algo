'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, RotateCcw, Zap, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { AlgorithmWeights, EngagementType } from '@/lib/types';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
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
    not_interested: -5.0,
  },
  updated_at: new Date().toISOString(),
};

const MAIN_SLIDERS: { key: keyof AlgorithmWeights; label: string }[] = [
  { key: 'recency_weight', label: 'Recency' },
  { key: 'popularity_weight', label: 'Popularity' },
  { key: 'network_weight', label: 'Network' },
  { key: 'topic_relevance_weight', label: 'Topic Relevance' },
];

const ENGAGEMENT_TYPES: { key: EngagementType; label: string }[] = [
  { key: 'like', label: 'Like' },
  { key: 'reply', label: 'Reply' },
  { key: 'repost', label: 'Repost' },
  { key: 'click', label: 'Click' },
  { key: 'follow_author', label: 'Follow Author' },
  { key: 'not_interested', label: 'Not Interested' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function AlgorithmPanel() {
  const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [savedWeights, setSavedWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    fetch(`/api/weights?userId=${VIEWER_ID}`)
      .then((r) => r.json())
      .then((data: { weights: AlgorithmWeights }) => {
        if (data.weights) {
          setWeights(data.weights);
          setSavedWeights(data.weights);
        }
      })
      .catch(() => {});
  }, []);

  const isDirty = JSON.stringify(weights) !== JSON.stringify(savedWeights);

  const setMainWeight = (key: keyof AlgorithmWeights, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const setEngagementWeight = (key: EngagementType, value: number) => {
    setWeights((prev) => ({
      ...prev,
      engagement_type_weights: { ...prev.engagement_type_weights, [key]: value },
    }));
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...weights,
          user_id: VIEWER_ID,
          updated_at: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data: { weights: AlgorithmWeights } = await res.json();
      setSavedWeights(data.weights ?? weights);
      setSaveStatus('saved');
      window.dispatchEvent(new Event('v1:weights-saved'));
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleReset = () => {
    setWeights(savedWeights);
  };

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#E7E9EA]">Algorithm Weights</h2>
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Saved
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="text-xs text-red-400">Save failed</span>
        )}
      </div>

      <div className="space-y-4">
        {MAIN_SLIDERS.map(({ key, label }) => {
          const value = weights[key] as number;
          return (
            <SliderRow
              key={key}
              label={label}
              value={value}
              onChange={(v) => setMainWeight(key, v)}
            />
          );
        })}
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger
          className="flex items-center gap-1.5 text-sm text-[#71767B] hover:text-[#1D9BF0] transition-colors cursor-pointer select-none w-full"
        >
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', advancedOpen && 'rotate-180')}
          />
          <span>Advanced: Engagement Weights</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4">
          {ENGAGEMENT_TYPES.map(({ key, label }) => {
            const value = weights.engagement_type_weights[key] ?? 1;
            const isNegative = key === 'not_interested';
            return (
              <SliderRow
                key={key}
                label={label}
                value={isNegative ? Math.abs(value) : value}
                min={0}
                max={isNegative ? 10 : 5}
                onChange={(v) => setEngagementWeight(key, isNegative ? -v : v)}
                negative={isNegative}
              />
            );
          })}
        </CollapsibleContent>
      </Collapsible>

      <div className="flex gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
          className="flex-1 bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white font-semibold disabled:opacity-50"
          size="sm"
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1" />
          ) : (
            <Zap className="w-4 h-4 mr-1" />
          )}
          Update Feed
        </Button>
        <Button
          onClick={handleReset}
          disabled={!isDirty}
          variant="outline"
          size="sm"
          className="border-[#2F3336] text-[#71767B] hover:text-[#E7E9EA] hover:bg-[#16181C] disabled:opacity-50"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  negative?: boolean;
}

function SliderRow({ label, value, min = 0, max = 1, onChange, negative }: SliderRowProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-[#E7E9EA]">{label}</span>
        <span className="text-[#71767B] font-mono text-xs">
          {negative ? '-' : ''}{value.toFixed(2)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={0.01}
        onValueChange={(val: number | readonly number[]) => {
          const v = Array.isArray(val) ? val[0] : val;
          if (v !== undefined) onChange(v as number);
        }}
        className="[&_[data-slot=slider-range]]:bg-[#1D9BF0] [&_[data-slot=slider-thumb]]:border-[#1D9BF0]"
      />
    </div>
  );
}

export function AlgorithmPanelPortal() {
  const [el, setEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setEl(document.getElementById('v1-algorithm-panel'));
  }, []);

  if (!el) return null;
  return createPortal(<AlgorithmPanel />, el);
}

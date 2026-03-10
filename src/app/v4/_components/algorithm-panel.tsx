'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, RotateCcw, ChevronDown, ChevronUp, Check, Sliders } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 1.0,
  popularity_weight: 1.0,
  network_weight: 1.0,
  topic_relevance_weight: 1.0,
  engagement_type_weights: {
    like: 1.0,
    reply: 1.0,
    repost: 1.0,
    click: 1.0,
    follow_author: 1.0,
    not_interested: 1.0,
  },
  updated_at: new Date().toISOString(),
};

const MAIN_SLIDERS: { key: keyof AlgorithmWeights; label: string; description: string }[] = [
  { key: 'recency_weight', label: 'Recency', description: 'Favor newer tweets' },
  { key: 'popularity_weight', label: 'Popularity', description: 'Favor high engagement' },
  { key: 'network_weight', label: 'Network', description: 'Favor people you follow' },
  { key: 'topic_relevance_weight', label: 'Topic', description: 'Favor your interests' },
];

const ENGAGEMENT_SLIDERS: { key: EngagementType; label: string }[] = [
  { key: 'like', label: 'Likes' },
  { key: 'reply', label: 'Replies' },
  { key: 'repost', label: 'Reposts' },
  { key: 'click', label: 'Clicks' },
  { key: 'follow_author', label: 'Follows' },
  { key: 'not_interested', label: 'Not Interested' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function SliderRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description?: string;
  value: number;
  onValueChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[13px] font-medium text-[#E7E9EA]">{label}</span>
          {description && (
            <p className="text-[11px] text-[#71767B]">{description}</p>
          )}
        </div>
        <span className="text-[13px] font-semibold text-[#1D9BF0] tabular-nums w-8 text-right">
          {value.toFixed(1)}
        </span>
      </div>
      <Slider
        min={0}
        max={2}
        step={0.1}
        value={[value]}
        onValueChange={(vals: number | readonly number[]) => {
          const arr = Array.isArray(vals) ? vals : [vals];
          if (arr[0] !== undefined) onValueChange(arr[0] as number);
        }}
        className="[&_.bg-primary]:bg-[#1D9BF0]"
      />
    </div>
  );
}

function PanelContent() {
  const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [savedWeights, setSavedWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [mounted, setMounted] = useState(false);

  const isDirty =
    JSON.stringify(weights) !== JSON.stringify(savedWeights);

  useEffect(() => {
    setMounted(true);
    fetch(`/api/weights?userId=${VIEWER_ID}`)
      .then((r) => r.json())
      .then((data: { weights: AlgorithmWeights }) => {
        setWeights(data.weights);
        setSavedWeights(data.weights);
      })
      .catch(() => {});
  }, []);

  const setMainWeight = useCallback(
    (key: keyof AlgorithmWeights, value: number) => {
      setWeights((w) => ({ ...w, [key]: value }));
    },
    [],
  );

  const setEngagementWeight = useCallback(
    (key: EngagementType, value: number) => {
      setWeights((w) => ({
        ...w,
        engagement_type_weights: { ...w.engagement_type_weights, [key]: value },
      }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: VIEWER_ID,
          recency_weight: weights.recency_weight,
          popularity_weight: weights.popularity_weight,
          network_weight: weights.network_weight,
          topic_relevance_weight: weights.topic_relevance_weight,
          engagement_type_weights: weights.engagement_type_weights,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setSavedWeights(data.weights);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [weights]);

  const handleReset = useCallback(() => {
    setWeights(DEFAULT_WEIGHTS);
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="size-4 text-[#1D9BF0]" />
          <h2 className="text-[15px] font-bold text-[#E7E9EA]">Algorithm Weights</h2>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-[12px] text-[#71767B] hover:text-[#E7E9EA] transition-colors"
          title="Reset to defaults"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </button>
      </div>

      <div className="space-y-4">
        {MAIN_SLIDERS.map(({ key, label, description }) => (
          <SliderRow
            key={key}
            label={label}
            description={description}
            value={weights[key] as number}
            onValueChange={(v) => setMainWeight(key, v)}
          />
        ))}
      </div>

      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-[13px] text-[#71767B] hover:text-[#E7E9EA] transition-colors border-t border-[#2F3336] pt-3">
          <span className="font-medium">Engagement Weights</span>
          {advancedOpen ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 pt-2">
            {ENGAGEMENT_SLIDERS.map(({ key, label }) => (
              <SliderRow
                key={key}
                label={label}
                value={weights.engagement_type_weights[key]}
                onValueChange={(v) => setEngagementWeight(key, v)}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="pt-2 border-t border-[#2F3336]">
        <button
          onClick={handleSave}
          disabled={!isDirty || saveStatus === 'saving'}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-[15px] font-semibold transition-all',
            isDirty && saveStatus === 'idle'
              ? 'bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] shadow-lg shadow-[#1D9BF0]/20'
              : 'bg-[#2F3336] text-[#71767B] cursor-not-allowed',
          )}
        >
          {saveStatus === 'saving' && (
            <RefreshCw className="size-4 animate-spin" />
          )}
          {saveStatus === 'saved' && (
            <Check className="size-4" />
          )}
          {saveStatus === 'saving'
            ? 'Updating feed...'
            : saveStatus === 'saved'
            ? 'Feed updated!'
            : saveStatus === 'error'
            ? 'Failed — retry?'
            : isDirty
            ? 'Update Feed'
            : 'No changes'}
        </button>

        {isDirty && saveStatus === 'idle' && (
          <p className="text-center text-[11px] text-[#71767B] mt-1.5">
            Unsaved changes will re-rank your feed
          </p>
        )}
      </div>
    </div>
  );
}

export function AlgorithmPanel() {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.getElementById('v4-algorithm-panel'));
  }, []);

  if (!portalTarget) return null;

  return createPortal(
    <div className="h-full py-4">
      <div className="rounded-2xl bg-[#16181C] border border-[#2F3336] overflow-hidden">
        <PanelContent />
      </div>
    </div>,
    portalTarget,
  );
}

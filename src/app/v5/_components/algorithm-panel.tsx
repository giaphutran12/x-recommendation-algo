'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { RotateCcw, ChevronDown, Check, Loader2 } from 'lucide-react';
import type { EngagementType } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

type MainWeightKey =
  | 'recency_weight'
  | 'popularity_weight'
  | 'network_weight'
  | 'topic_relevance_weight';

interface WeightState {
  recency_weight: number;
  popularity_weight: number;
  network_weight: number;
  topic_relevance_weight: number;
  engagement_type_weights: Record<EngagementType, number>;
}

const MAIN_SLIDERS: {
  key: MainWeightKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'recency_weight',
    label: 'Recency',
    description: 'Prefer newer tweets',
  },
  {
    key: 'popularity_weight',
    label: 'Popularity',
    description: 'Weight of likes, reposts, replies',
  },
  {
    key: 'network_weight',
    label: 'Network',
    description: 'Prefer in-network content',
  },
  {
    key: 'topic_relevance_weight',
    label: 'Topic Relevance',
    description: 'Match with your interests',
  },
];

const ENGAGEMENT_SLIDERS: { key: EngagementType; label: string }[] = [
  { key: 'like', label: 'Like' },
  { key: 'reply', label: 'Reply' },
  { key: 'repost', label: 'Repost' },
  { key: 'click', label: 'Click' },
  { key: 'follow_author', label: 'Follow Author' },
  { key: 'not_interested', label: 'Not Interested' },
];

const DEFAULT_WEIGHTS: WeightState = {
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
};

interface AlgorithmPanelProps {
  onUpdateFeed: () => void;
}

export default function AlgorithmPanel({ onUpdateFeed }: AlgorithmPanelProps) {
  const [weights, setWeights] = useState<WeightState>(DEFAULT_WEIGHTS);
  const [savedWeights, setSavedWeights] =
    useState<WeightState>(DEFAULT_WEIGHTS);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle'
  );

  const isDirty = JSON.stringify(weights) !== JSON.stringify(savedWeights);

  // Load weights from API
  useEffect(() => {
    fetch(`/api/weights?userId=${VIEWER_ID}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.weights) {
          const w: WeightState = {
            recency_weight: data.weights.recency_weight,
            popularity_weight: data.weights.popularity_weight,
            network_weight: data.weights.network_weight,
            topic_relevance_weight: data.weights.topic_relevance_weight,
            engagement_type_weights: data.weights.engagement_type_weights,
          };
          setWeights(w);
          setSavedWeights(w);
        }
      })
      .catch(() => {
        /* use defaults */
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: VIEWER_ID,
          ...weights,
          updated_at: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setSavedWeights({ ...weights });
        setSaveStatus('saved');
        onUpdateFeed();
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const updateMainWeight = (key: MainWeightKey, value: number) => {
    setWeights((prev) => ({ ...prev, [key]: value }));
  };

  const updateEngagementWeight = (key: EngagementType, value: number) => {
    setWeights((prev) => ({
      ...prev,
      engagement_type_weights: {
        ...prev.engagement_type_weights,
        [key]: value,
      },
    }));
  };

  return (
    <div className="sticky top-0 h-screen overflow-y-auto px-5 py-4 scrollbar-thin">
      {/* Title + Reset */}
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#E7E9EA]">Algorithm</h2>
        <button
          onClick={handleReset}
          className="rounded-full p-2 text-[#71767B] transition-colors hover:bg-[#E7E9EA]/10 hover:text-[#E7E9EA]"
          title="Reset to defaults"
          type="button"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* Main sliders */}
      <div className="space-y-5">
        {MAIN_SLIDERS.map(({ key, label, description }) => (
          <div key={key}>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[14px] font-medium text-[#E7E9EA]">
                {label}
              </label>
              <span className="text-[13px] tabular-nums text-[#71767B]">
                {weights[key].toFixed(1)}
              </span>
            </div>
            <Slider
              value={[weights[key]]}
              onValueChange={(v) => {
                const val = Array.isArray(v) ? v[0] : v;
                updateMainWeight(key, val);
              }}
              min={0}
              max={2}
              step={0.1}
            />
            <p className="mt-1 text-[12px] text-[#71767B]">{description}</p>
          </div>
        ))}
      </div>

      {/* Engagement weights (collapsible) */}
      <Collapsible className="mt-6">
        <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between py-2 text-[14px] font-medium text-[#E7E9EA]">
          <span>Engagement Weights</span>
          <ChevronDown className="h-4 w-4 text-[#71767B] transition-transform [[data-open]_&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 pt-2">
            {ENGAGEMENT_SLIDERS.map(({ key, label }) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[13px] text-[#E7E9EA]">{label}</label>
                  <span className="text-[12px] tabular-nums text-[#71767B]">
                    {weights.engagement_type_weights[key].toFixed(1)}
                  </span>
                </div>
                <Slider
                  value={[weights.engagement_type_weights[key]]}
                  onValueChange={(v) => {
                    const val = Array.isArray(v) ? v[0] : v;
                    updateEngagementWeight(key, val);
                  }}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions */}
      <div className="mt-6 space-y-2">
        <Button
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="w-full bg-[#1D9BF0] font-bold text-white hover:bg-[#1A8CD8] disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            'Update Feed'
          )}
        </Button>

        {saveStatus === 'saved' && (
          <div className="flex items-center justify-center gap-1.5 text-[13px] text-[#00B87A]">
            <Check className="h-3.5 w-3.5" />
            <span>Weights saved</span>
          </div>
        )}
        {saveStatus === 'error' && (
          <p className="text-center text-[13px] text-[#F4212E]">
            Failed to save
          </p>
        )}
      </div>
    </div>
  );
}

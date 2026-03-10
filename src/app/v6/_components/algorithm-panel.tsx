'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, RotateCcw, RefreshCw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database';

const VIEWER_ID = '00000000-0000-0000-0000-000000000001';

const INITIAL_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 0.3,
  popularity_weight: 0.25,
  network_weight: 0.25,
  topic_relevance_weight: 0.2,
  engagement_type_weights: {
    like: 0.1,
    reply: 0.2,
    repost: 0.15,
    click: 0.05,
    follow_author: 0.3,
    not_interested: -0.5,
  },
  updated_at: new Date().toISOString(),
};

const MAIN_SLIDERS: Array<{
  key: keyof Pick<
    AlgorithmWeights,
    'recency_weight' | 'popularity_weight' | 'network_weight' | 'topic_relevance_weight'
  >;
  label: string;
}> = [
  { key: 'recency_weight', label: 'Recency' },
  { key: 'popularity_weight', label: 'Popularity' },
  { key: 'network_weight', label: 'Network' },
  { key: 'topic_relevance_weight', label: 'Topic Relevance' },
];

const ENGAGEMENT_SLIDERS: Array<{ key: EngagementType; label: string }> = [
  { key: 'like', label: 'Like' },
  { key: 'reply', label: 'Reply' },
  { key: 'repost', label: 'Repost' },
  { key: 'click', label: 'Click' },
  { key: 'follow_author', label: 'Follow Author' },
  { key: 'not_interested', label: 'Not Interested' },
];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function PanelContent() {
  const [weights, setWeights] = useState<AlgorithmWeights>(INITIAL_WEIGHTS);
  const [savedWeights, setSavedWeights] = useState<AlgorithmWeights>(INITIAL_WEIGHTS);
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    fetch(`/api/weights?userId=${VIEWER_ID}`)
      .then((r) => r.json())
      .then((data: { weights?: AlgorithmWeights }) => {
        if (data.weights) {
          setWeights(data.weights);
          setSavedWeights(data.weights);
        }
      })
      .catch((err: unknown) => {
        console.error('[AlgorithmPanel] fetch weights:', err);
      });
  }, []);

  const setMainWeight = (
    key: keyof Pick<
      AlgorithmWeights,
      'recency_weight' | 'popularity_weight' | 'network_weight' | 'topic_relevance_weight'
    >,
    val: number
  ) => {
    setWeights((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  };

  const setEngagementWeight = (key: EngagementType, val: number) => {
    setWeights((prev) => ({
      ...prev,
      engagement_type_weights: { ...prev.engagement_type_weights, [key]: val },
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/weights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...weights, updated_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedWeights(weights);
      setDirty(false);
      setSaveStatus('saved');
      window.dispatchEvent(new Event('v6:weights-saved'));
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: unknown) {
      console.error('[AlgorithmPanel] save weights:', err);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReset = () => {
    setWeights(savedWeights);
    setDirty(false);
  };

  return (
    <div className="p-4 space-y-5" style={{ backgroundColor: '#000000' }}>
      <h2 className="text-[#E7E9EA] font-bold text-[17px]">Algorithm Weights</h2>

      <div className="space-y-4">
        {MAIN_SLIDERS.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[14px] text-[#E7E9EA]">{label}</span>
              <span className="text-[13px] text-[#71767B] font-mono">
                {(weights[key] * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={[weights[key]]}
              onValueChange={(val) => setMainWeight(key, Array.isArray(val) ? val[0] : val)}
            />
          </div>
        ))}
      </div>

      <Collapsible>
        <CollapsibleTrigger className="flex w-full items-center justify-between py-1 text-[14px] text-[#71767B] hover:text-[#E7E9EA] transition-colors">
          <span>Engagement Weights</span>
          <ChevronDown size={16} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3 space-y-4">
          {ENGAGEMENT_SLIDERS.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[14px] text-[#E7E9EA]">{label}</span>
                <span className="text-[13px] text-[#71767B] font-mono">
                  {weights.engagement_type_weights[key].toFixed(2)}
                </span>
              </div>
              <Slider
                min={-1}
                max={1}
                step={0.01}
                value={[weights.engagement_type_weights[key]]}
                onValueChange={(val) => setEngagementWeight(key, Array.isArray(val) ? val[0] : val)}
              />
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>

      {saveStatus === 'saved' && (
        <p className="text-[13px] text-[#00B87A]">Weights saved!</p>
      )}
      {saveStatus === 'error' && (
        <p className="text-[13px] text-[#F91A82]">Save failed. Please try again.</p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={!dirty || saveStatus === 'saving'}
          className="flex-1 bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] border-0 disabled:opacity-40"
          size="sm"
        >
          <RefreshCw size={14} />
          {saveStatus === 'saving' ? 'Saving…' : 'Update Feed'}
        </Button>
        <Button
          onClick={handleReset}
          disabled={!dirty}
          variant="outline"
          size="sm"
          className="border-[#2F3336] text-[#E7E9EA] hover:bg-[#16181C] disabled:opacity-40"
        >
          <RotateCcw size={14} />
          Reset
        </Button>
      </div>
    </div>
  );
}

export function AlgorithmPanel() {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalEl(document.getElementById('v6-algorithm-panel'));
  }, []);

  if (!portalEl) return null;

  return createPortal(<PanelContent />, portalEl);
}

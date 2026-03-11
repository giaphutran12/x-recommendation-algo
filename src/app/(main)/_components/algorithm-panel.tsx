'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, ChevronUp, RefreshCw, Check } from 'lucide-react'

import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AlgorithmWeights, EngagementType } from '@/lib/types/database'
import { VIEWER_ID } from '@/lib/constants'
import { useFeedContext } from '@/lib/contexts/feed-context'

type MainWeightKey =
  | 'recency_weight'
  | 'popularity_weight'
  | 'network_weight'
  | 'topic_relevance_weight'

const MAIN_SLIDERS: { key: MainWeightKey; label: string; sliderClass: string }[] = [
  { key: 'recency_weight', label: 'Recency', sliderClass: '[&_[data-slot=slider-range]]:bg-[var(--chart-1)] [&_[data-slot=slider-thumb]]:border-[var(--chart-1)]' },
  { key: 'popularity_weight', label: 'Popularity', sliderClass: '[&_[data-slot=slider-range]]:bg-[var(--chart-2)] [&_[data-slot=slider-thumb]]:border-[var(--chart-2)]' },
  { key: 'network_weight', label: 'Network', sliderClass: '[&_[data-slot=slider-range]]:bg-[var(--chart-3)] [&_[data-slot=slider-thumb]]:border-[var(--chart-3)]' },
  { key: 'topic_relevance_weight', label: 'Topic Relevance', sliderClass: '[&_[data-slot=slider-range]]:bg-[var(--chart-4)] [&_[data-slot=slider-thumb]]:border-[var(--chart-4)]' },
]

const ENGAGEMENT_SLIDERS: { key: EngagementType; label: string; sliderClass: string }[] = [
  { key: 'like', label: 'Like', sliderClass: '[&_[data-slot=slider-range]]:bg-pink-500 [&_[data-slot=slider-thumb]]:border-pink-500' },
  { key: 'reply', label: 'Reply', sliderClass: '[&_[data-slot=slider-range]]:bg-blue-500 [&_[data-slot=slider-thumb]]:border-blue-500' },
  { key: 'repost', label: 'Repost', sliderClass: '[&_[data-slot=slider-range]]:bg-emerald-500 [&_[data-slot=slider-thumb]]:border-emerald-500' },
  { key: 'click', label: 'Click', sliderClass: '[&_[data-slot=slider-range]]:bg-cyan-500 [&_[data-slot=slider-thumb]]:border-cyan-500' },
  { key: 'follow_author', label: 'Follow Author', sliderClass: '[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-500' },
  { key: 'not_interested', label: 'Not Interested', sliderClass: '[&_[data-slot=slider-range]]:bg-red-500 [&_[data-slot=slider-thumb]]:border-red-500' },
]

const DEFAULT_WEIGHTS: AlgorithmWeights = {
  user_id: VIEWER_ID,
  recency_weight: 0.3,
  popularity_weight: 0.25,
  network_weight: 0.25,
  topic_relevance_weight: 0.2,
  engagement_type_weights: {
    like: 1.0,
    reply: 3.0,
    repost: 2.0,
    click: 0.5,
    follow_author: 5.0,
    not_interested: -3.0,
  },
  oon_penalty: 0.7,
  diversity_decay: 0.5,
  updated_at: new Date().toISOString(),
}

function weightsAreDirty(current: AlgorithmWeights, saved: AlgorithmWeights): boolean {
  if (
    current.recency_weight !== saved.recency_weight ||
    current.popularity_weight !== saved.popularity_weight ||
    current.network_weight !== saved.network_weight ||
    current.topic_relevance_weight !== saved.topic_relevance_weight
  ) {
    return true
  }
  if (
    (current.oon_penalty ?? 0.7) !== (saved.oon_penalty ?? 0.7) ||
    (current.diversity_decay ?? 0.5) !== (saved.diversity_decay ?? 0.5)
  ) {
    return true
  }
  for (const key of Object.keys(current.engagement_type_weights) as EngagementType[]) {
    if (current.engagement_type_weights[key] !== saved.engagement_type_weights[key]) {
      return true
    }
  }
  return false
}

function AlgorithmPanel() {
   const { notifyFeedRefresh } = useFeedContext()
   const [weights, setWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS)
   const [savedWeights, setSavedWeights] = useState<AlgorithmWeights>(DEFAULT_WEIGHTS)
   const [loading, setLoading] = useState(true)
   const [saving, setSaving] = useState(false)
   const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
   const [advancedOpen, setAdvancedOpen] = useState(false)
   const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

   useEffect(() => {
     const fetchWeights = async () => {
       try {
         const res = await fetch(`/api/weights?userId=${VIEWER_ID}`)
         if (res.ok) {
           const data = (await res.json()) as { weights: AlgorithmWeights }
           setWeights(data.weights)
           setSavedWeights(data.weights)
         }
       } catch (err) {
         console.error('[WEIGHTS] GET failed:', err)
       } finally {
         setLoading(false)
       }
     }
     fetchWeights()
   }, [])

   useEffect(() => {
     return () => {
       if (timerRef.current) clearTimeout(timerRef.current)
     }
   }, [])

  const handleMainSlider = useCallback(
    (key: MainWeightKey) =>
      (val: number | readonly number[]) => {
        const v = Array.isArray(val) ? val[0] : val
        setWeights((prev) => ({ ...prev, [key]: v }))
      },
    [],
  )

  const handleEngagementSlider = useCallback(
    (key: EngagementType) =>
      (val: number | readonly number[]) => {
        const v = Array.isArray(val) ? val[0] : val
        setWeights((prev) => ({
          ...prev,
          engagement_type_weights: {
            ...prev.engagement_type_weights,
            [key]: v,
          },
        }))
      },
    [],
  )

  const handleSave = async () => {
    setSaving(true)
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
          oon_penalty: weights.oon_penalty,
          diversity_decay: weights.diversity_decay,
          updated_at: new Date().toISOString(),
        }),
      })
       if (!res.ok) {
         const body = await res.json().catch(() => null)
         console.error('[WEIGHTS] PUT failed:', res.status, body?.error)
         setSaveStatus('error')
         if (timerRef.current) clearTimeout(timerRef.current)
         timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
         return
       }
       const saved: AlgorithmWeights = { ...weights, updated_at: new Date().toISOString() }
       setSavedWeights(saved)
       setWeights(saved)
       setSaveStatus('saved')
       notifyFeedRefresh()
       if (timerRef.current) clearTimeout(timerRef.current)
       timerRef.current = setTimeout(() => setSaveStatus('idle'), 2000)
     } catch (err) {
       console.error('[WEIGHTS] PUT exception:', err)
       setSaveStatus('error')
       if (timerRef.current) clearTimeout(timerRef.current)
       timerRef.current = setTimeout(() => setSaveStatus('idle'), 3000)
     } finally {
       setSaving(false)
     }
  }

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS)
  }

  const dirty = weightsAreDirty(weights, savedWeights)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card text-foreground">
      <div className="flex shrink-0 items-center justify-between mx-4 px-8 py-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">
          Algorithm Weights
        </h2>
        {loading && (
          <Spinner className={cn('size-3.5 text-muted-foreground')} />
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-8 mx-4 px-8 py-6">
        {MAIN_SLIDERS.map(({ key, label, sliderClass }) => (
          <div key={key} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {label}
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {weights[key].toFixed(2)}
              </span>
            </div>
            <Slider
              value={[weights[key]]}
              min={0}
              max={1}
              step={0.01}
              onValueChange={handleMainSlider(key)}
              aria-label={label}
              className={cn(
                '[&_[data-slot=slider-track]]:bg-muted',
                sliderClass,
              )}
            />
          </div>
        ))}

        <Separator className="bg-border" />

        <div className="space-y-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Penalties
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                OON Penalty
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {(weights.oon_penalty ?? 0.7).toFixed(2)}
              </span>
            </div>
             <Slider
               value={[weights.oon_penalty ?? 0.7]}
               min={0}
               max={1}
               step={0.01}
               onValueChange={(val: number | readonly number[]) => {
                 const v = Array.isArray(val) ? val[0] : val
                 setWeights((prev) => ({ ...prev, oon_penalty: v }))
               }}
               aria-label="OON Penalty"
               className={cn(
                 '[&_[data-slot=slider-track]]:bg-muted',
                 '[&_[data-slot=slider-range]]:bg-rose-500',
                 '[&_[data-slot=slider-thumb]]:border-rose-500',
               )}
             />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Diversity Decay
              </span>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {(weights.diversity_decay ?? 0.5).toFixed(2)}
              </span>
            </div>
             <Slider
               value={[weights.diversity_decay ?? 0.5]}
               min={0}
               max={1}
               step={0.01}
               onValueChange={(val: number | readonly number[]) => {
                 const v = Array.isArray(val) ? val[0] : val
                 setWeights((prev) => ({ ...prev, diversity_decay: v }))
               }}
               aria-label="Diversity Decay"
               className={cn(
                 '[&_[data-slot=slider-track]]:bg-muted',
                 '[&_[data-slot=slider-range]]:bg-teal-500',
                 '[&_[data-slot=slider-thumb]]:border-teal-500',
               )}
             />
          </div>
        </div>

        <Separator className="bg-border" />

        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between rounded py-1 text-sm font-medium text-muted-foreground transition-opacity hover:opacity-70">
            <span>Advanced</span>
            {advancedOpen ? (
              <ChevronUp className="size-3.5 shrink-0" />
            ) : (
              <ChevronDown className="size-3.5 shrink-0" />
            )}
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-5 pt-4">
            <p className="text-xs leading-tight text-muted-foreground">
              Engagement signal weights shape how interactions influence your feed ranking.
            </p>
            {ENGAGEMENT_SLIDERS.map(({ key, label, sliderClass }) => (
              <div key={key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">
                    {label}
                  </span>
                  <span className="font-mono text-sm tabular-nums text-muted-foreground">
                    {weights.engagement_type_weights[key].toFixed(2)}
                  </span>
                </div>
                <Slider
                  value={[weights.engagement_type_weights[key]]}
                  min={-5}
                  max={10}
                  step={0.1}
                  onValueChange={handleEngagementSlider(key)}
                  aria-label={label}
                  className={cn(
                    '[&_[data-slot=slider-track]]:bg-muted',
                    sliderClass,
                  )}
                />
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {(dirty || saveStatus === 'saved' || saveStatus === 'error') && (
        <div className="flex shrink-0 items-center gap-2 mx-4 px-8 py-4 border-t border-border">
          {saveStatus === 'error' ? (
            <div className="flex flex-1 items-center gap-1.5 text-xs font-medium text-destructive">
              Save failed — check console
            </div>
          ) : saveStatus === 'saved' ? (
            <div className="flex flex-1 items-center gap-1.5 text-xs font-medium text-primary">
              <Check className="size-3.5 shrink-0" />
              Saved!
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                disabled={saving}
                className="gap-1.5 text-xs text-muted-foreground"
              >
                <RefreshCw className="size-3 shrink-0" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="ml-auto gap-1.5 text-xs font-semibold bg-primary text-primary-foreground border-none"
              >
                {saving && <Spinner className="size-3 shrink-0" />}
                Update Feed
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function AlgorithmPanelPortal() {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setPortalEl(document.getElementById('v7-algorithm-panel'))
  }, [])

  if (!portalEl) return null

  return createPortal(<AlgorithmPanel />, portalEl)
}

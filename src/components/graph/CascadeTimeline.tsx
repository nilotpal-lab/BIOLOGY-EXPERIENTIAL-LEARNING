import { useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { Button, IconButton, cn } from '../ui/primitives'
import type { ScenarioResult } from '../../core/types'

/* ============================================================================
 * CascadeTimeline — interactive round-by-round visual timeline controls.
 *
 * Provides:
 * 1. Step-by-step navigation: [⏮ Baseline] [◀ Prev] [Play/Pause ⏯] [Next ▶]
 * 2. Visual scrubber slider from Step 0 (Baseline) to Step N (Final cascade)
 * 3. Clickable round pills / chips showing count of species collapsed per round
 * 4. Rich explanatory callout of what changed in the selected round
 * ========================================================================== */

export interface CascadeTimelineProps {
  result: ScenarioResult
  step: number
  onStepChange: (step: number) => void
  isPlaying: boolean
  onTogglePlay: () => void
}

export function CascadeTimeline({
  result,
  step,
  onStepChange,
  isPlaying,
  onTogglePlay,
}: CascadeTimelineProps) {
  const rounds = result.rounds
  // Steps:
  // 0: Baseline (pristine)
  // 1: Initial removal (primary node)
  // 2 .. (rounds.length + 1): Cascade Round 1, Round 2...
  const maxStep = 1 + rounds.length

  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = window.setInterval(() => {
      onStepChange(step >= maxStep ? 0 : step + 1)
    }, 1600)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, step, maxStep, onStepChange])

  // Get current step details
  const getStepDetails = () => {
    if (step === 0) {
      return {
        title: 'Baseline network',
        subtitle: 'All organisms and recorded feeding links are intact.',
        count: 0,
        species: [],
      }
    }
    if (step === 1) {
      return {
        title: `Direct removal: ${result.primaryNodeLabel}`,
        subtitle: `Initial organism targeted. Severed ${result.directlyRemovedLinks.length} direct feeding link(s).`,
        count: 1,
        species: [result.primaryNodeLabel],
      }
    }
    const roundIdx = step - 2
    const round = rounds[roundIdx]
    if (!round) {
      return {
        title: 'Cascade complete',
        subtitle: `Network stabilized after ${rounds.length} cascade round(s).`,
        count: 0,
        species: [],
      }
    }
    return {
      title: `Cascade Round ${round.round}`,
      subtitle: `${round.removals.length} consumer(s) collapsed because all their recorded food sources were lost.`,
      count: round.removals.length,
      species: round.removals.map((r) => r.label),
    }
  }

  const currentDetails = getStepDetails()

  return (
    <div className="mt-3 rounded-2xl border border-line-soft bg-surface-2 p-3 sm:p-4 shadow-2xs space-y-3">
      {/* Top Header: Title, Step badge & Playback Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Layers size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-fg">
                Cascade Round Playback
              </h4>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-primary border border-line">
                Step {step} of {maxStep}
              </span>
            </div>
            <p className="text-[11.5px] text-fg-muted">
              Step through the multi-round extinction chain reaction sequentially
            </p>
          </div>
        </div>

        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <IconButton
            label="Jump to baseline"
            icon={<RotateCcw size={14} />}
            onClick={() => onStepChange(0)}
            disabled={step === 0}
          />
          <IconButton
            label="Previous round"
            icon={<ChevronLeft size={16} />}
            onClick={() => onStepChange(Math.max(0, step - 1))}
            disabled={step === 0}
          />
          <Button
            size="sm"
            variant={isPlaying ? 'secondary' : 'primary'}
            icon={isPlaying ? <Pause size={14} /> : <Play size={14} />}
            onClick={onTogglePlay}
            className="h-8 px-3 text-[12px] font-medium"
          >
            {isPlaying ? 'Pause' : 'Auto-play'}
          </Button>
          <IconButton
            label="Next round"
            icon={<ChevronRight size={16} />}
            onClick={() => onStepChange(Math.min(maxStep, step + 1))}
            disabled={step === maxStep}
          />
        </div>
      </div>

      {/* Scrubber slider bar */}
      <div className="space-y-1">
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={maxStep}
            value={step}
            onChange={(e) => onStepChange(Number(e.target.value))}
            className="w-full h-1.5 bg-line-strong rounded-lg appearance-none cursor-pointer accent-[#0F6B52]"
            aria-label="Cascade timeline scrubber"
          />
        </div>
        <div className="flex justify-between text-[10px] font-medium text-fg-faint px-0.5">
          <span>0 · Baseline</span>
          <span>1 · Direct removal</span>
          {rounds.map((r, i) => (
            <span key={r.round}>{i + 2} · Round {r.round}</span>
          ))}
        </div>
      </div>

      {/* Clickable Round Pills */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onStepChange(0)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border',
            step === 0
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-surface text-fg-muted border-line hover:border-line-strong hover:bg-surface-2',
          )}
        >
          <span>Baseline</span>
        </button>

        <button
          type="button"
          onClick={() => onStepChange(1)}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border',
            step === 1
              ? 'bg-[#B33D46] text-white border-[#B33D46] shadow-xs'
              : 'bg-surface text-fg-muted border-line hover:border-line-strong hover:bg-surface-2',
          )}
        >
          <Zap size={11} />
          <span>Direct: {result.primaryNodeLabel}</span>
        </button>

        {rounds.map((round, idx) => {
          const pillStep = idx + 2
          const isActive = step === pillStep
          return (
            <button
              key={round.round}
              type="button"
              onClick={() => onStepChange(pillStep)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors border',
                isActive
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-surface text-fg-muted border-line hover:border-line-strong hover:bg-surface-2',
              )}
            >
              <span>Round {round.round}</span>
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[9.5px] font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-line-soft text-fg-faint',
                )}
              >
                -{round.removals.length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Active Step Summary Callout */}
      <div className="rounded-xl border border-line bg-surface p-2.5 text-[12px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-primary shrink-0" />
            <p className="font-bold text-fg truncate">{currentDetails.title}</p>
          </div>
          <p className="text-fg-muted text-[11.5px] mt-0.5">{currentDetails.subtitle}</p>
        </div>

        {currentDetails.species.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 shrink-0">
            <span className="text-[10.5px] font-semibold text-fg-faint mr-1">Collapsed:</span>
            {currentDetails.species.map((sp) => (
              <span
                key={sp}
                className="inline-flex items-center rounded-md bg-danger-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-danger border border-danger/20"
              >
                {sp}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

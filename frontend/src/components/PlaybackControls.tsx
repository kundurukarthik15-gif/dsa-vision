import { memo, useEffect } from 'react';
import { usePlaybackStore } from '../store/playbackStore';

const SPEED_OPTIONS = [
  { label: '0.5x', value: 3000 },
  { label: '1x', value: 1500 },
  { label: '1.5x', value: 1000 },
  { label: '2x', value: 750 },
];

const PlaybackControls = () => {
  const trace = usePlaybackStore((state) => state.trace);
  const currentStep = usePlaybackStore((state) => state.currentStep);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const speedMs = usePlaybackStore((state) => state.speedMs);

  const nextStep = usePlaybackStore((state) => state.nextStep);
  const prevStep = usePlaybackStore((state) => state.prevStep);
  const reset = usePlaybackStore((state) => state.reset);
  const play = usePlaybackStore((state) => state.play);
  const pause = usePlaybackStore((state) => state.pause);
  const setSpeed = usePlaybackStore((state) => state.setSpeed);

  const hasTrace = Boolean(trace && trace.steps.length > 0);
  const totalSteps = trace ? (trace.totalSteps ?? trace.steps.length) : 0;
  const isAtStart = !hasTrace || currentStep === 0;
  const isAtEnd = !hasTrace || currentStep >= totalSteps - 1;

  // Step indicator numbers: 1-indexed for display (or 0 / 0 when no trace)
  const currentDisplay = hasTrace ? currentStep + 1 : 0;
  const totalDisplay = totalSteps;

  // Automatic playback timer effect
  useEffect(() => {
    if (!isPlaying || !trace || trace.steps.length === 0) {
      return;
    }

    const maxIndex = trace.steps.length - 1;

    // Immediately stop if already at or beyond the final step
    if (currentStep >= maxIndex) {
      pause();
      return;
    }

    const intervalId = window.setInterval(() => {
      const state = usePlaybackStore.getState();
      const currentMax = (state.trace?.steps.length ?? 0) - 1;

      if (state.currentStep >= currentMax) {
        state.pause();
      } else {
        state.nextStep();
        if (state.currentStep + 1 >= currentMax) {
          state.pause();
        }
      }
    }, speedMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlaying, speedMs, trace, currentStep, pause, nextStep]);

  const buttonStyle: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: 6,
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease',
  };

  const disabledButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.45,
    cursor: 'not-allowed',
    backgroundColor: '#f3f4f6',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 16px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        fontFamily: 'sans-serif',
        boxSizing: 'border-box',
        width: '100%',
      }}
      role="toolbar"
      aria-label="Visualization Playback Controls"
    >
      {/* 1-5: Playback Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          type="button"
          onClick={reset}
          disabled={!hasTrace || isAtStart}
          style={!hasTrace || isAtStart ? disabledButtonStyle : buttonStyle}
          title="Return to the first step"
          aria-label="Reset"
        >
          Reset
        </button>

        <button
          type="button"
          onClick={prevStep}
          disabled={!hasTrace || isAtStart}
          style={!hasTrace || isAtStart ? disabledButtonStyle : buttonStyle}
          title="Move one step backward"
          aria-label="Previous"
        >
          Previous
        </button>

        <button
          type="button"
          onClick={play}
          disabled={!hasTrace || isPlaying || isAtEnd}
          style={
            !hasTrace || isPlaying || isAtEnd
              ? disabledButtonStyle
              : {
                  ...buttonStyle,
                  backgroundColor: '#2563eb',
                  borderColor: '#1d4ed8',
                  color: '#ffffff',
                }
          }
          title="Start automatic playback"
          aria-label="Play"
        >
          Play
        </button>

        <button
          type="button"
          onClick={pause}
          disabled={!hasTrace || !isPlaying}
          style={
            !hasTrace || !isPlaying
              ? disabledButtonStyle
              : {
                  ...buttonStyle,
                  backgroundColor: '#ea580c',
                  borderColor: '#c2410c',
                  color: '#ffffff',
                }
          }
          title="Pause automatic playback"
          aria-label="Pause"
        >
          Pause
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!hasTrace || isAtEnd}
          style={!hasTrace || isAtEnd ? disabledButtonStyle : buttonStyle}
          title="Move one step forward"
          aria-label="Next"
        >
          Next
        </button>
      </div>

      {/* 6 & 7: Speed Selector and Step Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 6. Speed selector */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '13px',
            color: '#4b5563',
            fontWeight: 500,
          }}
        >
          Speed:
          <select
            value={speedMs}
            onChange={(e) => setSpeed(Number(e.target.value))}
            disabled={!hasTrace}
            style={{
              padding: '4px 8px',
              fontSize: '13px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              backgroundColor: hasTrace ? '#ffffff' : '#f3f4f6',
              color: '#374151',
              cursor: hasTrace ? 'pointer' : 'not-allowed',
            }}
            aria-label="Playback speed selector"
          >
            {SPEED_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        {/* 7. Step indicator */}
        <div
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#1f2937',
            padding: '4px 10px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            minWidth: 84,
            textAlign: 'center',
          }}
          aria-live="polite"
          aria-label={`Step ${currentDisplay} of ${totalDisplay}`}
        >
          Step {currentDisplay} / {totalDisplay}
        </div>
      </div>
    </div>
  );
};

export default memo(PlaybackControls);

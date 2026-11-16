import { memo } from 'react';
import { usePlaybackStore } from '../store/playbackStore';

const MONO_FONT = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

const StepScrubber = () => {
  const trace = usePlaybackStore((state) => state.trace);
  const currentStep = usePlaybackStore((state) => state.currentStep);
  const isPlaying = usePlaybackStore((state) => state.isPlaying);
  const goToStep = usePlaybackStore((state) => state.goToStep);
  const pause = usePlaybackStore((state) => state.pause);

  const total = trace?.steps.length ?? 0;
  const maxStep = Math.max(0, total - 1);
  const safeValue = total === 0 ? 0 : Math.min(currentStep, maxStep);

  const currentDisplay = total > 0 ? currentStep + 1 : 0;
  const totalDisplay = total;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isPlaying) {
      pause();
    }
    goToStep(Number(e.target.value));
  };

  const handleTickClick = (stepIndex: number) => {
    if (isPlaying) {
      pause();
    }
    goToStep(stepIndex);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxSizing: 'border-box',
        width: '100%',
      }}
      aria-label="Step scrubber timeline"
    >
      {/* Header with Title and Step Counter */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#2563eb',
            }}
            aria-hidden="true"
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#4b5563',
            }}
          >
            Step Scrubber
          </span>
        </div>

        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: MONO_FONT,
            color: '#1f2937',
            padding: '2px 8px',
            borderRadius: 4,
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
          }}
        >
          Step {currentDisplay} / {totalDisplay}
        </span>
      </div>

      {/* Slider Track Container */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 0',
        }}
      >
        <input
          type="range"
          min={0}
          max={maxStep}
          step={1}
          value={safeValue}
          disabled={total <= 1}
          onChange={handleSliderChange}
          style={{
            width: '100%',
            height: '6px',
            accentColor: '#2563eb',
            cursor: total <= 1 ? 'not-allowed' : 'pointer',
            margin: 0,
          }}
          aria-label="Scrub through visualization steps"
          aria-valuemin={0}
          aria-valuemax={maxStep}
          aria-valuenow={safeValue}
        />
      </div>

      {/* Proportional Tick Marks */}
      {total > 1 && (
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '14px',
            userSelect: 'none',
          }}
        >
          {Array.from({ length: total }, (_, i) => {
            const leftPercent = (i / (total - 1)) * 100;
            const isActive = i === currentStep;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleTickClick(i)}
                title={`Jump to Step ${i + 1}`}
                aria-label={`Jump to Step ${i + 1}`}
                style={{
                  position: 'absolute',
                  left: `${leftPercent}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: isActive ? '12px' : '6px',
                  height: isActive ? '12px' : '6px',
                  borderRadius: '50%',
                  backgroundColor: isActive ? '#ea580c' : '#cbd5e1',
                  border: isActive ? '2px solid #ffffff' : 'none',
                  boxShadow: isActive ? '0 0 0 1.5px #ea580c' : 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  zIndex: isActive ? 2 : 1,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(StepScrubber);

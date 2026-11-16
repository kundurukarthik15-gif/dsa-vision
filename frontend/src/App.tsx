import { useState, useEffect, useCallback } from 'react';
import { usePlaybackStore, useCurrentStep } from './store/playbackStore';
import VisualizationCanvas from './components/VisualizationCanvas';
import SourceCodePanel from './components/SourceCodePanel';
import PlaybackControls from './components/PlaybackControls';
import StepScrubber from './components/StepScrubber';
import VariableWatchPanel from './components/VariableWatchPanel';
import { registryEntries, getTrace } from './generators/registry';
import { generateLinearSearchTrace } from './generators/linearSearchTrace';

// ---------------------------------------------------------------------------
// Input parsing helpers for Linear Search
// ---------------------------------------------------------------------------

function parseArrayInput(raw: string): { values: number[] } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { error: 'Array cannot be empty. Enter at least one integer, e.g. 5, 2, 9, 1' };
  }

  const parts = trimmed.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part === '') {
      return { error: 'Array contains an empty entry. Remove trailing commas or extra spaces.' };
    }
    if (!/^-?\d+$/.test(part)) {
      return {
        error: `"${part}" is not a valid integer. Use comma-separated whole numbers only, e.g. 5, 2, 9, 1`,
      };
    }
  }

  return { values: parts.map(Number) };
}

function parseTargetInput(raw: string): { value: number } | { error: string } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { error: 'Target cannot be empty. Enter a whole number.' };
  }
  if (!/^-?\d+$/.test(trimmed)) {
    return { error: `"${trimmed}" is not a valid integer. Enter a single whole number.` };
  }
  return { value: Number(trimmed) };
}

// ---------------------------------------------------------------------------
// Default linear search inputs
// ---------------------------------------------------------------------------

const DEFAULT_ARRAY = '5, 2, 9, 1';
const DEFAULT_TARGET = '9';

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------

function App() {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('linear-search');
  const [loadError, setLoadError] = useState<string | null>(null);

  // Linear search form state
  const [arrayInput, setArrayInput] = useState(DEFAULT_ARRAY);
  const [targetInput, setTargetInput] = useState(DEFAULT_TARGET);
  const [arrayError, setArrayError] = useState('');
  const [targetError, setTargetError] = useState('');

  const setTrace = usePlaybackStore((state) => state.setTrace);
  const trace = usePlaybackStore((state) => state.trace);
  const currentStepData = useCurrentStep();

  // ── Load a generated linear search trace ──────────────────────────────────

  const generateAndLoad = useCallback(
    (rawArray: string, rawTarget: string): boolean => {
      const arrResult = parseArrayInput(rawArray);
      const tgtResult = parseTargetInput(rawTarget);

      let valid = true;

      if ('error' in arrResult) {
        setArrayError(arrResult.error);
        valid = false;
      } else {
        setArrayError('');
      }

      if ('error' in tgtResult) {
        setTargetError(tgtResult.error);
        valid = false;
      } else {
        setTargetError('');
      }

      if (!valid) return false;

      try {
        const generated = generateLinearSearchTrace({
          array: (arrResult as { values: number[] }).values,
          target: (tgtResult as { value: number }).value,
        });
        setTrace(generated);
        setLoadError(null);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        return false;
      }
    },
    [setTrace]
  );

  // ── Single effect for initial loading and algorithm changes ───────────────
  useEffect(() => {
    if (selectedAlgorithm === 'linear-search') {
      const succeeded = generateAndLoad(arrayInput, targetInput);
      if (!succeeded) {
        // Fall back to default trace from registry on invalid input without clearing input errors
        try {
          const fallback = getTrace('linear-search');
          setTrace(fallback);
          setLoadError(null);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setLoadError(msg);
        }
      }
    } else {
      setArrayError('');
      setTargetError('');
      try {
        const loadedTrace = getTrace(selectedAlgorithm);
        setTrace(loadedTrace);
        setLoadError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
      }
    }
  }, [selectedAlgorithm, generateAndLoad, setTrace]);

  // ── Generate button handler ───────────────────────────────────────────────

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    generateAndLoad(arrayInput, targetInput);
  }

  // ── Shared style tokens ───────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    padding: '7px 10px',
    fontSize: '14px',
    borderRadius: 6,
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    fontFamily: 'inherit',
    minWidth: 0,
    flex: 1,
  };

  const inputErrorStyle: React.CSSProperties = {
    ...inputStyle,
    borderColor: '#ef4444',
    outlineColor: '#ef4444',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
    display: 'block',
  };

  const errorMsgStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#dc2626',
    marginTop: 4,
  };

  const isLinearSearchActive = selectedAlgorithm === 'linear-search';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 20px',
        boxSizing: 'border-box',
        gap: 20,
        textAlign: 'left',
      }}
    >
      {/* ── Header and Algorithm Picker ───────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--border, #e5e7eb)',
          paddingBottom: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              margin: '0 0 6px',
              color: 'var(--text-h, #111827)',
            }}
          >
            DSA Vision
          </h1>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text, #6b7280)',
              margin: 0,
            }}
          >
            Interactive Visual Execution Protocol (VEP) Player
          </p>
        </div>

        {/* Algorithm Picker using Registry Entries */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label
            htmlFor="algorithm-select"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-h, #374151)',
            }}
          >
            Algorithm:
          </label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              color: '#1f2937',
              cursor: 'pointer',
              fontWeight: 500,
            }}
            aria-label="Select visualization algorithm"
          >
            {registryEntries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* ── Visible Error Banner ────────────────────────────────────────── */}
      {loadError && (
        <div
          role="alert"
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            backgroundColor: '#fef2f2',
            border: '1px solid #f87171',
            color: '#991b1b',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span>
            <strong>Error:</strong> {loadError}
          </span>
          <button
            type="button"
            onClick={() => setLoadError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#991b1b',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Linear Search Custom Input Form ─────────────────────────────── */}
      {isLinearSearchActive && (
        <form
          onSubmit={handleGenerate}
          noValidate
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            gap: 16,
            padding: '14px 16px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
          }}
          aria-label="Linear search input form"
        >
          {/* Array field */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: '2 1 220px', minWidth: 0 }}>
            <label htmlFor="array-input" style={labelStyle}>
              Array{' '}
              <span style={{ fontWeight: 400, color: '#6b7280' }}>(comma-separated integers)</span>
            </label>
            <input
              id="array-input"
              type="text"
              value={arrayInput}
              onChange={(e) => {
                setArrayInput(e.target.value);
                if (arrayError) setArrayError('');
              }}
              placeholder="e.g. 5, 2, 9, 1"
              style={arrayError ? inputErrorStyle : inputStyle}
              aria-describedby={arrayError ? 'array-error' : undefined}
              aria-invalid={Boolean(arrayError)}
              autoComplete="off"
              spellCheck={false}
            />
            {arrayError && (
              <span id="array-error" role="alert" style={errorMsgStyle}>
                {arrayError}
              </span>
            )}
          </div>

          {/* Target field */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 110px', minWidth: 0 }}>
            <label htmlFor="target-input" style={labelStyle}>
              Target{' '}
              <span style={{ fontWeight: 400, color: '#6b7280' }}>(integer)</span>
            </label>
            <input
              id="target-input"
              type="text"
              value={targetInput}
              onChange={(e) => {
                setTargetInput(e.target.value);
                if (targetError) setTargetError('');
              }}
              placeholder="e.g. 9"
              style={targetError ? inputErrorStyle : inputStyle}
              aria-describedby={targetError ? 'target-error' : undefined}
              aria-invalid={Boolean(targetError)}
              autoComplete="off"
              spellCheck={false}
            />
            {targetError && (
              <span id="target-error" role="alert" style={errorMsgStyle}>
                {targetError}
              </span>
            )}
          </div>

          {/* Generate button */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              style={{
                padding: '7px 18px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 6,
                border: '1px solid #2563eb',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                lineHeight: '22px',
              }}
            >
              Generate Visualization
            </button>
          </div>
        </form>
      )}

      {/* ── Visualization Title and Description ────────────────────────── */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            margin: 0,
            color: 'var(--text-h, #1f2937)',
          }}
        >
          {trace?.title ?? 'Algorithm Visualization'}
        </h2>
        {trace?.description && (
          <p style={{ fontSize: '14px', color: 'var(--text, #4b5563)', margin: 0 }}>
            {trace.description}
          </p>
        )}
      </section>

      {/* ── Teaching UI Layout ─────────────────────────────────────────── */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          width: '100%',
        }}
      >
        {/* Split Layout: Visualization Canvas on Left, Source Code Tracking on Right */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
            gap: 16,
            width: '100%',
          }}
        >
          <VisualizationCanvas />
          <SourceCodePanel />
        </div>

        {/* Playback Controls & Timeline Scrubber */}
        <PlaybackControls />
        <StepScrubber />

        {/* Variables Watch Panel & Step Explanation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
            gap: 16,
            width: '100%',
            alignItems: 'start',
          }}
        >
          <VariableWatchPanel />

          {/* Current Step Explanation & Concept Tag */}
          {currentStepData ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                backgroundColor: '#f3f4f6',
                border: '1px solid #e5e7eb',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                minHeight: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#4b5563',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Step Explanation
                  </span>
                  {currentStepData.conceptTag && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 8px',
                        borderRadius: 9999,
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                        textTransform: 'capitalize',
                      }}
                    >
                      {currentStepData.conceptTag}
                    </span>
                  )}
                </div>

                {currentStepData.sourceLine && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#6b7280',
                    }}
                  >
                    Line {currentStepData.sourceLine}
                  </span>
                )}
              </div>
              <p
                style={{
                  fontSize: '14px',
                  color: '#1f2937',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {currentStepData.explanation}
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '16px',
                borderRadius: 8,
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                color: '#6b7280',
                fontStyle: 'italic',
                fontSize: '13px',
              }}
            >
              No active step
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

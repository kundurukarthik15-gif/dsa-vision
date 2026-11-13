import { useState, useEffect } from 'react';
import { usePlaybackStore, useCurrentStep } from './store/playbackStore';
import VisualizationCanvas from './components/VisualizationCanvas';
import PlaybackControls from './components/PlaybackControls';
import arrayLinearSearch from './fixtures/array-linear-search.json';
import linkedListTraversal from './fixtures/linked-list-traversal.json';
import { validateTrace } from './types/vep';

const FIXTURES = {
  'array-linear-search': {
    id: 'array-linear-search',
    name: 'Array Linear Search',
    trace: validateTrace(arrayLinearSearch),
  },
  'linked-list-traversal': {
    id: 'linked-list-traversal',
    name: 'Linked List Traversal',
    trace: validateTrace(linkedListTraversal),
  },
};

type FixtureKey = keyof typeof FIXTURES;

function App() {
  const [selectedFixture, setSelectedFixture] = useState<FixtureKey>('array-linear-search');
  const setTrace = usePlaybackStore((state) => state.setTrace);
  const trace = usePlaybackStore((state) => state.trace);
  const currentStepData = useCurrentStep();

  // Load the initial fixture on mount, and reload when the selected fixture changes
  useEffect(() => {
    setTrace(FIXTURES[selectedFixture].trace);
  }, [selectedFixture, setTrace]);

  const activeFixture = FIXTURES[selectedFixture];

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
      {/* Header and Fixture Selector */}
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

        {/* Fixture Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label
            htmlFor="fixture-select"
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'var(--text-h, #374151)',
            }}
          >
            Select Visualization:
          </label>
          <select
            id="fixture-select"
            value={selectedFixture}
            onChange={(e) => setSelectedFixture(e.target.value as FixtureKey)}
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
            aria-label="Select visualization fixture"
          >
            {Object.entries(FIXTURES).map(([key, item]) => (
              <option key={key} value={key}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      {/* Selected Visualization Name and Description */}
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
          {trace?.title ?? activeFixture.name}
        </h2>
        {trace?.description && (
          <p style={{ fontSize: '14px', color: 'var(--text, #4b5563)', margin: 0 }}>
            {trace.description}
          </p>
        )}
      </section>

      {/* Visualization Canvas */}
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          width: '100%',
        }}
      >
        <VisualizationCanvas />

        {/* Playback Controls directly below the canvas */}
        <PlaybackControls />

        {/* Current Step Explanation & Concept Tag */}
        {currentStepData && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
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
                  }}
                >
                  {currentStepData.conceptTag}
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
        )}
      </main>
    </div>
  );
}

export default App;

import { memo, useMemo } from 'react';
import { usePlaybackStore, useCurrentStep } from '../store/playbackStore';
import type { Variable } from '../types/vep';

const MONO_FONT = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace";

function formatValue(value: Variable['value']): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

const VariableWatchPanel = () => {
  const currentStep = useCurrentStep();
  const trace = usePlaybackStore((state) => state.trace);
  const currentStepIndex = usePlaybackStore((state) => state.currentStep);

  const variables = currentStep?.variables ?? [];

  // Determine previous step in the trace execution sequence
  const prevStep = currentStepIndex > 0 && trace?.steps ? trace.steps[currentStepIndex - 1] : null;

  // Build lookup map for previous step variables
  const prevVarMap = useMemo(() => {
    const map = new Map<string, Variable['value']>();
    if (!prevStep?.variables) return map;

    for (const v of prevStep.variables) {
      if (v.scope) {
        map.set(`${v.scope}:${v.name}`, v.value);
      }
      if (!map.has(v.name)) {
        map.set(v.name, v.value);
      }
    }
    return map;
  }, [prevStep]);

  return (
    <div
      style={{
        padding: '12px',
        minWidth: '220px',
        fontSize: '13px',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxSizing: 'border-box',
        color: '#1f2937',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      aria-label="Variable Watch Panel"
    >
      {/* Panel Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 8,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
            aria-hidden="true"
          />
          <h3
            style={{
              fontSize: '13px',
              fontWeight: 600,
              margin: 0,
              color: '#111827',
            }}
          >
            Variables
          </h3>
        </div>
        {variables.length > 0 && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: '#6b7280',
              backgroundColor: '#f3f4f6',
              padding: '1px 6px',
              borderRadius: 9999,
            }}
          >
            {variables.length}
          </span>
        )}
      </div>

      {/* Variables Content */}
      {variables.length === 0 ? (
        <div
          style={{
            padding: '16px 8px',
            color: '#6b7280',
            fontStyle: 'italic',
            textAlign: 'center',
          }}
        >
          No variables in this step
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {variables.map((variable, idx) => {
            const scopedKey = variable.scope ? `${variable.scope}:${variable.name}` : variable.name;
            const hasPrev =
              prevStep !== null &&
              (prevVarMap.has(scopedKey) || prevVarMap.has(variable.name));
            const prevValue = prevVarMap.has(scopedKey)
              ? prevVarMap.get(scopedKey)
              : prevVarMap.get(variable.name);

            const isChanged = prevStep !== null && (!hasPrev || prevValue !== variable.value);

            return (
              <div
                key={`${scopedKey}-${idx}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 8px',
                  borderRadius: 6,
                  backgroundColor: isChanged ? 'rgba(254, 240, 138, 0.25)' : '#f9fafb',
                  border: isChanged ? '1px solid #fde047' : '1px solid #f3f4f6',
                  transition: 'background-color 0.3s ease, border-color 0.3s ease',
                }}
              >
                {/* Variable metadata: name, type, scope */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: MONO_FONT,
                      fontWeight: 600,
                      fontSize: '13px',
                      color: '#111827',
                    }}
                  >
                    {variable.name}
                  </span>

                  {variable.type && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#6b7280',
                        backgroundColor: '#e5e7eb',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                      title={`Type: ${variable.type}`}
                    >
                      {variable.type}
                    </span>
                  )}

                  {variable.scope && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#4b5563',
                        backgroundColor: '#e0e7ff',
                        padding: '1px 5px',
                        borderRadius: 4,
                      }}
                      title={`Scope: ${variable.scope}`}
                    >
                      {variable.scope}
                    </span>
                  )}
                </div>

                {/* Variable value */}
                <span
                  style={{
                    fontFamily: MONO_FONT,
                    fontSize: '13px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 4,
                    backgroundColor: isChanged ? '#fef08a' : '#ffffff',
                    color: isChanged ? '#854d0e' : '#1f2937',
                    border: isChanged ? '1px solid #facc15' : '1px solid #d1d5db',
                    transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
                    whiteSpace: 'nowrap',
                  }}
                  title={
                    variable.referencesNodeId
                      ? `References node "${variable.referencesNodeId}"`
                      : undefined
                  }
                >
                  {formatValue(variable.value)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(VariableWatchPanel);

import { memo, useMemo } from 'react';
import { usePlaybackStore, useCurrentStep } from '../store/playbackStore';
import { LINEAR_SEARCH_CODE } from '../generators/linearSearchTrace';

// ---------------------------------------------------------------------------
// Syntax highlight tokenizer for clean dependency-free rendering
// ---------------------------------------------------------------------------

const JS_KEYWORDS = new Set([
  'function',
  'for',
  'let',
  'const',
  'var',
  'if',
  'else',
  'return',
  'while',
  'break',
  'continue',
  'true',
  'false',
  'null',
  'undefined',
]);

interface Token {
  text: string;
  type: 'keyword' | 'number' | 'string' | 'identifier' | 'punctuation' | 'whitespace';
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const regex = /(\s+)|([a-zA-Z_$][a-zA-Z0-9_$]*)|(\d+)|(["'][^"']*["'])|([^\s\w])/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const [full, whitespace, word, number, str, punct] = match;
    if (whitespace) {
      tokens.push({ text: full, type: 'whitespace' });
    } else if (word) {
      if (JS_KEYWORDS.has(word)) {
        tokens.push({ text: full, type: 'keyword' });
      } else {
        tokens.push({ text: full, type: 'identifier' });
      }
    } else if (number) {
      tokens.push({ text: full, type: 'number' });
    } else if (str) {
      tokens.push({ text: full, type: 'string' });
    } else if (punct) {
      tokens.push({ text: full, type: 'punctuation' });
    }
  }

  return tokens;
}

const TOKEN_COLORS: Record<Token['type'], string> = {
  keyword: '#c678dd',     // purple
  number: '#d19a66',      // amber/orange
  string: '#98c379',      // green
  identifier: '#e5c07b',  // warm yellow/gold for params & identifiers
  punctuation: '#abb2bf', // muted chalk
  whitespace: 'inherit',
};

// ---------------------------------------------------------------------------
// Language display mapping matching VEP LanguageEnum
// ---------------------------------------------------------------------------

const LANGUAGE_LABELS: Record<string, string> = {
  c: 'C',
  cpp: 'C++',
  java: 'Java',
  python: 'Python',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  backend: 'Backend',
};

const FILE_EXTENSIONS: Record<string, string> = {
  javascript: '.js',
  typescript: '.ts',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SourceCodePanel = () => {
  const trace = usePlaybackStore((state) => state.trace);
  const currentStep = useCurrentStep();

  const activeLine = currentStep?.sourceLine ?? null;

  // Determine code string: trace.code, or fallback to algorithm default
  const codeString = useMemo(() => {
    if (trace?.code) return trace.code;
    if (trace?.algorithm === 'linear-search') return LINEAR_SEARCH_CODE;
    return null;
  }, [trace]);

  const lines = useMemo(() => {
    if (!codeString) return [];
    return codeString.split('\n');
  }, [codeString]);

  const filename = useMemo(() => {
    if (!trace) return 'Source Code';
    const ext = FILE_EXTENSIONS[trace.language] ?? '';
    if (trace.algorithm === 'linear-search') {
      return `linearSearch${ext}`;
    }
    return trace.algorithm ? `${trace.algorithm}${ext}` : (trace.title ?? 'Source Code');
  }, [trace]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
        backgroundColor: '#16171d',
        border: '1px solid #2e303a',
        borderRadius: 8,
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace",
        color: '#abb2bf',
      }}
      aria-label="Source code tracking panel"
    >
      {/* Panel Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          backgroundColor: '#1f2028',
          borderBottom: '1px solid #2e303a',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#3b82f6',
            }}
          />
          <span style={{ color: '#f3f4f6' }}>
            {filename}
          </span>
          {lines.length > 0 && trace?.language && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: 4,
                backgroundColor: '#2e303a',
                color: '#9ca3af',
                fontWeight: 500,
              }}
            >
              {LANGUAGE_LABELS[trace.language] ?? trace.language}
            </span>
          )}
        </div>

        {activeLine !== null ? (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 9999,
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            Line {activeLine}
          </span>
        ) : (
          <span style={{ fontSize: '11px', color: '#6b7280' }}>Idle</span>
        )}
      </div>

      {/* Code Viewer Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '12px 0',
          fontSize: '14px',
          lineHeight: '26px',
        }}
      >
        {lines.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '0 20px',
              color: '#6b7280',
              textAlign: 'center',
              fontSize: '13px',
            }}
          >
            <p>Source-code execution tracking is not available for this visualization.</p>
          </div>
        ) : (
          lines.map((lineText, idx) => {
            const lineNum = idx + 1;
            const isActive = lineNum === activeLine;
            const tokens = tokenizeLine(lineText);

            return (
              <div
                key={lineNum}
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                  borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'background-color 0.15s ease, border-left-color 0.15s ease',
                  minWidth: 'fit-content',
                }}
                aria-current={isActive ? 'location' : undefined}
              >
                {/* Line number gutter */}
                <div
                  style={{
                    width: 48,
                    minWidth: 48,
                    textAlign: 'right',
                    paddingRight: 14,
                    color: isActive ? '#60a5fa' : '#4b5563',
                    fontWeight: isActive ? 700 : 400,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: 4,
                  }}
                >
                  {isActive && (
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'inline-block',
                        width: 0,
                        height: 0,
                        borderTop: '4px solid transparent',
                        borderBottom: '4px solid transparent',
                        borderLeft: '5px solid #60a5fa',
                        marginRight: 2,
                      }}
                    />
                  )}
                  <span>{lineNum}</span>
                </div>

                {/* Code line content */}
                <div
                  style={{
                    flex: 1,
                    paddingLeft: 10,
                    paddingRight: 16,
                    whiteSpace: 'pre',
                    color: isActive ? '#f8fafc' : '#abb2bf',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {tokens.map((token, tIdx) => (
                    <span
                      key={tIdx}
                      style={{
                        color: TOKEN_COLORS[token.type],
                        fontWeight: token.type === 'keyword' ? 600 : 'inherit',
                      }}
                    >
                      {token.text}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default memo(SourceCodePanel);

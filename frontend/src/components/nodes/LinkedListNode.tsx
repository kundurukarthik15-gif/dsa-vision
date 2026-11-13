import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface LinkedListNodeData {
  kind: 'linked-list-node';
  value?: string | number | boolean | null;
  highlight: string;
  label?: string;
}

const getHighlightStyle = (highlight: string): React.CSSProperties => {
  switch (highlight) {
    case 'active':
      return {
        backgroundColor: '#fef08a',
        borderColor: '#ea580c',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 1,
      };
    case 'comparing':
      return {
        backgroundColor: '#bfdbfe',
        borderColor: '#2563eb',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 1,
      };
    case 'visited':
      return {
        backgroundColor: '#f3f4f6',
        borderColor: '#9ca3af',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 0.7,
      };
    case 'swapped':
      return {
        backgroundColor: '#bbf7d0',
        borderColor: '#16a34a',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 1,
      };
    case 'success':
      return {
        backgroundColor: '#bbf7d0',
        borderColor: '#16a34a',
        borderWidth: '4px',
        borderStyle: 'solid',
        opacity: 1,
      };
    case 'error':
      return {
        backgroundColor: '#fecaca',
        borderColor: '#dc2626',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 1,
      };
    case 'idle':
    default:
      return {
        backgroundColor: '#ffffff',
        borderColor: '#9ca3af',
        borderWidth: '2px',
        borderStyle: 'solid',
        opacity: 1,
      };
  }
};

const LinkedListNode = ({ data }: NodeProps<LinkedListNodeData>) => {
  const highlightStyle = getHighlightStyle(data.highlight);
  const displayValue =
    data.value !== undefined && data.value !== null ? String(data.value) : '—';

  return (
    <div
      style={{
        width: 120,
        height: 60,
        boxSizing: 'border-box',
        borderRadius: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'sans-serif',
        color: '#1f2937',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        padding: '0 16px',
        ...highlightStyle,
      }}
    >
      {/* Left target handle with pointer entry area */}
      <div
        style={{
          position: 'absolute',
          left: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#cbd5e1',
          pointerEvents: 'none',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#64748b',
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />

      {/* Main node content */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <span
          style={{
            fontSize: '18px',
            fontWeight: 700,
            lineHeight: 1.2,
            userSelect: 'none',
          }}
        >
          {displayValue}
        </span>

        {data.label && (
          <span
            style={{
              fontSize: '10px',
              color: '#4b5563',
              marginTop: '2px',
              maxWidth: '80px',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
          >
            {data.label}
          </span>
        )}
      </div>

      {/* Right source handle with pointer exit area */}
      <div
        style={{
          position: 'absolute',
          right: 6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#cbd5e1',
          pointerEvents: 'none',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#64748b',
          width: 8,
          height: 8,
          borderRadius: '50%',
        }}
      />
    </div>
  );
};

export default memo(LinkedListNode);

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';

export interface ArrayCellNodeData {
  kind: 'array-cell';
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

const ArrayCellNode = ({ data }: NodeProps<ArrayCellNodeData>) => {
  const highlightStyle = getHighlightStyle(data.highlight);
  const displayValue =
    data.value !== undefined && data.value !== null ? String(data.value) : '—';

  return (
    <div
      style={{
        width: 80,
        height: 80,
        boxSizing: 'border-box',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        fontFamily: 'sans-serif',
        color: '#1f2937',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        ...highlightStyle,
      }}
    >
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

      <span
        style={{
          fontSize: '22px',
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
            fontSize: '11px',
            color: '#4b5563',
            marginTop: '4px',
            maxWidth: '72px',
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

export default memo(ArrayCellNode);

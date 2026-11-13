import { memo, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { usePlaybackStore, useCurrentStep } from '../store/playbackStore';
import ArrayCellNode from './nodes/ArrayCellNode';
import LinkedListNode from './nodes/LinkedListNode';

// 1. Module-level nodeTypes definition to prevent re-renders
const nodeTypes = {
  'array-cell': ArrayCellNode,
  'linked-list-node': LinkedListNode,
};

const VisualizationCanvas = () => {
  const step = useCurrentStep();
  const trace = usePlaybackStore((state) => state.trace);

  // 2. Map VEP nodes to React Flow nodes
  const rfNodes: Node[] = useMemo(() => {
    if (!step) return [];

    // Ensure required 'nodes' array exists on the step
    if (!Array.isArray(step.nodes)) {
      throw new Error(`Invalid VEP step (${step.step}): required "nodes" array is missing.`);
    }

    return step.nodes.map((n) => ({
      id: n.id,
      type: n.kind,
      position: { x: n.position.x, y: n.position.y },
      data: {
        kind: n.kind,
        value: n.value,
        highlight: n.highlight ?? 'idle',
        label: n.label,
      },
      draggable: false,
      selectable: false,
    }));
  }, [step]);

  // 3. Map VEP edges to React Flow edges
  const rfEdges: Edge[] = useMemo(() => {
    if (!step) return [];

    // In VEP, 'edges' defaults to [] when omitted (e.g. array-based algorithms without edges)
    const rawEdges = step.edges ?? [];
    if (!Array.isArray(rawEdges)) {
      throw new Error(`Invalid VEP step (${step.step}): "edges" must be an array when provided.`);
    }

    return rawEdges.map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      label: e.label,
      type: 'smoothstep',
      animated: e.highlight === 'active',
      style: { strokeWidth: 2 },
      markerEnd: e.directed !== false ? { type: MarkerType.ArrowClosed } : undefined,
    }));
  }, [step]);

  if (!trace || !step) {
    return (
      <div
        style={{
          width: '100%',
          height: 600,
          border: '1px solid #ddd',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6b7280',
          fontFamily: 'sans-serif',
          backgroundColor: '#f9fafb',
        }}
      >
        <p>No visualization step to display. Please load a trace.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: false }}
      >
        <Background />
        <Controls showInteractive={false} />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default memo(VisualizationCanvas);

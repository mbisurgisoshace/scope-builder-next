'use client';

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { journeyNodeTypes } from './nodes/nodeTypes';
import { journeyEdgeTypes } from './edges/edgeTypes';
import { useJourneyDataBridge } from './hooks/useJourneyDataBridge';
import { useLayout } from './hooks/useLayout';
import { ProgressBar } from './components/ProgressBar';
import { JourneyContext, type JourneyParticipant } from './JourneyContext';

const INITIAL_TRIGGER_ID = 'initial-trigger';

const initialNodes: Node[] = [
  {
    id: INITIAL_TRIGGER_ID,
    type: 'trigger',
    position: { x: 0, y: 0 },
    data: {
      id: INITIAL_TRIGGER_ID,
      type: 'trigger',
      content: '',
      stakeholderId: null,
    },
  },
];

const initialEdges: Edge[] = [];

interface ProblemJourneyCanvasProps {
  participants: JourneyParticipant[];
}

function CanvasInner({ participants }: ProblemJourneyCanvasProps) {
  const { addChildNode, updateNodeData } = useJourneyDataBridge();
  useLayout();

  return (
    <JourneyContext.Provider value={{ addChildNode, updateNodeData, participants }}>
      <div style={{ width: '100%', height: '100%' }}>
        <ReactFlow
          defaultNodes={initialNodes}
          defaultEdges={initialEdges}
          nodeTypes={journeyNodeTypes}
          edgeTypes={journeyEdgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          zoomOnDoubleClick={false}
          fitView
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} color="#e5e7eb" />
          <Controls showInteractive={false} />
          <Panel position="top-center" style={{ marginTop: '16px' }}>
            <ProgressBar />
          </Panel>
        </ReactFlow>
      </div>
    </JourneyContext.Provider>
  );
}

export function ProblemJourneyCanvas({ participants }: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner participants={participants} />
    </ReactFlowProvider>
  );
}

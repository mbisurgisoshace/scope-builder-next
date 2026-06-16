'use client';

import { useState, useCallback } from 'react';
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
import { SelectedNodeContext } from './SelectedNodeContext';
import { NodeProblemsContext } from './NodeProblemsContext';
import { NodeSolutionsContext } from './NodeSolutionsContext';
import { ActionNodeSheet, type Problem, type Solution } from './components/ActionNodeSheet';

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

  const [selectedActionNodeId, setSelectedActionNodeId] = useState<string | null>(null);
  const [nodeProblems, setNodeProblems] = useState<Map<string, Problem[]>>(new Map());
  const [nodeSolutions, setNodeSolutions] = useState<Map<string, Solution[]>>(new Map());

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'action') {
      setSelectedActionNodeId(node.id);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedActionNodeId(null);
  }, []);

  const addProblem = useCallback((nodeId: string, description: string) => {
    setNodeProblems((prev) => {
      const next = new Map(prev);
      next.set(nodeId, [...(next.get(nodeId) ?? []), { id: crypto.randomUUID(), description }]);
      return next;
    });
  }, []);

  const addSolution = useCallback((nodeId: string, description: string) => {
    setNodeSolutions((prev) => {
      const next = new Map(prev);
      next.set(nodeId, [...(next.get(nodeId) ?? []), { id: crypto.randomUUID(), description }]);
      return next;
    });
  }, []);

  return (
    <NodeSolutionsContext.Provider value={nodeSolutions}>
    <NodeProblemsContext.Provider value={nodeProblems}>
    <SelectedNodeContext.Provider value={selectedActionNodeId}>
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
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} color="#e5e7eb" />
            <Controls showInteractive={false} />
            <Panel position="top-center" style={{ marginTop: '16px' }}>
              <ProgressBar />
            </Panel>
          </ReactFlow>
        </div>

        <ActionNodeSheet
          open={selectedActionNodeId !== null}
          onOpenChange={(open) => { if (!open) setSelectedActionNodeId(null); }}
          problems={selectedActionNodeId ? (nodeProblems.get(selectedActionNodeId) ?? []) : []}
          onAddProblem={(desc) => { if (selectedActionNodeId) addProblem(selectedActionNodeId, desc); }}
          solutions={selectedActionNodeId ? (nodeSolutions.get(selectedActionNodeId) ?? []) : []}
          onAddSolution={(desc) => { if (selectedActionNodeId) addSolution(selectedActionNodeId, desc); }}
        />
      </JourneyContext.Provider>
    </SelectedNodeContext.Provider>
    </NodeProblemsContext.Provider>
    </NodeSolutionsContext.Provider>
  );
}

export function ProblemJourneyCanvas({ participants }: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner participants={participants} />
    </ReactFlowProvider>
  );
}

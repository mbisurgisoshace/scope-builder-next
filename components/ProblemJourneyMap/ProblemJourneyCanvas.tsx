'use client';

import { useState, useCallback } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { journeyNodeTypes } from './nodes/nodeTypes';
import { journeyEdgeTypes } from './edges/edgeTypes';
import { useJourneyDataBridge } from './hooks/useJourneyDataBridge';
import { useLayout } from './hooks/useLayout';
import { JourneyContext, type JourneyParticipant } from './JourneyContext';
import { SelectedNodeContext } from './SelectedNodeContext';
import { NodeProblemsContext } from './NodeProblemsContext';
import { NodeSolutionsContext } from './NodeSolutionsContext';
import { ActionNodeSheet } from './components/ActionNodeSheet';

interface ProblemJourneyCanvasProps {
  participants: JourneyParticipant[];
}

function CanvasInner({ participants }: ProblemJourneyCanvasProps) {
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    addChildNode,
    updateNodeData,
    addProblem,
    updateProblem,
    addSolution,
    nodeProblems,
    nodeSolutions,
  } = useJourneyDataBridge();

  useLayout(setNodes);

  const [selectedActionNodeId, setSelectedActionNodeId] = useState<string | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === 'action') {
      setSelectedActionNodeId(node.id);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedActionNodeId(null);
  }, []);

  return (
    <NodeSolutionsContext.Provider value={nodeSolutions}>
    <NodeProblemsContext.Provider value={nodeProblems}>
    <SelectedNodeContext.Provider value={selectedActionNodeId}>
      <JourneyContext.Provider value={{ addChildNode, updateNodeData, participants }}>
        <div style={{ width: '100%', height: '100%' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
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
          </ReactFlow>
        </div>

        <ActionNodeSheet
          open={selectedActionNodeId !== null}
          onOpenChange={(open) => { if (!open) setSelectedActionNodeId(null); }}
          problems={selectedActionNodeId ? (nodeProblems.get(selectedActionNodeId) ?? []) : []}
          onAddProblem={(desc, questions) => { if (selectedActionNodeId) addProblem(selectedActionNodeId, desc, questions); }}
          onUpdateProblem={(problemId, desc, questions) => { if (selectedActionNodeId) updateProblem(selectedActionNodeId, problemId, desc, questions); }}
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

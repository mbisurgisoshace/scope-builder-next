"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  type Node,
} from "@xyflow/react";
import { ZapIcon } from "lucide-react";
import "@xyflow/react/dist/style.css";

import { journeyNodeTypes } from "./nodes/nodeTypes";
import { journeyEdgeTypes } from "./edges/edgeTypes";
import { useJourneyDataBridge } from "./hooks/useJourneyDataBridge";
import { useLayout } from "./hooks/useLayout";
import { JourneyContext } from "./JourneyContext";
import { SelectedNodeContext } from "./SelectedNodeContext";
import { NodeProblemsContext } from "./NodeProblemsContext";
import { NodeSolutionsContext } from "./NodeSolutionsContext";
import { NodeConclusionsContext } from "./NodeConclusionsContext";
import { ActionNodeSheet } from "./components/ActionNodeSheet";

interface ProblemJourneyCanvasProps {
  jobTitles: string[];
}

function CanvasInner({
  jobTitles: initialJobTitles,
}: ProblemJourneyCanvasProps) {
  const {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    addTriggerNode,
    addChildNode,
    updateNodeData,
    saveProblem,
    addSolution,
    updateSolution,
    nodeProblems,
    nodeSolutions,
    nodeConclusions,
  } = useJourneyDataBridge();

  useLayout(setNodes);

  const [jobTitles, setJobTitles] = useState<string[]>(initialJobTitles);
  const addJobTitle = useCallback((jobTitle: string) => {
    setJobTitles((prev) => [...prev, jobTitle]);
  }, []);

  const [selectedActionNodeId, setSelectedActionNodeId] = useState<
    string | null
  >(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type === "action") {
      setSelectedActionNodeId(node.id);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedActionNodeId(null);
  }, []);

  return (
    <NodeConclusionsContext.Provider value={nodeConclusions}>
      <NodeSolutionsContext.Provider value={nodeSolutions}>
        <NodeProblemsContext.Provider value={nodeProblems}>
          <SelectedNodeContext.Provider value={selectedActionNodeId}>
            <JourneyContext.Provider
              value={{
                addTriggerNode,
                addChildNode,
                updateNodeData,
                jobTitles,
                addJobTitle,
              }}
            >
              <div style={{ width: "100%", height: "100%" }}>
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
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    color="#e5e7eb"
                  />
                  <Controls showInteractive={false} />
                  <Panel position="bottom-right">
                    <button
                      onClick={addTriggerNode}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6A35FF] text-white text-sm font-medium shadow hover:bg-[#5a2de0] transition-colors"
                    >
                      <ZapIcon className="w-3.5 h-3.5" />
                      Add Trigger
                    </button>
                  </Panel>
                </ReactFlow>
              </div>

              <ActionNodeSheet
                open={selectedActionNodeId !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedActionNodeId(null);
                }}
                nodeId={selectedActionNodeId}
                problem={
                  selectedActionNodeId
                    ? (nodeProblems.get(selectedActionNodeId)?.[0] ?? null)
                    : null
                }
                onSaveProblem={(desc, type, painOrGain, questions) => {
                  if (selectedActionNodeId)
                    saveProblem(
                      selectedActionNodeId,
                      desc,
                      type,
                      painOrGain,
                      questions,
                    );
                }}
                solutions={
                  selectedActionNodeId
                    ? (nodeSolutions.get(selectedActionNodeId) ?? [])
                    : []
                }
                onAddSolution={(desc, questions) => {
                  if (selectedActionNodeId)
                    addSolution(selectedActionNodeId, desc, questions);
                }}
                onUpdateSolution={(solutionId, desc, questions) => {
                  if (selectedActionNodeId)
                    updateSolution(
                      selectedActionNodeId,
                      solutionId,
                      desc,
                      questions,
                    );
                }}
              />
            </JourneyContext.Provider>
          </SelectedNodeContext.Provider>
        </NodeProblemsContext.Provider>
      </NodeSolutionsContext.Provider>
    </NodeConclusionsContext.Provider>
  );
}

export function ProblemJourneyCanvas({
  jobTitles,
}: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner jobTitles={jobTitles} />
    </ReactFlowProvider>
  );
}

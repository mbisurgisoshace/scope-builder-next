"use client";

import { useState, useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
} from "@xyflow/react";
import { ZapIcon } from "lucide-react";
import "@xyflow/react/dist/style.css";

import { journeyNodeTypes } from "./nodes/nodeTypes";
import { journeyEdgeTypes } from "./edges/edgeTypes";
import { useJourneyDataBridge } from "./hooks/useJourneyDataBridge";
import { useLayout } from "./hooks/useLayout";
import { JourneyContext } from "./JourneyContext";
import { SelectedNodeContext, type SelectedProblem } from "./SelectedNodeContext";
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
    addEmptyProblem,
    removeProblem,
    saveSolution,
    nodeProblems,
    nodeSolutions,
    solutionForProblem,
    nodeConclusions,
  } = useJourneyDataBridge();

  useLayout(setNodes);

  const [jobTitles, setJobTitles] = useState<string[]>(initialJobTitles);
  const addJobTitle = useCallback((jobTitle: string) => {
    setJobTitles((prev) => [...prev, jobTitle]);
  }, []);

  const [selectedProblem, setSelectedProblem] =
    useState<SelectedProblem | null>(null);

  const openProblem = useCallback((nodeId: string, problemId: string) => {
    setSelectedProblem({ nodeId, problemId });
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedProblem(null);
  }, []);

  const selectedProblemData = selectedProblem
    ? (nodeProblems
        .get(selectedProblem.nodeId)
        ?.find((p) => p.id === selectedProblem.problemId) ?? null)
    : null;

  const selectedSolutionData = selectedProblem
    ? solutionForProblem(selectedProblem.nodeId, selectedProblem.problemId)
    : null;

  return (
    <NodeConclusionsContext.Provider value={nodeConclusions}>
      <NodeSolutionsContext.Provider value={nodeSolutions}>
        <NodeProblemsContext.Provider value={nodeProblems}>
          <SelectedNodeContext.Provider value={selectedProblem}>
            <JourneyContext.Provider
              value={{
                addTriggerNode,
                addChildNode,
                updateNodeData,
                jobTitles,
                addJobTitle,
                openProblem,
                addEmptyProblem,
                removeProblem,
                solutionForProblem,
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
                  minZoom={0.2}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
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
                open={selectedProblem !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedProblem(null);
                }}
                nodeId={selectedProblem?.nodeId ?? null}
                problemId={selectedProblem?.problemId ?? null}
                problem={selectedProblemData}
                onSaveProblem={(desc, type, painOrGain, questions) => {
                  if (selectedProblem)
                    saveProblem(
                      selectedProblem.nodeId,
                      selectedProblem.problemId,
                      desc,
                      type,
                      painOrGain,
                      questions,
                    );
                }}
                solution={selectedSolutionData}
                onSaveSolution={(desc, type, relieverOrCreator, questions) => {
                  if (selectedProblem)
                    saveSolution(
                      selectedProblem.nodeId,
                      selectedProblem.problemId,
                      desc,
                      type,
                      relieverOrCreator,
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

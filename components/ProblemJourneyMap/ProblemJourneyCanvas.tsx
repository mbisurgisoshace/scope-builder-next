"use client";

import { useCallback, useState } from "react";
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
import type { StakeholderRow } from "@/services/market";

interface ProblemJourneyCanvasProps {
  /** Org-wide stakeholder rows from the Market tab, used by Trigger nodes to
   * pick and display stakeholders. Loaded once server-side. */
  stakeholderRows: StakeholderRow[];
  /** Render the canvas as a read-only viewer (Examples pages). */
  readOnly?: boolean;
}

const noop = () => {};

function CanvasInner({
  stakeholderRows,
  readOnly = false,
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
                readOnly,
                // Structural/field mutators are hard no-ops in read-only mode so
                // nothing can write to the shared example room even if a control
                // were somehow reachable.
                addTriggerNode: readOnly ? noop : addTriggerNode,
                addChildNode: readOnly ? noop : addChildNode,
                updateNodeData: readOnly ? noop : updateNodeData,
                stakeholderRows,
                openProblem,
                addEmptyProblem: readOnly ? () => "" : addEmptyProblem,
                removeProblem: readOnly ? noop : removeProblem,
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
                  {!readOnly && (
                    <Panel position="bottom-right">
                      <button
                        onClick={addTriggerNode}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6A35FF] text-white text-sm font-medium shadow hover:bg-[#5a2de0] transition-colors"
                      >
                        <ZapIcon className="w-3.5 h-3.5" />
                        Add Trigger
                      </button>
                    </Panel>
                  )}
                </ReactFlow>
              </div>

              <ActionNodeSheet
                readOnly={readOnly}
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
  stakeholderRows,
  readOnly = false,
}: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner stakeholderRows={stakeholderRows} readOnly={readOnly} />
    </ReactFlowProvider>
  );
}

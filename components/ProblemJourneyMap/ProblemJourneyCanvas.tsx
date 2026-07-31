"use client";

import { useCallback, useMemo, useState } from "react";
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
import {
  SelectedNodeContext,
  type SelectedProblem,
} from "./SelectedNodeContext";
import { NodeProblemsContext } from "./NodeProblemsContext";
import { NodeSolutionsContext } from "./NodeSolutionsContext";
import { NodeConclusionsContext } from "./NodeConclusionsContext";
import {
  ActionNodeSheet,
  type ActionSheetTab,
} from "./components/ActionNodeSheet";
import type { StakeholderRow } from "@/services/market";
import {
  EVIDENCE_SUB_STEP,
  PROBLEM_DETAIL_SUB_STEP,
  PROBLEMS_MILESTONE,
} from "@/lib/milestones";
import { useSubStepProgress } from "./SubStepProgressContext";

interface ProblemJourneyCanvasProps {
  /** Org-wide stakeholder rows from the Market tab, used by Trigger nodes to
   * pick and display stakeholders. Loaded once server-side. */
  stakeholderRows: StakeholderRow[];
  /** Every milestone the startup has unlocked, resolved server-side by the page.
   * The canvas derives its progressive-disclosure gates from this — see
   * `isMilestoneUnlocked` on JourneyContext. */
  availableMilestones: number[];
  /** Render the canvas as a read-only viewer (Examples pages). */
  readOnly?: boolean;
}

const noop = () => {};

function CanvasInner({
  stakeholderRows,
  availableMilestones,
  readOnly = false,
}: ProblemJourneyCanvasProps) {
  const {
    nodes,
    edges,
    setNodes,
    pendingFocusRef,
    onNodesChange,
    onEdgesChange,
    addTriggerNode,
    addChildNode,
    updateNodeData,
    updateEdgeLabel,
    saveProblem,
    addEmptyProblem,
    removeProblem,
    saveSolution,
    nodeProblems,
    nodeSolutions,
    solutionForProblem,
    nodeConclusions,
  } = useJourneyDataBridge();

  useLayout(setNodes, pendingFocusRef);

  const unlockedMilestones = useMemo(
    () => new Set(availableMilestones),
    [availableMilestones],
  );

  const isMilestoneUnlocked = useCallback(
    (milestone: number) => unlockedMilestones.has(milestone),
    [unlockedMilestones],
  );

  // Problems (the cards on an Action node, "Add a problem", and the sheet they
  // open) are Milestone 2 work — Milestone 1 is the journey structure alone.
  // Locked hides them outright rather than greying them: existing problems stay
  // in storage untouched and reappear when the milestone unlocks.
  const problemsUnlocked = isMilestoneUnlocked(PROBLEMS_MILESTONE);

  // Inside Milestone 2 the sheet then fills in by sub-step. A fresh Milestone 2
  // is the description alone; reviewing 2.1 adds the classification, the
  // answered questions and the bank; 2.3 adds the evidence columns on each
  // question. Same rule as the milestone gate — locked means absent, and saved
  // values are left untouched underneath.
  const { progress } = useSubStepProgress();
  const detailUnlocked = progress[PROBLEM_DETAIL_SUB_STEP] ?? false;
  const evidenceUnlocked = progress[EVIDENCE_SUB_STEP] ?? false;

  const [selectedProblem, setSelectedProblem] =
    useState<SelectedProblem | null>(null);
  // Controlled like `open` is, so a click on the card always lands on the right
  // tab — even when the sheet is already open on that same problem.
  const [sheetTab, setSheetTab] = useState<ActionSheetTab>("problem");

  const openProblem = useCallback(
    (nodeId: string, problemId: string, tab: ActionSheetTab = "problem") => {
      // Nothing on a locked canvas can reach this, but the sheet is the one
      // problem surface that isn't rendered by ActionNode — keep it shut here
      // too so a stale handler can't open it.
      if (!problemsUnlocked) return;
      setSelectedProblem({ nodeId, problemId });
      setSheetTab(tab);
    },
    [problemsUnlocked],
  );

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
                isMilestoneUnlocked,
                // Structural/field mutators are hard no-ops in read-only mode so
                // nothing can write to the shared example room even if a control
                // were somehow reachable.
                addTriggerNode: readOnly ? noop : addTriggerNode,
                addChildNode: readOnly ? noop : addChildNode,
                updateNodeData: readOnly ? noop : updateNodeData,
                updateEdgeLabel: readOnly ? noop : updateEdgeLabel,
                stakeholderRows,
                openProblem,
                // Problem writes are gated on the milestone as well as read-only,
                // so a locked canvas can never add or drop a problem.
                addEmptyProblem:
                  readOnly || !problemsUnlocked ? () => "" : addEmptyProblem,
                removeProblem:
                  readOnly || !problemsUnlocked ? noop : removeProblem,
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
                        Add Trigger / Motivation
                      </button>
                    </Panel>
                  )}
                </ReactFlow>
              </div>

              <ActionNodeSheet
                readOnly={readOnly}
                detailUnlocked={detailUnlocked}
                evidenceUnlocked={evidenceUnlocked}
                open={selectedProblem !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedProblem(null);
                }}
                activeTab={sheetTab}
                onActiveTabChange={setSheetTab}
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
  availableMilestones,
  readOnly = false,
}: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        stakeholderRows={stakeholderRows}
        availableMilestones={availableMilestones}
        readOnly={readOnly}
      />
    </ReactFlowProvider>
  );
}

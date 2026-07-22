"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PlayIcon, PlusIcon, XIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import { useSelectedNode } from "../SelectedNodeContext";
import { useNodeProblems } from "../NodeProblemsContext";
import { Input } from "@/components/ui/input";
import type { Problem } from "../components/ActionNodeSheet";

// A single problem (+ its solution preview) as it appears stacked on the card.
// Every problem — including the first — renders with this same component.
interface ProblemCardProps {
  nodeId: string;
  problem: Problem;
  isSelected: boolean;
  canDelete: boolean;
}

function ProblemCard({
  nodeId,
  problem,
  isSelected,
  canDelete,
}: ProblemCardProps) {
  const { openProblem, removeProblem, solutionForProblem } =
    useJourneyContext();
  const solution = solutionForProblem(nodeId, problem.id);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openProblem(nodeId, problem.id);
    },
    [openProblem, nodeId, problem.id],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeProblem(nodeId, problem.id);
    },
    [removeProblem, nodeId, problem.id],
  );

  return (
    <div
      onClick={handleClick}
      className="mt-3 pt-3 border-t border-gray-100 cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs text-gray-400">What is the problem/pain?</p>
        {canDelete && (
          <button
            onClick={handleDelete}
            title="Delete problem"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        className={`bg-[#F3F3F6] rounded-lg p-3 ${
          isSelected ? "ring-1 ring-[#6A35FF]" : ""
        }`}
      >
        <p className="text-sm text-gray-700">
          {problem.description || (
            <span className="text-gray-400 italic">No description yet</span>
          )}
        </p>
      </div>

      {solution?.description && (
        <div className="mt-3">
          <p className="font-semibold text-[#111827] mb-2">Solution</p>
          <div className="bg-[#E8FAE9] rounded-lg p-3">
            <span className="text-xs font-semibold bg-[#70E38F] text-[#111827] rounded-full px-2 py-0.5">
              Solution
            </span>
            <p className="text-sm text-gray-700 mt-1.5">
              {solution.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { addChildNode, updateNodeData, openProblem, addEmptyProblem } =
    useJourneyContext();
  const selected = useSelectedNode();
  const isNodeSelected = selected?.nodeId === id;
  const nodeProblemsMap = useNodeProblems();
  const problems = nodeProblemsMap.get(id) ?? [];
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggleMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (anchorRect) {
        setAnchorRect(null);
      } else if (buttonRef.current) {
        setAnchorRect(buttonRef.current.getBoundingClientRect());
      }
    },
    [anchorRect],
  );

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setAnchorRect(null);
    },
    [id, addChildNode],
  );

  const handleClose = useCallback(() => setAnchorRect(null), []);

  const handleAddProblem = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newId = addEmptyProblem(id);
      openProblem(id, newId);
    },
    [addEmptyProblem, openProblem, id],
  );

  return (
    <div
      className={`nopan nodrag pointer-events-auto w-[370px] bg-white border rounded-xl p-4 relative shadow-sm ${isNodeSelected ? "border-purple-500 " : "border-gray-200"}`}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
          <PlayIcon className="w-3.5 h-3.5 text-[#6A35FF]" />
        </div>
        <span className="text-lg font-semibold text-[#111827] tracking-wide">
          Action
        </span>
      </div>

      <Input
        className="nodrag nopan w-full text-sm text-gray-700 bg-transparent resize-none placeholder-gray-400 focus:outline-none leading-snug"
        placeholder="Type your action..."
        value={nodeData.content ?? ""}
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
        onClick={(e) => e.stopPropagation()}
      />

      {problems.map((problem) => (
        <ProblemCard
          key={problem.id}
          nodeId={id}
          problem={problem}
          isSelected={selected?.problemId === problem.id}
          canDelete={problems.length > 1}
        />
      ))}

      <button
        onClick={handleAddProblem}
        className="nodrag nopan mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-sm font-medium text-gray-500 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Add a problem
      </button>

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3">
        <button
          ref={buttonRef}
          className="nodrag nopan w-[30px] h-[30px] rounded-full bg-[#A198BA] text-white flex items-center justify-center shadow hover:bg-[#9486bb] transition-colors"
          onClick={handleToggleMenu}
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        {anchorRect && (
          <NodeTypeMenu
            anchorRect={anchorRect}
            onSelect={handleSelect}
            onClose={handleClose}
          />
        )}
      </div>
    </div>
  );
}

export const ActionNode = memo(ActionNodeInner);

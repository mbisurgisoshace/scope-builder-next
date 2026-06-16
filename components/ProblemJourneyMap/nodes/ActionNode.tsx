"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PlayIcon, PlusIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import { useSelectedNode } from "../SelectedNodeContext";
import { useNodeProblems } from "../NodeProblemsContext";
import { useNodeSolutions } from "../NodeSolutionsContext";
import { Input } from "@/components/ui/input";

function ActionNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { addChildNode, updateNodeData, participants } = useJourneyContext();
  const selectedNodeId = useSelectedNode();
  const isSelected = selectedNodeId === id;
  const nodeProblemsMap = useNodeProblems();
  const problems = nodeProblemsMap.get(id) ?? [];
  const nodeSolutionsMap = useNodeSolutions();
  const solutions = nodeSolutionsMap.get(id) ?? [];
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

  return (
    <div
      className={`nopan nodrag pointer-events-auto w-[370px] bg-white border rounded-xl p-4 relative shadow-sm ${isSelected ? "border-purple-500 " : "border-gray-200"}`}
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

      {problems.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className=" font-semibold text-[#111827] mb-2">Problems</p>
          <div className="flex flex-col gap-2">
            {problems.map((p) => (
              <div key={p.id} className="bg-[#F3F3F6] rounded-lg p-3">
                <span className="text-xs font-semibold bg-[#D02D50] text-white rounded-full px-2 py-0.5">
                  Problem
                </span>
                <p className="text-sm text-gray-700 mt-1.5">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {solutions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="font-semibold text-[#111827] mb-2">Solutions</p>
          <div className="flex flex-col gap-2">
            {solutions.map((s) => (
              <div key={s.id} className="bg-[#E8FAE9] rounded-lg p-3">
                <span className="text-xs font-semibold bg-[#70E38F] text-[#111827] rounded-full px-2 py-0.5">
                  Solution
                </span>
                <p className="text-sm text-gray-700 mt-1.5">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

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

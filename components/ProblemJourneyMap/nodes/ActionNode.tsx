"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PlayIcon, PlusIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import { useSelectedNode } from "../SelectedNodeContext";

function ActionNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { addChildNode, updateNodeData, participants } = useJourneyContext();
  const selectedNodeId = useSelectedNode();
  const isSelected = selectedNodeId === id;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setMenuOpen(false);
    },
    [id, addChildNode],
  );

  return (
    <div
      className={`nopan nodrag pointer-events-auto w-[370px] bg-white border rounded-xl p-4 relative shadow-sm ring-offset-1 ${isSelected ? "border-purple-500 " : "border-gray-200"}`}
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

      {participants.length > 0 && (
        <select
          className="nodrag nopan w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-gray-50 text-gray-600 mb-3 focus:outline-none focus:ring-1 focus:ring-blue-200"
          value={nodeData.stakeholderId ?? ""}
          onChange={(e) =>
            updateNodeData(id, { stakeholderId: e.target.value || null })
          }
        >
          <option value="">Stakeholder...</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      <textarea
        className="nodrag nopan w-full text-sm text-gray-700 bg-transparent resize-none placeholder-gray-400 focus:outline-none leading-snug"
        rows={3}
        placeholder="Type your action..."
        value={nodeData.content ?? ""}
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1">
        <button
          className="nodrag nopan w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center shadow hover:bg-blue-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        {menuOpen && (
          <NodeTypeMenu
            onSelect={handleSelect}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>
    </div>
  );
}

export const ActionNode = memo(ActionNodeInner);

"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ZapIcon, PlusIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function TriggerNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { addChildNode, updateNodeData, participants } = useJourneyContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setMenuOpen(false);
    },
    [id, addChildNode],
  );

  return (
    <div className="nopan nodrag pointer-events-auto bg-white border border-white rounded-xl p-4 relative shadow-sm">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="flex items-center gap-10 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
            <ZapIcon className="w-3.5 h-3.5 text-[#6A35FF]" />
          </div>
          <span className="text-lg font-semibold text-[#111827] tracking-wide">
            Trigger
          </span>
        </div>
        <Select>
          <SelectTrigger className="w-full max-w-48">
            <SelectValue placeholder="Stakeholder..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="John Doe">John Doe</SelectItem>
            <SelectItem value="Alice Doe">Alice Doe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {participants.length > 0 && (
        <select
          className="nodrag nopan w-full text-xs border border-indigo-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 mb-3 focus:outline-none focus:ring-1 focus:ring-indigo-300"
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

      <Input
        value={nodeData.content ?? ""}
        placeholder="Type your trigger..."
        className="nodrag nopan w-full text-sm text-gray-700 bg-transparent resize-none placeholder-gray-400 focus:outline-none leading-snug"
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      {/* "+" button — positioned on the right edge, outside the card boundary */}
      <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3">
        <button
          className="nodrag nopan w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow hover:bg-indigo-600 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
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

export const TriggerNode = memo(TriggerNodeInner);

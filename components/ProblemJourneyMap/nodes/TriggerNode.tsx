"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ZapIcon, PlusIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
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
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggleMenu = useCallback(() => {
    if (anchorRect) {
      setAnchorRect(null);
    } else if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
  }, [anchorRect]);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setAnchorRect(null);
    },
    [id, addChildNode],
  );

  const handleClose = useCallback(() => setAnchorRect(null), []);

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
        <Select
          value={nodeData.stakeholderId ?? ""}
          onValueChange={(val) =>
            updateNodeData(id, { stakeholderId: val || null })
          }
        >
          <SelectTrigger className="nodrag nopan w-full max-w-48">
            <SelectValue placeholder="Stakeholder..." />
          </SelectTrigger>
          <SelectContent>
            {participants.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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

export const TriggerNode = memo(TriggerNodeInner);

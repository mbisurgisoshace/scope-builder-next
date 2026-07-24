"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ZapIcon, PlusIcon } from "lucide-react";

import { NodeTypeMenu } from "../components/NodeTypeMenu";
import { StakeholderPickerModal } from "../components/StakeholderPickerModal";
import { STAKEHOLDER_DEFINITIONS } from "../components/Market/constants";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import type { StakeholderRow } from "@/services/market";
import { Input } from "@/components/ui/input";

// Resolve the node's selected stakeholder ids to rows, grouped by category in
// `STAKEHOLDER_DEFINITIONS` order. Ids with no matching row (deleted on the
// Market tab) are dropped; empty categories are omitted.
function groupSelected(
  stakeholderRows: StakeholderRow[],
  selectedIds: number[],
): { title: string; values: string[] }[] {
  const selected = new Set(selectedIds);
  const rowsByType = new Map<string, StakeholderRow[]>();
  for (const row of stakeholderRows) {
    if (!selected.has(row.id)) continue;
    const list = rowsByType.get(row.stakeholder_type) ?? [];
    list.push(row);
    rowsByType.set(row.stakeholder_type, list);
  }

  return STAKEHOLDER_DEFINITIONS.flatMap((definition) => {
    const rows = rowsByType.get(definition.key) ?? [];
    if (rows.length === 0) return [];
    return [{ title: definition.title, values: rows.map((r) => r.value) }];
  });
}

function TriggerNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { readOnly, addChildNode, updateNodeData, stakeholderRows } =
    useJourneyContext();
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIds = nodeData.stakeholderIds ?? [];
  const groups = groupSelected(stakeholderRows, selectedIds);

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
        {!readOnly && (
          <>
            <button
              type="button"
              className="nodrag nopan text-sm font-medium text-[#6A35FF] hover:underline"
              onClick={() => setShowPicker(true)}
            >
              {selectedIds.length > 0
                ? "Edit stakeholders"
                : "Choose stakeholders"}
            </button>
            <StakeholderPickerModal
              open={showPicker}
              onOpenChange={setShowPicker}
              stakeholderRows={stakeholderRows}
              selectedIds={selectedIds}
              onSave={(ids) => updateNodeData(id, { stakeholderIds: ids })}
            />
          </>
        )}
      </div>

      {/* Selected stakeholders, grouped by category, comma-separated. */}
      {groups.length > 0 ? (
        <div className="mb-3 flex flex-col gap-0.5">
          {groups.map((group) => (
            <p key={group.title} className="text-xs leading-snug text-gray-700">
              <span className="font-semibold text-gray-500">
                {group.title}:
              </span>{" "}
              {group.values.join(", ")}
            </p>
          ))}
        </div>
      ) : (
        readOnly && <p className="mb-3 text-xs text-gray-400">—</p>
      )}

      <Input
        value={nodeData.content ?? ""}
        placeholder="Type your trigger..."
        readOnly={readOnly}
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
      {!readOnly && (
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
      )}
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeInner);

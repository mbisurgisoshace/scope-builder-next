"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

import type { StakeholderRow } from "@/services/market";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { STAKEHOLDER_DEFINITIONS } from "./Market/constants";

interface StakeholderPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholderRows: StakeholderRow[];
  selectedIds: number[];
  onSave: (ids: number[]) => void;
}

export function StakeholderPickerModal({
  open,
  onOpenChange,
  stakeholderRows,
  selectedIds,
  onSave,
}: StakeholderPickerModalProps) {
  // Draft selection, seeded from the current selection each time the modal opens
  // so a Cancel discards in-modal changes.
  const [draft, setDraft] = useState<Set<number>>(new Set(selectedIds));

  useEffect(() => {
    if (open) setDraft(new Set(selectedIds));
  }, [open, selectedIds]);

  const rowsByType = new Map<string, StakeholderRow[]>();
  for (const row of stakeholderRows) {
    const list = rowsByType.get(row.stakeholder_type) ?? [];
    list.push(row);
    rowsByType.set(row.stakeholder_type, list);
  }

  const toggle = (id: number) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave([...draft]);
    onOpenChange(false);
  };

  const hasAnyRows = stakeholderRows.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-[95vw] max-w-[1400px] gap-0 overflow-hidden p-0 sm:max-w-[1400px]">
        <DialogHeader className="border-b border-[#E5E7EB] p-6">
          <DialogTitle>Choose stakeholders</DialogTitle>
          <DialogDescription>
            Select the stakeholders involved in this trigger. Manage the full
            list on the Market tab.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto bg-[#F7F8FA] p-6">
          {!hasAnyRows ? (
            <p className="text-sm text-[#697288]">
              No stakeholders yet. Add them on the Market tab first, then come
              back to pick them here.
            </p>
          ) : (
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {STAKEHOLDER_DEFINITIONS.map((definition) => {
                const rows = rowsByType.get(definition.key) ?? [];
                return (
                  <div
                    key={definition.key}
                    className="flex min-w-0 flex-col rounded-2xl border border-[#E3E5EC] bg-white p-5"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className="flex size-6 items-center justify-center rounded-md bg-[#F1ECFF] text-[#6A35FF]">
                        <User className="size-3.5" />
                      </span>
                      <h3 className="text-sm font-semibold leading-tight text-[#1F2430]">
                        {definition.title}
                      </h3>
                    </div>

                    <p className="mb-3 text-xs leading-relaxed text-[#697288]">
                      {definition.description}
                    </p>

                    {rows.length === 0 ? (
                      <p className="text-xs text-[#9AA1B2]">None added yet</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {rows.map((row) => (
                          <li key={row.id}>
                            <label className="flex cursor-pointer items-start gap-2 text-sm text-[#374151]">
                              <Checkbox
                                className="mt-0.5"
                                checked={draft.has(row.id)}
                                onCheckedChange={() => toggle(row.id)}
                              />
                              <span className="leading-snug">{row.value}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-[#E5E7EB] p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

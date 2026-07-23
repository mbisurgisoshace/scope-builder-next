"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Plus, User, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  createStakeholderRow,
  deleteStakeholderRow,
  updateStakeholderRow,
  type StakeholderRow,
} from "@/services/market";
import type { StakeholderDefinition } from "./constants";

interface StakeholderCardProps {
  definition: StakeholderDefinition;
  initialRows: StakeholderRow[];
}

// A row being edited. `id` is null until it's been persisted to the DB.
interface EditableRow {
  localKey: string;
  id: number | null;
  value: string;
}

let localKeySeq = 0;
const nextLocalKey = () => `row-${localKeySeq++}`;

export function StakeholderCard({
  definition,
  initialRows,
}: StakeholderCardProps) {
  const [rows, setRows] = useState<EditableRow[]>(() =>
    initialRows.map((r) => ({
      localKey: nextLocalKey(),
      id: r.id,
      value: r.value,
    })),
  );
  const [, startTransition] = useTransition();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [rows.length, updateScrollState]);

  const scrollDown = () => {
    scrollRef.current?.scrollBy({ top: 80, behavior: "smooth" });
  };

  const setRowValue = (localKey: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.localKey === localKey ? { ...r, value } : r)),
    );
  };

  // Persist a row when its input loses focus.
  const commitRow = (localKey: string) => {
    const row = rows.find((r) => r.localKey === localKey);
    if (!row) return;

    const value = row.value.trim();

    // New row left empty — drop it silently.
    if (row.id === null && value === "") {
      setRows((prev) => prev.filter((r) => r.localKey !== localKey));
      return;
    }

    // Existing row cleared out — delete it.
    if (row.id !== null && value === "") {
      const id = row.id;
      setRows((prev) => prev.filter((r) => r.localKey !== localKey));
      startTransition(() => {
        deleteStakeholderRow(id);
      });
      return;
    }

    // New row with content — create and store the returned id.
    if (row.id === null) {
      startTransition(async () => {
        const created = await createStakeholderRow(
          definition.key,
          value,
          rows.length,
        );
        setRows((prev) =>
          prev.map((r) =>
            r.localKey === localKey ? { ...r, id: created.id, value } : r,
          ),
        );
      });
      return;
    }

    // Existing row edited — update.
    const id = row.id;
    startTransition(() => {
      updateStakeholderRow(id, value);
    });
  };

  const removeRow = (localKey: string) => {
    const row = rows.find((r) => r.localKey === localKey);
    setRows((prev) => prev.filter((r) => r.localKey !== localKey));
    if (row?.id != null) {
      const id = row.id;
      startTransition(() => {
        deleteStakeholderRow(id);
      });
    }
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { localKey: nextLocalKey(), id: null, value: "" },
    ]);
  };

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-[#E3E5EC] bg-white p-5">
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

      {/* Always visible — sits above the list and outside the scroll area. */}
      <button
        type="button"
        onClick={addRow}
        className="mb-3 flex w-fit items-center gap-1 text-xs font-semibold text-[#6A35FF] hover:opacity-80"
      >
        <Plus className="size-3.5" />
        Row
      </button>

      {/* Rows scroll when the list grows too long. */}
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex max-h-[168px] flex-col gap-2 overflow-y-auto"
        >
          {rows.map((row) => (
            <div key={row.localKey} className="flex items-center gap-1">
              <Input
                value={row.value}
                autoFocus={row.id === null && row.value === ""}
                onChange={(e) => setRowValue(row.localKey, e.target.value)}
                onBlur={() => commitRow(row.localKey)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                className="h-8 border-[#E3E5EC] text-sm focus-visible:border-[#6A35FF] focus-visible:ring-0"
              />
              <button
                type="button"
                onClick={() => removeRow(row.localKey)}
                className="flex size-6 shrink-0 items-center justify-center rounded text-[#9AA1B2] hover:text-[#6A35FF]"
                aria-label="Remove row"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Fades in when the list overflows and there's more below the fold. */}
        {canScrollDown && (
          <button
            type="button"
            onClick={scrollDown}
            aria-label="Scroll to see more"
            className="absolute inset-x-0 bottom-0 flex h-8 items-end justify-center bg-gradient-to-t from-white to-transparent pb-0.5"
          >
            <ChevronDown className="size-4 text-[#6A35FF]" />
          </button>
        )}
      </div>
    </div>
  );
}

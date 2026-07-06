"use client";

import { GripVertical, Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { DropdownOption } from "./types";

let optionCounter = 0;
function nextOptionId() {
  optionCounter += 1;
  return `opt-new-${optionCounter}-${Date.now()}`;
}

interface DropdownOptionsEditorProps {
  options: DropdownOption[];
  onChange: (options: DropdownOption[]) => void;
}

export function DropdownOptionsEditor({
  options,
  onChange,
}: DropdownOptionsEditorProps) {
  const updateLabel = (id: string, label: string) => {
    onChange(options.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  };

  const removeOption = (id: string) => {
    onChange(options.filter((opt) => opt.id !== id));
  };

  const addOption = () => {
    onChange([...options, { id: nextOptionId(), label: "" }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => (
        <div key={option.id} className="flex items-center gap-2">
          {/* Drag handle — visual only for now (reorder is deferred). */}
          <button
            type="button"
            aria-label="Reorder option"
            className="flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-md text-[#9AA1B1] hover:bg-[#F1F2F6]"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Input
            value={option.label}
            onChange={(e) => updateLabel(option.id, e.target.value)}
            placeholder="Enter dropdown option"
            className="h-9 bg-white"
          />
          <button
            type="button"
            aria-label="Remove option"
            onClick={() => removeOption(option.id)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#9AA1B1] hover:bg-[#F1F2F6] hover:text-[#4B4560]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addOption}
        className={cn(
          "inline-flex w-fit items-center gap-1 pl-10 text-sm font-semibold text-[#6A35FF] hover:underline",
        )}
      >
        <Plus className="h-4 w-4" />
        Add option
      </button>
    </div>
  );
}

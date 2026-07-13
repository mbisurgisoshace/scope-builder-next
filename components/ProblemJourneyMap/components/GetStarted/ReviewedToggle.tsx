"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewedToggleProps {
  reviewed: boolean;
  onToggle: (next: boolean) => void;
}

/**
 * The "Reviewed" affordance used across Get Started cards — a green check pill
 * when reviewed, a hollow circle otherwise. Toggles both ways.
 */
export function ReviewedToggle({ reviewed, onToggle }: ReviewedToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!reviewed)}
      className="flex shrink-0 items-center gap-1.5 text-xs font-medium"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full border transition-colors",
          reviewed
            ? "border-[#28BF58] bg-[#28BF58] text-white"
            : "border-[#C4C5D0] bg-white text-transparent",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className={reviewed ? "text-[#28BF58]" : "text-[#697288]"}>
        Reviewed
      </span>
    </button>
  );
}

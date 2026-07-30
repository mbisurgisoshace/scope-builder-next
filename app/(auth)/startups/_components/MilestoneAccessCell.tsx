"use client";

import { Clock } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { ALWAYS_AVAILABLE_MILESTONE } from "@/lib/milestones";

interface MilestoneAccessCellProps {
  milestone: number;
  available: boolean;
  submittedAt: Date | null;
  disabled?: boolean;
  onToggle: (available: boolean) => void;
}

export default function MilestoneAccessCell({
  milestone,
  available,
  submittedAt,
  disabled,
  onToggle,
}: MilestoneAccessCellProps) {
  const locked = milestone === ALWAYS_AVAILABLE_MILESTONE;

  return (
    // The whole table row switches the active org and navigates away on click,
    // so the cell has to swallow its own clicks.
    <div
      className="flex flex-row items-center justify-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={available}
        disabled={locked || disabled}
        onCheckedChange={onToggle}
        title={
          locked
            ? "Milestone 1 is always available"
            : `Milestone ${milestone} ${available ? "available" : "not available"}`
        }
      />
      <MilestoneStatusIcon submittedAt={submittedAt} />
    </div>
  );
}

/**
 * Only a submitted milestone gets an icon. Making one available says nothing
 * about progress, so the switch alone covers that state and the instructor's eye
 * goes to the rows actually waiting on them.
 *
 * There is no "reviewed" state yet — when the approve flow lands it gets its own
 * colour here, and this clock stops being the end of the line.
 */
function MilestoneStatusIcon({ submittedAt }: { submittedAt: Date | null }) {
  if (submittedAt) {
    return (
      <span title="Pending Review" className="flex">
        <Clock className="size-4 text-[#CA8A04]" />
      </span>
    );
  }

  // Keeps the column width stable for rows without an icon.
  return <span className="size-4" />;
}

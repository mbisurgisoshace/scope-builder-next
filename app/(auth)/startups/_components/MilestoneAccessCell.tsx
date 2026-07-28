"use client";

import { Clock, CheckCircle2 } from "lucide-react";

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
      <MilestoneStatusIcon available={available} submittedAt={submittedAt} />
    </div>
  );
}

function MilestoneStatusIcon({
  available,
  submittedAt,
}: {
  available: boolean;
  submittedAt: Date | null;
}) {
  if (submittedAt) {
    return (
      <span title="Submitted" className="flex">
        <CheckCircle2 className="size-4 text-[#16A34A]" />
      </span>
    );
  }

  if (available) {
    return (
      <span title="Pending submission" className="flex">
        <Clock className="size-4 text-[#CA8A04]" />
      </span>
    );
  }

  // Keeps the column width stable for rows without an icon.
  return <span className="size-4" />;
}

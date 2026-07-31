"use client";

import { Hourglass } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import { ALWAYS_AVAILABLE_MILESTONE } from "@/lib/milestones";

interface MilestoneAccessCellProps {
  milestone: number;
  available: boolean;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  disabled?: boolean;
  onToggle: (available: boolean) => void;
  onReview: () => void;
}

export default function MilestoneAccessCell({
  milestone,
  available,
  submittedAt,
  reviewedAt,
  disabled,
  onToggle,
  onReview,
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
      <MilestoneStatusIcon
        submittedAt={submittedAt}
        reviewedAt={reviewedAt}
        onReview={onReview}
      />
    </div>
  );
}

/**
 * Only a submitted milestone gets an icon. Making one available says nothing
 * about progress, so the switch alone covers that state and the instructor's eye
 * goes to the rows actually waiting on them.
 *
 * Amber hourglass = handed in, waiting on the instructor; click it to sign the
 * milestone off and it turns green. Signing off is one-way (`reviewMilestone`
 * returns the existing date rather than bumping it), so the green icon is inert.
 */
function MilestoneStatusIcon({
  submittedAt,
  reviewedAt,
  onReview,
}: {
  submittedAt: Date | null;
  reviewedAt: Date | null;
  onReview: () => void;
}) {
  if (reviewedAt) {
    return (
      <span title="Reviewed" className="flex">
        <Hourglass className="size-4 text-[#16A34A]" />
      </span>
    );
  }

  if (submittedAt) {
    return (
      <button
        type="button"
        title="Pending Review — click to mark as Reviewed"
        onClick={onReview}
        className="flex cursor-pointer"
      >
        <Hourglass className="size-4 text-[#CA8A04]" />
      </button>
    );
  }

  // Keeps the column width stable for rows without an icon.
  return <span className="size-4" />;
}

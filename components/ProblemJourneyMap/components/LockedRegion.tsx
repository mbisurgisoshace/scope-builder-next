"use client";

import React from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { milestoneLabel, subStepLabel } from "@/lib/milestones";

const BADGE_CLASS =
  "inline-flex items-center gap-1.5 rounded-full bg-[#F1ECFF] px-2.5 py-1 text-xs font-semibold text-[#6A35FF]";

/**
 * A chip announcing which milestone opens the region it sits in. Rendered beside
 * the section heading rather than over the content, so the locked section stays
 * readable underneath.
 */
export function LockBadge({ milestone }: { milestone: number }) {
  return (
    <span className={BADGE_CLASS}>
      <Lock className="size-3 shrink-0" />
      Available in Milestone {milestone}: {milestoneLabel(milestone)}
    </span>
  );
}

/**
 * Same chip for the finer gates, which hang off a sub-step rather than a whole
 * milestone. Phrased as the action the team has to take — the sub-step is one
 * of their own "Reviewed" toggles on the Instructions tab, not something an
 * instructor grants.
 */
export function SubStepLockBadge({ subStep }: { subStep: string }) {
  return (
    <span className={BADGE_CLASS}>
      <Lock className="size-3 shrink-0" />
      Complete {subStepLabel(subStep)} to unlock
    </span>
  );
}

/**
 * Wraps a region that exists but can't be worked on yet: dimmed, inert to the
 * pointer, and skipped by tab focus.
 *
 * `pointer-events-none` alone would still leave the inputs inside reachable by
 * keyboard, so every consumer *also* passes `readOnly` down to its fields — this
 * is the visual half of the gate, never the whole of it.
 */
export function LockedRegion({
  locked,
  children,
  className,
}: {
  locked: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!locked) return <div className={className}>{children}</div>;

  return (
    <div
      aria-disabled
      inert
      className={cn("pointer-events-none opacity-50 grayscale", className)}
    >
      {children}
    </div>
  );
}

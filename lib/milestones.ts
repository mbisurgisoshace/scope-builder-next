/**
 * The 5 milestones are defined (labels, sub-steps, progress) in
 * `components/ProblemJourneyMap/components/MilestoneHeader.tsx`. This module only
 * carries what the per-startup unlock state needs — kept out of
 * `services/milestoneAccess.ts` because "use server" modules may only export
 * async functions.
 */

export const MILESTONE_COUNT = 5;

export const MILESTONE_NUMBERS = [1, 2, 3, 4, 5] as const;

/** Milestone 1 ships unlocked for every startup and cannot be turned off. */
export const ALWAYS_AVAILABLE_MILESTONE = 1;

export type MilestoneAccessState = {
  milestone: number;
  available: boolean;
  submittedAt: Date | null;
};

/** Access for a startup with no rows yet: milestone 1 on, the rest off. */
export function defaultMilestoneAccess(): MilestoneAccessState[] {
  return MILESTONE_NUMBERS.map((milestone) => ({
    milestone,
    available: milestone === ALWAYS_AVAILABLE_MILESTONE,
    submittedAt: null,
  }));
}

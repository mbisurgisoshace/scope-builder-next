/**
 * The 5 milestones and their 21 sub-steps — the single source of truth for the
 * curriculum. `MilestoneHeader.tsx` renders from here, and the seeded "steps"
 * Get Started card mirrors it (one item per sub-step, linked by position).
 *
 * This module is deliberately data-only and free of React/lucide imports:
 * `services/milestoneAccess.ts` is a `"use server"` module (which may only export
 * async functions) and imports it, so sub-step icons live in `MilestoneHeader`.
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

/** Milestone titles, indexed by milestone number - 1. */
export const MILESTONE_LABELS = [
  "User, their Journey & Market",
  "Deep Dive into Journey",
  "Interview Preparation",
  "Conduct Interviews",
  "Analyze & Present Findings",
] as const;

export type SubStepDef = {
  /** Stable identity, `${milestone}.${position}` — e.g. "1.1". */
  key: string;
  /** 1..5. */
  milestone: number;
  /** 1-based position within the milestone. */
  position: number;
  /** Display label, numbering included — e.g. "1.1 Visualize User Journey". */
  label: string;
};

export function subStepKey(milestone: number, position: number) {
  return `${milestone}.${position}`;
}

/**
 * Sub-step labels per milestone, in order. A sub-step's identity is its position
 * here, so appending is safe but reordering/removing re-points existing progress.
 */
const SUB_STEP_LABELS: string[][] = [
  [
    "Visualize User Journey",
    "Stakeholders",
    "Segments & Beachhead",
    "Instructor Check-in / Review Journey & Market",
    "Interviewee List",
  ],
  [
    "Identify Jobs/Pains/Gains",
    "Expand on Pains/Gains",
    "Source & Confidence Score",
    "Instructor Check-in / Review Journey Details",
    "Schedule Interviews",
  ],
  [
    "Hypotheses",
    "Interview Questions",
    "Instructor Check-in / Review Hypotheses & Questions",
    "Practice Interview",
  ],
  [
    "Conduct & Document 5",
    "Instructor Check-in / Review Interview Progress",
    "Conduct & Document 5 more",
  ],
  [
    "Conduct & Document 5+ more",
    "Instructor Check-in / Review Interview Progress",
    "Practice Presentation",
    "Final Presentation",
  ],
];

/** All 21 sub-steps, milestone 1 first. */
export const SUB_STEPS: SubStepDef[] = SUB_STEP_LABELS.flatMap(
  (labels, milestoneIndex) =>
    labels.map((label, labelIndex) => {
      const milestone = milestoneIndex + 1;
      const position = labelIndex + 1;
      return {
        key: subStepKey(milestone, position),
        milestone,
        position,
        label: `${milestone}.${position} ${label}`,
      };
    }),
);

export function subStepsForMilestone(milestone: number): SubStepDef[] {
  return SUB_STEPS.filter((subStep) => subStep.milestone === milestone);
}

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

/** Milestone that unlocks the evidence controls in the Problem/Solution sheet:
 * the type + pain-or-gain classification, the hypothesis toggle, the answer
 * source and the confidence rating. */
export const EVIDENCE_MILESTONE = 2;

export type MilestoneAccessState = {
  milestone: number;
  available: boolean;
  submittedAt: Date | null;
  /** When an instructor signed the milestone off. One-way — never cleared. */
  reviewedAt: Date | null;
};

/** Access for a startup with no rows yet: milestone 1 on, the rest off. */
export function defaultMilestoneAccess(): MilestoneAccessState[] {
  return MILESTONE_NUMBERS.map((milestone) => ({
    milestone,
    available: milestone === ALWAYS_AVAILABLE_MILESTONE,
    submittedAt: null,
    reviewedAt: null,
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
  /** Shown when the sub-step is expanded on the Instructions steps card. */
  description: string;
};

export function subStepKey(milestone: number, position: number) {
  return `${milestone}.${position}`;
}

/**
 * Sub-step content per milestone, in order. A sub-step's identity is its
 * position here, so appending is safe but reordering/removing re-points existing
 * progress.
 *
 * Descriptions are placeholder copy — they're seeded onto GetStartedItem by
 * prisma/seedSteps.ts and shown when a sub-step is expanded on the Instructions
 * steps card. Rewrite them here and re-run the seed, not in the database.
 */
const SUB_STEP_CONTENT: { label: string; description: string }[][] = [
  [
    {
      label: "Visualize User Journey",
      description:
        "Map every step your user takes, from first noticing the problem to living with a solution. Keep it to the path you can actually observe today.",
    },
    {
      label: "Stakeholders",
      description:
        "List everyone who touches that journey — users, buyers, approvers, blockers — and note where each one enters and what they care about.",
    },
    {
      label: "Segments & Beachhead",
      description:
        "Group your users into segments and pick the one narrow beachhead you'll pursue first. Say out loud why the others can wait.",
    },
    {
      label: "Instructor Check-in / Review Journey & Market",
      description:
        "Walk your instructor through the journey and the beachhead you chose. Expect to defend the segment you picked and the ones you set aside.",
    },
    {
      label: "Interviewee List",
      description:
        "Build a list of real people in your beachhead segment you can reach. Names and how you'll contact them — not job titles in the abstract.",
    },
  ],
  [
    {
      label: "Identify Jobs/Pains/Gains",
      description:
        "For each step of the journey, capture the job the user is trying to get done, what hurts along the way, and what a win looks like.",
    },
    {
      label: "Expand on Pains/Gains",
      description:
        "Go a level deeper on the pains and gains that matter most. Vague pains produce vague interviews later.",
    },
    {
      label: "Source & Confidence Score",
      description:
        "Mark where each pain and gain came from and how sure you are. Anything sourced only from your own assumptions is what interviews should target first.",
    },
    {
      label: "Instructor Check-in / Review Journey Details",
      description:
        "Review the detailed journey with your instructor and agree on which assumptions are the riskiest.",
    },
    {
      label: "Schedule Interviews",
      description:
        "Turn your interviewee list into booked calls. Aim for more slots than you need — some will fall through.",
    },
  ],
  [
    {
      label: "Hypotheses",
      description:
        "Write the beliefs your business depends on as testable statements, so an interview can actually prove one wrong.",
    },
    {
      label: "Interview Questions",
      description:
        "Draft open questions about what people have already done, not what they would hypothetically do. Tie each question back to a hypothesis.",
    },
    {
      label: "Instructor Check-in / Review Hypotheses & Questions",
      description:
        "Review your hypotheses and question set with your instructor before you spend real interviews on them.",
    },
    {
      label: "Practice Interview",
      description:
        "Run a full practice interview with someone outside your team. You're testing your questions, not their answers.",
    },
  ],
  [
    {
      label: "Conduct & Document 5",
      description:
        "Run your first five interviews and write each one up while it's fresh. Capture what they said, not your interpretation of it.",
    },
    {
      label: "Instructor Check-in / Review Interview Progress",
      description:
        "Share early findings with your instructor and adjust your questions before the next batch.",
    },
    {
      label: "Conduct & Document 5 more",
      description:
        "Run five more interviews with the sharpened questions, and watch for answers that repeat across people.",
    },
  ],
  [
    {
      label: "Conduct & Document 5+ more",
      description:
        "Keep interviewing until new conversations stop surprising you. Document each one the same way as the first.",
    },
    {
      label: "Instructor Check-in / Review Interview Progress",
      description:
        "Review the full body of interviews with your instructor and decide which hypotheses survived.",
    },
    {
      label: "Practice Presentation",
      description:
        "Rehearse your findings end to end. Lead with what you learned that you didn't expect.",
    },
    {
      label: "Final Presentation",
      description:
        "Present your journey, your evidence, and what you'd do next — with the interviews backing every claim.",
    },
  ],
];

/** All 21 sub-steps, milestone 1 first. */
export const SUB_STEPS: SubStepDef[] = SUB_STEP_CONTENT.flatMap(
  (subSteps, milestoneIndex) =>
    subSteps.map((subStep, subStepIndex) => {
      const milestone = milestoneIndex + 1;
      const position = subStepIndex + 1;
      return {
        key: subStepKey(milestone, position),
        milestone,
        position,
        label: `${milestone}.${position} ${subStep.label}`,
        description: subStep.description,
      };
    }),
);

export function subStepsForMilestone(milestone: number): SubStepDef[] {
  return SUB_STEPS.filter((subStep) => subStep.milestone === milestone);
}

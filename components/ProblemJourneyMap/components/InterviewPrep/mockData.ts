import type { ProblemBlock } from "./types";

/**
 * Hardcoded seed reproducing the Interview Prep design. This stands in for the
 * dynamic data source until the persistence layer is wired up.
 */
export const MOCK_PROBLEM_BLOCKS: ProblemBlock[] = [
  {
    id: "problem-1",
    label: "Problem",
    description:
      "The icon of the app is very similar to google services' icons, users struggle with finding it",
    tags: ["Functional", "Pain"],
    answeredCount: 2,
    totalCount: 3,
    hypotheses: [
      {
        id: "hyp-1",
        index: 1,
        prompt: "Who's experiencing it?",
        answer: "Everyone",
        source: "Shared personally",
        confidence: 4,
        question: {
          id: "q-1",
          title: "Do you experience this issue personally?",
          authored: true,
          responseType: "text",
          options: [],
        },
      },
      {
        id: "hyp-2",
        index: 2,
        prompt: "What is the problem with this step?",
        answer: "Users can't find the icon, this reduces motivation",
        source: "Shared personally",
        confidence: 4,
        question: {
          id: "q-2",
          title: "",
          authored: false,
          responseType: "scale",
          options: [],
        },
      },
      {
        id: "hyp-3",
        index: 3,
        prompt: "What are the consequences of this problem not being solved?",
        answer: "Constant usage will significantly drop over time",
        source: "Shared personally",
        confidence: 1,
        question: {
          id: "q-3",
          title: "",
          authored: false,
          responseType: "dropdown",
          options: [
            { id: "opt-1", label: "Yes" },
            { id: "opt-2", label: "No" },
            { id: "opt-3", label: "" },
          ],
        },
      },
    ],
  },
  {
    id: "problem-2",
    label: "Problem",
    description:
      "Users are not sure which plan to pick during onboarding, so they abandon the flow",
    tags: ["Functional", "Emotional"],
    answeredCount: 0,
    totalCount: 2,
    hypotheses: [
      {
        id: "hyp-4",
        index: 1,
        prompt: "Who's experiencing it?",
        answer: "New users during onboarding",
        source: "Interview",
        confidence: 3,
        question: {
          id: "q-4",
          title: "",
          authored: false,
          responseType: "text",
          options: [],
        },
      },
      {
        id: "hyp-5",
        index: 2,
        prompt: "What is the problem with this step?",
        answer: "Plan differences are unclear at the decision point",
        source: "Interview",
        confidence: 2,
        question: {
          id: "q-5",
          title: "",
          authored: false,
          responseType: "scale",
          options: [],
        },
      },
    ],
  },
];

export type ResponseType = "text" | "scale" | "dropdown";

export interface DropdownOption {
  id: string;
  label: string;
}

export interface InterviewQuestion {
  id: string;
  /** The interview question the user is authoring. Empty string = not yet written. */
  title: string;
  /**
   * Whether the question has been committed/authored. Authored questions render
   * as static text; the rest render as an editable input. Kept independent of
   * `title` so typing doesn't flip the field out from under the cursor.
   */
  authored: boolean;
  responseType: ResponseType;
  /** Only meaningful when responseType === "dropdown". */
  options: DropdownOption[];
}

export interface Hypothesis {
  id: string;
  /** 1-based position shown in the UI ("1.", "2.", ...). */
  index: number;
  /** The problem-statement prompt, e.g. "Who's experiencing it?" */
  prompt: string;
  /** The user's answer to the prompt, e.g. "Everyone". */
  answer: string;
  /** Where the answer came from, e.g. "Shared personally". */
  source: string;
  /** Confidence out of 5. Display-only for now. */
  confidence: number;
  question: InterviewQuestion;
}

export interface ProblemBlock {
  id: string;
  /** Pill label, e.g. "Problem". */
  label: string;
  description: string;
  /** Classification tags, e.g. ["Functional", "Pain"]. */
  tags: string[];
  answeredCount: number;
  totalCount: number;
  hypotheses: Hypothesis[];
}

"use client";

import { ActionLabel } from "@/components/ProblemJourneyMap/components/InterviewPrep/ActionLabel";

import { AnswerInput } from "./AnswerInput";
import type { AnswerableProblem } from "./types";

/**
 * Narrowest a question tile is allowed to get. `auto-fill` packs as many of these
 * as the card's own width allows — so the column count follows the card rather
 * than the viewport, and survives a sidebar opening beside it.
 */
const QUESTION_MIN_WIDTH = "17rem";

interface ProblemAnswerCardProps {
  problem: AnswerableProblem;
  onAnswerChange: (questionId: string, value: string) => void;
  onAnswerCommit: (questionId: string, value?: string) => void;
  readOnly?: boolean;
}

/**
 * One problem as a single card: a grey summary band across the top, and every
 * question for that problem tiled beneath it in a responsive grid.
 */
export function ProblemAnswerCard({
  problem,
  onAnswerChange,
  onAnswerCommit,
  readOnly = false,
}: ProblemAnswerCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E4E5ED] bg-white">
      {/* Problem summary — read-only; it's authored on the journey map. Full-bleed
          so the band reads as the card's header rather than a nested block. */}
      <div className="bg-[#F5F5F8] px-5 py-4">
        {/* The action this problem hangs off — context only, so it sits above
            the pill rather than competing with the problem itself. */}
        <ActionLabel action={problem.action} className="mb-2" />
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#F0E4C9] bg-[#FBF3DE] px-2.5 py-0.5 text-xs font-medium text-[#8A6D1E]">
            {problem.label}
          </span>
          {problem.tags.length > 0 && (
            <ul className="flex flex-wrap items-center justify-end gap-3 text-xs text-[#4B4560]">
              {problem.tags.map((tag) => (
                <li key={tag} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-[#4B4560]" />
                  <span className="font-semibold">{tag}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-3 text-sm text-[#1F2430]">{problem.description}</p>
      </div>

      <div
        className="grid gap-4 p-5"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(${QUESTION_MIN_WIDTH}, 100%), 1fr))`,
        }}
      >
        {problem.questions.map((question) => (
          <div
            key={question.questionId}
            className="flex flex-col gap-3 rounded-lg bg-[#F5F5F8] p-4"
          >
            <div className="flex gap-2">
              <span className="text-sm font-medium text-[#6A35FF]">
                {question.index}
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-[#1F2430]">
                {question.title}
              </p>
            </div>
            {/* Grid cells stretch to the tallest tile in their row, so pushing the
                input down keeps every answer in a row on the same line even when
                the questions above them wrap to different heights. */}
            <div className="mt-auto">
              <AnswerInput
                question={question}
                value={question.answer}
                readOnly={readOnly}
                onChange={(value) => onAnswerChange(question.questionId, value)}
                onCommit={(value) => onAnswerCommit(question.questionId, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

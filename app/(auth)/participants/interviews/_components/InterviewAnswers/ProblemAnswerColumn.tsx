"use client";

import { AnswerInput } from "./AnswerInput";
import type { AnswerableProblem } from "./types";

interface ProblemAnswerColumnProps {
  problem: AnswerableProblem;
  onAnswerChange: (questionId: string, value: string) => void;
  onAnswerCommit: (questionId: string, value?: string) => void;
}

export function ProblemAnswerColumn({
  problem,
  onAnswerChange,
  onAnswerCommit,
}: ProblemAnswerColumnProps) {
  return (
    <div className="flex w-full flex-col">
      {/* Problem summary — read-only; it's authored on the journey map. */}
      <div className="rounded-lg bg-[#F5F5F8] p-4">
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

      <div className="mt-6 flex flex-col gap-6">
        {problem.questions.map((question) => (
          <div key={question.questionId} className="flex gap-3">
            <span className="mt-2 w-4 shrink-0 text-sm font-medium text-[#6A35FF]">
              {question.index}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <p className="text-sm font-medium text-[#1F2430]">
                {question.title}
              </p>
              <AnswerInput
                question={question}
                value={question.answer}
                onChange={(value) => onAnswerChange(question.questionId, value)}
                onCommit={(value) => onAnswerCommit(question.questionId, value)}
              />
            </div>
          </div>
        ))}

        {/* Inert for now, matching the prep tab's "Add custom question". */}
        <div className="flex gap-3">
          <span className="w-4 shrink-0 text-sm font-medium text-[#B7BAC5]">
            {problem.questions.length + 1}
          </span>
          <span className="text-sm font-medium text-[#6A35FF]">
            + Add question
          </span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowRight } from "lucide-react";

import { QuestionEditor } from "./QuestionEditor";
import type { Hypothesis, InterviewQuestion } from "./types";

interface HypothesisRowProps {
  hypothesis: Hypothesis;
  onQuestionChange: (patch: Partial<InterviewQuestion>) => void;
  onQuestionCommit: (patch?: Partial<InterviewQuestion>) => void;
}

export function HypothesisRow({
  hypothesis,
  onQuestionChange,
  onQuestionCommit,
}: HypothesisRowProps) {
  return (
    <div className="relative grid grid-cols-2">
      {/* Left: the hypothesis (read-only). */}
      <div className="flex gap-3 border-r border-[#E5E7EF] px-6 py-6 pr-10">
        <span className="text-sm font-bold text-[#1F2430]">
          {hypothesis.index}.
        </span>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-[#697288]">{hypothesis.prompt}</p>
            <p className="text-sm font-semibold text-[#1F2430]">
              {hypothesis.answer}
            </p>
          </div>
          <div className="flex flex-col gap-1 text-xs text-[#697288]">
            <span>
              Source:{" "}
              <span className="font-semibold text-[#4B4560]">
                {hypothesis.source}
              </span>
            </span>
            <span>
              Your confidence:{" "}
              <span className="font-semibold text-[#4B4560]">
                {hypothesis.confidence}/5
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: the interview question editor. */}
      <div className="px-6 py-6 pl-10">
        <QuestionEditor
          question={hypothesis.question}
          onChange={onQuestionChange}
          onCommit={onQuestionCommit}
        />
      </div>

      {/* Center connector — green circular arrow straddling the divider. */}
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-700">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

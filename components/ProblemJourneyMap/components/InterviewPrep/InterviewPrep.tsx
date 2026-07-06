"use client";

import { useState } from "react";

import { ProblemCard } from "./ProblemCard";
import { MOCK_PROBLEM_BLOCKS } from "./mockData";
import type { InterviewQuestion, ProblemBlock } from "./types";

export function InterviewPrep() {
  const [blocks, setBlocks] = useState<ProblemBlock[]>(MOCK_PROBLEM_BLOCKS);

  const handleQuestionChange = (
    blockId: string,
    hypothesisId: string,
    patch: Partial<InterviewQuestion>,
  ) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id !== blockId
          ? block
          : {
              ...block,
              hypotheses: block.hypotheses.map((hyp) =>
                hyp.id !== hypothesisId
                  ? hyp
                  : { ...hyp, question: { ...hyp.question, ...patch } },
              ),
            },
      ),
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-[#1F2430]">
            What you will ask
          </h2>
          <p className="max-w-3xl text-xs text-[#697288]">
            You have your answers to the problem statement questions that should
            be validated through user testing. Transform them into actual
            interview questions that will help determine whether your assumptions
            are valid.
          </p>
        </header>

        {blocks.map((block) => (
          <ProblemCard
            key={block.id}
            block={block}
            onQuestionChange={(hypothesisId, patch) =>
              handleQuestionChange(block.id, hypothesisId, patch)
            }
          />
        ))}
      </div>
    </div>
  );
}

"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import { HypothesisRow } from "./HypothesisRow";
import type { InterviewQuestion, ProblemBlock } from "./types";

interface ProblemCardProps {
  block: ProblemBlock;
  onQuestionChange: (
    hypothesisId: string,
    patch: Partial<InterviewQuestion>,
  ) => void;
  onQuestionCommit: (
    hypothesisId: string,
    patch?: Partial<InterviewQuestion>,
  ) => void;
  readOnly?: boolean;
}

export function ProblemCard({
  block,
  onQuestionChange,
  onQuestionCommit,
  readOnly = false,
}: ProblemCardProps) {
  const totalCount = block.hypotheses.length;
  const answeredCount = block.hypotheses.filter((h) =>
    h.question.title.trim(),
  ).length;

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex">
        {/* Left column — the problem summary (read-only). */}
        <aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-[#CFD3E0] px-6 py-6">
          <span className="inline-flex w-fit items-center rounded-full border border-[#E0CDA1] bg-[#FBF3DE] px-2.5 py-0.5 text-sm font-medium text-[#6F5615]">
            {block.label}
          </span>
          <p className="text-base text-[#1F2430]">{block.description}</p>
          {block.tags.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2">
              {block.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-[#F1ECFF] px-2.5 py-0.5 text-sm font-medium text-[#6A35FF]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
          {/* <p className="text-sm font-bold text-[#1F2430]">
            {answeredCount}/{totalCount}{" "}
            <span className="font-normal text-[#697288]">Questions</span>
          </p> */}
        </aside>

        {/* Right area — hypothesis / interview-question rows. */}
        <div className="min-w-0 flex-1">
          {/* Column headers. */}
          <div className="grid grid-cols-2 border-b border-[#CFD3E0]">
            <span className="border-r border-[#CFD3E0] px-6 py-3 text-base text-[#4E5566]">
              Hypothesis
            </span>
            <span className="px-6 py-3 text-right text-base text-[#4E5566]">
              Interview question
            </span>
          </div>

          {block.hypotheses.map((hypothesis, i) => (
            <div
              key={hypothesis.id}
              className={
                i < block.hypotheses.length - 1
                  ? "border-b border-[#CFD3E0]"
                  : undefined
              }
            >
              <HypothesisRow
                hypothesis={hypothesis}
                readOnly={readOnly}
                onQuestionChange={(patch) =>
                  onQuestionChange(hypothesis.id, patch)
                }
                onQuestionCommit={(patch) =>
                  onQuestionCommit(hypothesis.id, patch)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Add custom question — centered dark pill at the bottom. */}
      {!readOnly && (
        <div className="flex justify-center py-5">
          <Button className="rounded-full bg-[#1F2430] px-5 text-white hover:bg-[#2B3140]">
            <Plus className="h-4 w-4" />
            Add custom question
          </Button>
        </div>
      )}
    </div>
  );
}

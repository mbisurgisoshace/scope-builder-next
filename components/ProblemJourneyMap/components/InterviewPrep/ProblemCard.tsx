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
}

export function ProblemCard({ block, onQuestionChange }: ProblemCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex">
        {/* Left column — the problem summary (read-only). */}
        <aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-[#E5E7EF] px-6 py-6">
          <span className="inline-flex w-fit items-center rounded-full border border-[#F0E4C9] bg-[#FBF3DE] px-2.5 py-0.5 text-xs font-medium text-[#8A6D1E]">
            {block.label}
          </span>
          <p className="text-sm text-[#1F2430]">{block.description}</p>
          {block.tags.length > 0 && (
            <ul className="flex flex-col gap-1 text-xs text-[#4B4560]">
              {block.tags.map((tag) => (
                <li key={tag} className="flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-[#4B4560]" />
                  <span className="font-semibold">{tag}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-sm font-bold text-[#1F2430]">
            {block.answeredCount}/{block.totalCount}{" "}
            <span className="font-normal text-[#697288]">Questions</span>
          </p>
        </aside>

        {/* Right area — hypothesis / interview-question rows. */}
        <div className="min-w-0 flex-1">
          {/* Column headers. */}
          <div className="grid grid-cols-2 border-b border-[#E5E7EF]">
            <span className="border-r border-[#E5E7EF] px-6 py-3 text-sm text-[#697288]">
              Hypothesis
            </span>
            <span className="px-6 py-3 text-right text-sm text-[#697288]">
              Interview question
            </span>
          </div>

          {block.hypotheses.map((hypothesis, i) => (
            <div
              key={hypothesis.id}
              className={
                i < block.hypotheses.length - 1
                  ? "border-b border-[#E5E7EF]"
                  : undefined
              }
            >
              <HypothesisRow
                hypothesis={hypothesis}
                onQuestionChange={(patch) =>
                  onQuestionChange(hypothesis.id, patch)
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Add custom question — centered dark pill at the bottom. */}
      <div className="flex justify-center py-5">
        <Button className="rounded-full bg-[#1F2430] px-5 text-white hover:bg-[#2B3140]">
          <Plus className="h-4 w-4" />
          Add custom question
        </Button>
      </div>
    </div>
  );
}

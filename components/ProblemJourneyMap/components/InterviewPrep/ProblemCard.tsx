"use client";

import { ActionLabel } from "./ActionLabel";
import { HypothesisRow } from "./HypothesisRow";
import type { InterviewQuestionDraft, ProblemBlock } from "./types";

interface ProblemCardProps {
  block: ProblemBlock;
  onQuestionCreate: (
    hypothesisId: string,
    value: InterviewQuestionDraft,
  ) => Promise<void>;
  onQuestionUpdate: (
    hypothesisId: string,
    id: string,
    value: InterviewQuestionDraft,
  ) => Promise<void>;
  onQuestionDelete: (hypothesisId: string, id: string) => Promise<void>;
  readOnly?: boolean;
}

export function ProblemCard({
  block,
  onQuestionCreate,
  onQuestionUpdate,
  onQuestionDelete,
  readOnly = false,
}: ProblemCardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex">
        {/* Left column — the problem summary (read-only). */}
        <aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-[#CFD3E0] px-6 py-6">
          {/* The action this problem hangs off — context only, so it sits above
              the pill rather than competing with the problem itself. */}
          <ActionLabel action={block.action} className="-mb-2" />
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
                onQuestionCreate={(value) =>
                  onQuestionCreate(hypothesis.id, value)
                }
                onQuestionUpdate={(id, value) =>
                  onQuestionUpdate(hypothesis.id, id, value)
                }
                onQuestionDelete={(id) => onQuestionDelete(hypothesis.id, id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

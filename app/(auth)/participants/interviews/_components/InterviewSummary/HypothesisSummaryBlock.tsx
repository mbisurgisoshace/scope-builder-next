"use client";

import type { SummaryHypothesis } from "./types";

/**
 * Narrowest a question tile is allowed to get. `auto-fill` packs as many of these as the
 * card's own width allows — so the column count follows the card rather than the viewport,
 * and survives the summary panel taking its gutter beside it.
 */
const QUESTION_MIN_WIDTH = "17rem";

interface HypothesisSummaryBlockProps {
  hypothesis: SummaryHypothesis;
}

/**
 * One hypothesis of a problem, with every interview question written against it tiled
 * beneath the prompt and each tile listing who said what.
 */
export function HypothesisSummaryBlock({ hypothesis }: HypothesisSummaryBlockProps) {
  return (
    <div className="flex flex-col gap-4 p-5">
      <div className="flex gap-2">
        <span className="text-sm font-medium text-[#6A35FF]">
          {hypothesis.index}
        </span>
        <p className="min-w-0 flex-1 text-sm font-medium text-[#1F2430]">
          {hypothesis.prompt}
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(${QUESTION_MIN_WIDTH}, 100%), 1fr))`,
        }}
      >
        {hypothesis.questions.map((question) => (
          <div
            key={question.questionId}
            // No bottom-aligned input to keep in line here, so a tile is only as tall as
            // the answers it holds — `items-start` rather than the answering view's stretch.
            className="flex h-fit flex-col gap-3 self-start rounded-lg bg-[#F5F5F8] p-4"
          >
            <div className="flex gap-2">
              <span className="text-sm font-medium text-[#6A35FF]">
                {question.index}
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-[#1F2430]">
                {question.title}
              </p>
            </div>

            {question.answers.length === 0 ? (
              <p className="text-sm italic text-[#9AA0B0]">No answers yet</p>
            ) : (
              <dl className="divide-y divide-[#E4E5ED]">
                {question.answers.map((answer) => (
                  <div key={answer.participantId} className="py-2 first:pt-0 last:pb-0">
                    <dt className="text-xs font-semibold text-[#4E5566]">
                      {answer.participantName}
                    </dt>
                    {/* Answers are typed in free-form, so long ones wrap rather than
                        stretching the tile past its column. */}
                    <dd className="mt-0.5 text-sm break-words text-[#1F2430]">
                      {answer.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

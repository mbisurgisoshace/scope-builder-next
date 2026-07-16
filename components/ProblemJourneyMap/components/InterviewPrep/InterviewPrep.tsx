"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Loader } from "@/components/ui/loader";
import {
  getInterviewPrepData,
  upsertProblemInterviewQuestion,
} from "@/services/interviewPrep";

import { ProblemCard } from "./ProblemCard";
import type { InterviewQuestion, ProblemBlock } from "./types";

export function InterviewPrep() {
  const [blocks, setBlocks] = useState<ProblemBlock[] | null>(null);

  // Mirrors `blocks` so a commit always persists the latest value rather than whatever
  // the handler closed over before the last keystroke.
  const blocksRef = useRef<ProblemBlock[] | null>(null);
  blocksRef.current = blocks;

  // Problems come from the journey-map canvas, which is org-wide, so load once on mount.
  useEffect(() => {
    let active = true;
    getInterviewPrepData().then((result) => {
      if (active) setBlocks(result);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleQuestionChange = useCallback(
    (blockId: string, hypothesisId: string, patch: Partial<InterviewQuestion>) => {
      setBlocks((prev) =>
        (prev ?? []).map((block) =>
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
    },
    [],
  );

  const handleQuestionCommit = useCallback(
    (
      blockId: string,
      hypothesisId: string,
      patch?: Partial<InterviewQuestion>,
    ) => {
      const block = blocksRef.current?.find((b) => b.id === blockId);
      const hypothesis = block?.hypotheses.find((h) => h.id === hypothesisId);
      if (!block || !hypothesis) return;

      // A caller that commits in the same tick as its edit hasn't re-rendered yet, so
      // the patch — not the ref — carries the new value.
      const question = { ...hypothesis.question, ...patch };

      void upsertProblemInterviewQuestion({
        nodeId: block.nodeId,
        problemId: block.id,
        bankQuestionId: hypothesis.bankQuestionId,
        title: question.title,
        responseType: question.responseType,
        options: question.options,
      });
    },
    [],
  );

  if (!blocks) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

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

        {blocks.length === 0 ? (
          <div className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm">
            <h3 className="text-base font-semibold text-[#1F2430]">
              Nothing to prepare yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-xs text-[#697288]">
              Open an action card on the Canvas, describe its problem, then mark the
              questions you want to validate as hypotheses. They will show up here.
            </p>
          </div>
        ) : (
          blocks.map((block) => (
            <ProblemCard
              key={block.id}
              block={block}
              onQuestionChange={(hypothesisId, patch) =>
                handleQuestionChange(block.id, hypothesisId, patch)
              }
              onQuestionCommit={(hypothesisId, patch) =>
                handleQuestionCommit(block.id, hypothesisId, patch)
              }
            />
          ))
        )}
      </div>
    </div>
  );
}

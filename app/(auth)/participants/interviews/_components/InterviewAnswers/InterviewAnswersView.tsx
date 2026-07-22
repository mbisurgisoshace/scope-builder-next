"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import type { Participant } from "@/lib/generated/prisma";
import {
  getInterviewAnswersData,
  upsertProblemInterviewAnswer,
} from "@/services/interviewPrep";

import { ProblemAnswerColumn } from "./ProblemAnswerColumn";
import type { AnswerableProblem } from "./types";

interface InterviewAnswersViewProps {
  participant: Participant;
  onBack: () => void;
  onSaved: () => void;
}

function InterviewHeader({
  participant,
  onBack,
  onSave,
}: {
  participant: Participant;
  onBack: () => void;
  onSave: () => void;
}) {
  const roles =
    participant.role
      ?.split(",")
      .map((r) => r.trim())
      .filter(Boolean) ?? [];

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to interviews"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white hover:bg-gray-100"
        >
          <ChevronLeftIcon size={18} className="text-gray-500" />
        </button>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium text-[#70747D]">Interview</span>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-[#111827]">
              {participant.name}
            </h1>
            {roles.map((role) =>
              // Payer is the interview this whole page counts, so it gets a green
              // "done"-style badge; other roles stay neutral.
              role.toLowerCase() === "payer" ? (
                <Badge
                  key={role}
                  className="gap-1 rounded-full bg-green-100 text-green-700"
                >
                  <Check className="size-3" />
                  {role}
                </Badge>
              ) : (
                <Badge
                  key={role}
                  className="rounded-full bg-[#EEEFF5] text-[#111827]"
                >
                  {role}
                </Badge>
              ),
            )}
          </div>
        </div>
      </div>

      <Button
        onClick={onSave}
        className="rounded-lg bg-[#111827] px-8 text-white hover:bg-[#374151]"
      >
        Save
      </Button>
    </div>
  );
}

export function InterviewAnswersView({
  participant,
  onBack,
  onSaved,
}: InterviewAnswersViewProps) {
  const [problems, setProblems] = useState<AnswerableProblem[] | null>(null);

  // Mirrors `problems` so a commit always persists the latest value rather than
  // whatever the handler closed over before the last keystroke.
  const problemsRef = useRef<AnswerableProblem[] | null>(null);
  problemsRef.current = problems;

  useEffect(() => {
    let active = true;
    getInterviewAnswersData(participant.id).then((result) => {
      if (active) setProblems(result);
    });
    return () => {
      active = false;
    };
  }, [participant.id]);

  const handleAnswerChange = useCallback(
    (problemId: string, questionId: string, value: string) => {
      setProblems((prev) =>
        (prev ?? []).map((problem) =>
          problem.id !== problemId
            ? problem
            : {
                ...problem,
                questions: problem.questions.map((question) =>
                  question.questionId !== questionId
                    ? question
                    : { ...question, answer: value },
                ),
              },
        ),
      );
    },
    [],
  );

  const handleAnswerCommit = useCallback(
    (problemId: string, questionId: string, value?: string) => {
      const problem = problemsRef.current?.find((p) => p.id === problemId);
      const question = problem?.questions.find(
        (q) => q.questionId === questionId,
      );
      if (!question) return;

      // A caller that commits in the same tick as its edit hasn't re-rendered yet, so
      // the argument — not the ref — carries the new value.
      void upsertProblemInterviewAnswer({
        questionId,
        participantId: participant.id,
        value: value ?? question.answer,
      });
    },
    [participant.id],
  );

  // Answers already persist on blur, and clicking Save blurs the focused input first, so
  // there's nothing left to write here. Saving deliberately leaves the participant in its
  // current stage — how an interview gets moved to "documented" is still being designed.
  const handleSave = useCallback(() => {
    onSaved();
  }, [onSaved]);

  return (
    // Break out of the page's px-8/py-4 gutter so the white surface runs edge to edge,
    // matching the design; the +2rem height makes up for the cancelled vertical padding.
    <div className="-mx-8 -my-4 flex h-[calc(100%+2rem)] flex-col bg-white">
      <div className="shrink-0 border-b border-[#E4E5ED] px-8 py-4">
        <InterviewHeader
          participant={participant}
          onBack={onBack}
          onSave={handleSave}
        />
      </div>

      {!problems ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="max-w-md text-center">
            <h3 className="text-base font-semibold text-[#1F2430]">
              No questions to ask yet
            </h3>
            <p className="mx-auto mt-2 text-xs text-[#697288]">
              Write the interview questions for your problems on the Interview Prep
              tab of the journey map, and they will show up here ready to answer.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
            {problems.map((problem) => (
              <ProblemAnswerColumn
                key={problem.id}
                problem={problem}
                onAnswerChange={(questionId, value) =>
                  handleAnswerChange(problem.id, questionId, value)
                }
                onAnswerCommit={(questionId, value) =>
                  handleAnswerCommit(problem.id, questionId, value)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

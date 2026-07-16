"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import type { Participant } from "@/lib/generated/prisma";
import {
  getInterviewAnswersData,
  upsertProblemInterviewAnswer,
} from "@/services/interviewPrep";
import { markParticipantAsDocumented } from "@/services/participants";

import { ProblemAnswerColumn } from "./ProblemAnswerColumn";
import type { AnswerableProblem } from "./types";

interface InterviewAnswersViewProps {
  participant: Participant;
  onBack: () => void;
  onEditProfile: () => void;
  onSaved: () => void;
}

function InterviewHeader({
  participant,
  onBack,
  onEditProfile,
  onSave,
  saving,
}: {
  participant: Participant;
  onBack: () => void;
  onEditProfile: () => void;
  onSave: () => void;
  saving: boolean;
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
            {roles.map((role) => (
              <Badge key={role} className="bg-[#EEEFF5] text-[#111827]">
                {role}
              </Badge>
            ))}
            <button
              type="button"
              onClick={onEditProfile}
              aria-label="Edit participant profile"
              className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#70747D] hover:bg-white hover:text-[#111827]"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Button
        onClick={onSave}
        disabled={saving}
        className="rounded-lg bg-[#111827] px-8 text-white hover:bg-[#374151]"
      >
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

export function InterviewAnswersView({
  participant,
  onBack,
  onEditProfile,
  onSaved,
}: InterviewAnswersViewProps) {
  const [problems, setProblems] = useState<AnswerableProblem[] | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await markParticipantAsDocumented(participant.id);
      onSaved();
    } finally {
      setSaving(false);
    }
  }, [participant.id, onSaved]);

  return (
    <div className="flex h-full flex-col gap-4">
      <InterviewHeader
        participant={participant}
        onBack={onBack}
        onEditProfile={onEditProfile}
        onSave={handleSave}
        saving={saving}
      />

      {!problems ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : problems.length === 0 ? (
        <div className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm">
          <h3 className="text-base font-semibold text-[#1F2430]">
            No questions to ask yet
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs text-[#697288]">
            Write the interview questions for your problems on the Interview Prep
            tab of the journey map, and they will show up here ready to answer.
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-row gap-4 overflow-x-auto">
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
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import {
  getExampleInterviewSummaryData,
  getInterviewSummaryData,
} from "@/services/interviewPrep";

import { ProblemSummaryCard } from "./ProblemSummaryCard";
import type { SummaryProblem } from "./types";

interface InterviewSummaryProps {
  readOnly?: boolean;
  exampleNumber?: number;
}

/**
 * What the interviews said, problem by problem: every interviewee's answers to the
 * questions written against a hypothesis, read side by side so the team can write down
 * what they add up to and rate how far the hypothesis was validated.
 */
export function InterviewSummary({
  readOnly = false,
  exampleNumber,
}: InterviewSummaryProps) {
  const [problems, setProblems] = useState<SummaryProblem[] | null>(null);

  // Everything here is org-wide and read-only apart from the panels, which write straight
  // to the server — so load once on mount, same as the prep tab.
  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleInterviewSummaryData(exampleNumber)
        : getInterviewSummaryData();
    load.then((result) => {
      if (active) setProblems(result);
    });
    return () => {
      active = false;
    };
  }, [exampleNumber]);

  if (!problems) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Wider than the prep tab's column: the card here only takes part of the width,
          with the summary panels sitting in the gutter beside it. */}
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-8">
        <header className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-[#1F2430]">
            What you learned
          </h2>
          <p className="max-w-3xl text-sm text-[#4E5566]">
            Every interviewee&apos;s answers to the questions you prepared, grouped by
            the hypothesis they were written for. Read them together, write down what
            they tell you, and decide how far each hypothesis has actually been
            validated.
          </p>
        </header>

        {problems.length === 0 ? (
          <div className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm">
            <h3 className="text-base font-semibold text-[#1F2430]">
              Nothing to summarize yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#4E5566]">
              Write your interview questions on the Interview Prep. tab, then record an
              interviewee&apos;s answers from their card on the Interviewees board. Their
              answers will show up here.
            </p>
          </div>
        ) : (
          problems.map((problem) => (
            <ProblemSummaryCard
              key={problem.id}
              problem={problem}
              readOnly={readOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}

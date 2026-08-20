"use client";

import { useState, useTransition } from "react";

import { Textarea } from "@/components/ui/textarea";
import { upsertProblemHypothesisSummary } from "@/services/interviewPrep";

import { ScalePicker } from "../ScalePicker";
import type { SummaryHypothesis } from "./types";

interface HypothesisSummaryPanelProps {
  hypothesis: SummaryHypothesis;
  readOnly?: boolean;
}

/**
 * What the team makes of one hypothesis: a write-up of the answers listed beside it, and
 * how strongly those answers validated the belief.
 *
 * State is local rather than lifted — the tab loads once and nothing above this needs to
 * read what is typed here, so a mirror in the container would only be a copy to keep in
 * sync. Both fields write straight to the server; there is no Save button.
 */
export function HypothesisSummaryPanel({
  hypothesis,
  readOnly = false,
}: HypothesisSummaryPanelProps) {
  const [summary, setSummary] = useState(hypothesis.summary);
  const [validationLevel, setValidationLevel] = useState(hypothesis.validationLevel);
  const [, startTransition] = useTransition();

  const { nodeId, problemId, bankQuestionId, respondentCount } = hypothesis;

  const commitSummary = () => {
    if (readOnly || summary === hypothesis.summary) return;
    startTransition(() => {
      upsertProblemHypothesisSummary({ nodeId, problemId, bankQuestionId, summary });
    });
  };

  // The value is passed rather than read back from state: the click and the write happen
  // in the same tick, so state has not re-rendered yet.
  const commitLevel = (level: number) => {
    if (readOnly) return;
    setValidationLevel(level);
    startTransition(() => {
      upsertProblemHypothesisSummary({
        nodeId,
        problemId,
        bankQuestionId,
        validationLevel: level,
      });
    });
  };

  return (
    <div className="flex h-fit flex-col gap-4 rounded-xl border border-[#E4E5ED] bg-white p-4">
      <div>
        <h4 className="text-sm font-semibold text-[#1F2430]">Summary</h4>
        <p className="mt-0.5 text-xs text-[#697288]">
          {respondentCount === 0
            ? "No interviewees answered yet"
            : `${respondentCount} interviewee${respondentCount === 1 ? "" : "s"} answered`}
        </p>
      </div>

      <Textarea
        value={summary}
        readOnly={readOnly}
        onChange={(e) => setSummary(e.target.value)}
        onBlur={commitSummary}
        placeholder="What did you learn across these answers?"
        className="min-h-[160px] resize-none bg-white text-sm"
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#4E5566]">
          How validated is this hypothesis?
        </span>
        <ScalePicker
          value={validationLevel}
          disabled={readOnly}
          onSelect={commitLevel}
        />
      </div>
    </div>
  );
}

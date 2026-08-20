"use client";

import { Fragment } from "react";

import { ProblemHeaderBand } from "../ProblemHeaderBand";
import { HypothesisSummaryBlock } from "./HypothesisSummaryBlock";
import { HypothesisSummaryPanel } from "./HypothesisSummaryPanel";
import type { SummaryProblem } from "./types";

/** Width of the summary gutter. Fixed, so the card takes whatever is left. */
const PANEL_WIDTH = "340px";

interface ProblemSummaryCardProps {
  problem: SummaryProblem;
  readOnly?: boolean;
}

/**
 * One problem, with each of its hypotheses paired to its own summary panel in a gutter
 * to the right.
 *
 * The card and the panels are items of one grid rather than a card div beside a column
 * of panels: that is what keeps a panel level with its hypothesis however many question
 * tiles that hypothesis happens to have. A wrapping card div would be a single grid item
 * and could not span the rows the panels sit in — so the card look is painted instead by
 * the left column's items sharing a continuous white background and border.
 */
export function ProblemSummaryCard({
  problem,
  readOnly = false,
}: ProblemSummaryCardProps) {
  const lastIndex = problem.hypotheses.length - 1;

  return (
    <div
      // Column gap only: a row gap would break the left column's background into stripes.
      // The panels get their vertical breathing room from their own wrapper instead.
      className="grid gap-x-6"
      style={{ gridTemplateColumns: `minmax(0,1fr) ${PANEL_WIDTH}` }}
    >
      <ProblemHeaderBand
        action={problem.action}
        label={problem.label}
        description={problem.description}
        tags={problem.tags}
        className="col-start-1 rounded-t-xl border border-b-0 border-[#E4E5ED]"
      />

      {problem.hypotheses.map((hypothesis, i) => (
        <Fragment key={hypothesis.id}>
          <div
            className={`col-start-1 border-x border-[#E4E5ED] bg-white ${
              i > 0 ? "border-t" : ""
            } ${i === lastIndex ? "rounded-b-xl border-b" : ""}`}
          >
            <HypothesisSummaryBlock hypothesis={hypothesis} />
          </div>
          <div className="col-start-2 pb-4">
            <HypothesisSummaryPanel hypothesis={hypothesis} readOnly={readOnly} />
          </div>
        </Fragment>
      ))}
    </div>
  );
}

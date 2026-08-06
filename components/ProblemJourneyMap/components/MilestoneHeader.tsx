"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

import { MILESTONE_LABELS, SUB_STEPS } from "@/lib/milestones";
import { useMilestoneSelection } from "../MilestoneSelectionContext";
import { useSubStepProgress } from "../SubStepProgressContext";

type SubStepStatus = "done" | "active" | "pending";

interface SubStep {
  label: string;
  status: SubStepStatus;
  /** Number of filled progress segments (0..SEGMENTS). */
  filled: number;
}

interface Milestone {
  label: string;
  subSteps: SubStep[];
}

interface MilestoneHeaderProps {
  milestones?: Milestone[];
  payerInterviews?: number;
  currentNumber?: number;
  /** Milestone numbers (0-based — milestone 0 is Program Onboarding) an
   *  instructor has signed off. These paint green instead of indigo when
   *  selected. */
  reviewedMilestones?: number[];
  /** Milestone numbers the startup has unlocked. The rest get a lock icon beside
   *  their name — a hint only, the blocks stay clickable. Omit to show no locks
   *  at all (the /examples mirrors, which gate nothing). */
  availableMilestones?: number[];
}

// Number of progress segments rendered under each sub-step.
const SEGMENTS = 3;

// Sub-step completion is binary today (one steps-card item per sub-step, Reviewed
// or not), so the partial-progress segments are hidden. Kept behind this flag —
// flip it back on if sub-steps ever gain sub-items to count.
const SHOW_PROGRESS_SEGMENTS = false;

// Width of the chevron arrow that terminates / separates each block.
const CHEVRON_W = 14;

const INDIGO = "#6935FD";
const CHEVRON_GRAY = "#C9CDD9"; // divider / tip outline on the gray blocks
const CHEVRON_INDIGO = "#C3B0F5"; // divider outline between tinted sub-steps
const CHEVRON_GREEN = "#A8D5B5"; // divider outline on completed sub-steps
const GRAY_TEXT = "#9CA3AF";
const INDIGO_LABEL = "#C7D2FE"; // indigo-200, used for the milestone title

// Reviewed milestones swap indigo for green on the label block only — the
// sub-step cells keep their own indigo/green tints, which track sub-step
// completion rather than instructor sign-off.
const GREEN_SOLID = "#2F9E63"; // label block of a reviewed, selected milestone
const GREEN_SOLID_LABEL = "#C7EBD5"; // its title text, mirroring INDIGO_LABEL

const INDIGO_TINT = "#F1ECFF"; // sub-step cells of the selected milestone
const GREEN_TINT = "#E7F7EC"; // completed sub-step cells
const GREEN_TEXT = "#2F9E63"; // "Completed" check + label (matches --progress-done)
const BLOCK_GRAY = "#EFF0F4"; // unselected milestone blocks
const GRAY_LABEL = "#697288"; // "#N" caption on unselected blocks

// Shared transition for every animated property so resize, color and content
// reveal all move together. easeInOut cubic-bezier, ~280ms.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

/**
 * The arrow tip / divider drawn on the right edge of a block. `fill` paints the
 * triangle (use to extend a colored block or cover the seam); `stroke` draws the
 * two diagonal border lines. Both animate so the tip crossfades with its block.
 */
function Chevron({
  fill,
  stroke,
  width = CHEVRON_W,
  transition = TRANSITION,
}: {
  fill: string;
  stroke?: string;
  width?: number;
  transition?: typeof TRANSITION | typeof INSTANT;
}) {
  return (
    <svg
      className="pointer-events-none absolute top-0 z-10 h-full"
      style={{ right: -width, width }}
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
    >
      <motion.path
        d={`M0 0 L${width} 50 L0 100 Z`}
        animate={{ fill }}
        transition={transition}
      />
      <motion.path
        d={`M0 0 L${width} 50 L0 100`}
        fill="none"
        animate={{ stroke: stroke ?? "rgba(0,0,0,0)" }}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        transition={transition}
      />
    </svg>
  );
}

function ProgressSegments({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-3 rounded-full lg:w-4 xl:w-5 ${
            i < filled ? "bg-[#6935FD]" : "bg-[#D9CCFF]"
          }`}
        />
      ))}
    </div>
  );
}

function SubStepCell({
  subStep,
  showDivider,
}: {
  subStep: SubStep;
  showDivider: boolean;
}) {
  // The cell's own tint. The divider chevron is filled with the same color so the
  // arrow reads as an extension of this cell over its neighbour's left corner.
  const isDone = subStep.status === "done";
  const bg = isDone ? GREEN_TINT : INDIGO_TINT;
  const chevronStroke = isDone ? CHEVRON_GREEN : CHEVRON_INDIGO;
  return (
    <div
      style={{ backgroundColor: bg }}
      className="relative flex flex-col items-center justify-center gap-1.5 px-2 py-2 lg:px-3 lg:py-3 xl:px-4"
    >
      {/* Capped narrow so labels wrap onto a second line instead of stretching
          the cell wide on one. */}
      <span className="h-[35px] block line-clamp-2 max-w-[112px] text-center text-xs font-medium leading-tight text-gray-700 xl:max-w-[132px] xl:text-sm">
        {subStep.label}
      </span>

      {isDone ? (
        <div className="flex items-center gap-1" style={{ color: GREEN_TEXT }}>
          <CheckCircle2 size={13} />
          <span className="text-xs">Completed</span>
        </div>
      ) : SHOW_PROGRESS_SEGMENTS ? (
        <ProgressSegments filled={subStep.filled} />
      ) : (
        // Placeholder matching the height of the "Completed" row / segments, so
        // pending cells don't shrink and shift the strip.
        <span aria-hidden className="h-[18px]" />
      )}

      {showDivider && <Chevron fill={bg} stroke={chevronStroke} />}
    </div>
  );
}

export function MilestoneHeader({
  milestones: milestonesProp,
  payerInterviews = 8,
  currentNumber = 4,
  reviewedMilestones,
  availableMilestones,
}: MilestoneHeaderProps) {
  const reviewed = useMemo(
    () => new Set(reviewedMilestones ?? []),
    [reviewedMilestones],
  );
  const available = useMemo(
    () => (availableMilestones ? new Set(availableMilestones) : null),
    [availableMilestones],
  );
  // Selected milestone is shared via context so the tab content (Get Started)
  // can react to it. Milestones start at 0, so the milestone number and its
  // index into MILESTONE_LABELS are the same value — hence no ±1 below.
  const { selectedMilestone: expandedIndex, setSelectedMilestone } =
    useMilestoneSelection();
  // A sub-step is Done when its item on the milestone's steps card (Instructions
  // tab) is marked Reviewed. Toggling there updates this map optimistically, so
  // the header reflects the change without a reload.
  const { progress } = useSubStepProgress();

  const derivedMilestones = useMemo<Milestone[]>(
    () =>
      MILESTONE_LABELS.map((label, index) => ({
        label,
        subSteps: SUB_STEPS.filter((subStep) => subStep.milestone === index).map(
          (subStep) => ({
            label: subStep.label,
            status: progress[subStep.key] ? "done" : "active",
            filled: progress[subStep.key] ? SEGMENTS : 0,
          }),
        ),
      })),
    [progress],
  );

  const milestones = milestonesProp ?? derivedMilestones;
  const total = milestones.length;

  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? INSTANT : TRANSITION;

  // A collapsing block keeps its content-sized width until its sub-steps have
  // finished exiting — otherwise it snaps narrow immediately and the outgoing
  // sub-steps overlap the neighbouring blocks for the length of the exit.
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndexRef = useRef(expandedIndex);

  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = expandedIndex;
    if (prev !== expandedIndex) setExitingIndex(prev);
  }, [expandedIndex]);

  // Align the selected milestone to the start of the strip so it's always seen
  // from its beginning (its sub-steps extend to the right). Scroll the strip
  // container itself by the measured gap between the block's left edge and the
  // container's left edge — `scrollIntoView` gets interrupted by the ongoing
  // flexGrow animation and lands the block mid-strip. Wait for the grow
  // animation to settle, otherwise this measures the pre-grow box.
  useEffect(() => {
    const scroll = () => {
      const container = scrollRef.current;
      const block = blockRefs.current[expandedIndex];
      const lastBlock = blockRefs.current[total - 1];
      if (!container || !block || !lastBlock) return;

      const containerLeft = container.getBoundingClientRect().left;
      const blockLeft = block.getBoundingClientRect().left;
      // Only reserve as much trailing room as this milestone actually needs to
      // reach the left edge: the shortfall between the visible strip width and
      // the real content from the selected block to the end. Middle milestones
      // have enough following content, so this is 0 and no blank is added.
      const trailingContent =
        lastBlock.getBoundingClientRect().right - blockLeft;
      const needed = Math.max(0, container.clientWidth - trailingContent);
      if (spacerRef.current) spacerRef.current.style.width = `${needed}px`;

      container.scrollBy({
        left: blockLeft - containerLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    if (reduceMotion) {
      scroll();
      return;
    }
    // Add margin past the transition so the previous milestone has fully
    // collapsed before we measure — otherwise its late collapse shifts the
    // selected block and the alignment lands off. rAF ensures the final layout
    // is flushed before measuring.
    let raf = 0;
    const id = window.setTimeout(
      () => {
        raf = window.requestAnimationFrame(scroll);
      },
      TRANSITION.duration * 1000 + 80,
    );
    return () => {
      window.clearTimeout(id);
      window.cancelAnimationFrame(raf);
    };
  }, [expandedIndex, reduceMotion, total]);

  return (
    <div className="flex w-full items-stretch border-b border-[#E4E5ED] bg-white">
      <div
        ref={scrollRef}
        className="no-scrollbar min-w-0 flex-1 overflow-x-auto"
      >
        {/* Collapsed width. Sized so the longest two-word tail ("Present
            Findings") still fits on one line — i.e. every label wraps to at most
            two lines — after the horizontal padding and the neighbouring
            chevron's overlap are taken out. */}
        <div className="flex w-full min-w-max items-stretch [--ms-basis:125px] lg:[--ms-basis:142px] xl:[--ms-basis:165px]">
          {milestones.map((milestone, index) => {
            const isExpanded = index === expandedIndex;
            // Sign-off recolours the selected block; a collapsed block stays gray
            // either way, so this only matters while expanded.
            const isReviewed = reviewed.has(index);
            // Not yet unlocked for this startup. Purely a visual hint — the block
            // still selects, so the milestone can be previewed.
            const isLocked = available ? !available.has(index) : false;
            const accent = isReviewed ? GREEN_SOLID : INDIGO;
            const accentLabel = isReviewed ? GREEN_SOLID_LABEL : INDIGO_LABEL;
            // Content-sized while expanded (and while collapsing) so the sub-steps
            // widen the block instead of overflowing onto the next one.
            const sizeToContent = isExpanded || index === exitingIndex;
            // Left blocks stack above right ones so their chevrons overlay the next block.
            const zIndex = total - index;

            return (
              <motion.div
                key={milestone.label}
                ref={(el) => {
                  blockRefs.current[index] = el;
                }}
                onClick={() => setSelectedMilestone(index)}
                initial={false}
                transition={transition}
                // Animate flexGrow (a real layout property) rather than framer's
                // transform-based `layout`, so the box you see is always the real
                // box — no transform to release at the end of the animation, which
                // is what caused the settle-jump. flexBasis pins the collapsed
                // width; grow=1 lets the expanded one absorb the free space.
                animate={{
                  flexGrow: isExpanded ? 1 : 0,
                  borderColor: isExpanded ? accent : "rgba(0,0,0,0)",
                }}
                style={{
                  zIndex,
                  flexBasis: "var(--ms-basis)",
                  flexShrink: 0,
                  minWidth: sizeToContent ? "max-content" : 0,
                }}
                className="relative flex cursor-pointer items-stretch border-y border-l"
              >
                {/* Milestone label — arrow-shaped block. Purple when expanded. */}
                <motion.div
                  transition={transition}
                  animate={{
                    backgroundColor: isExpanded ? accent : BLOCK_GRAY,
                  }}
                  whileHover={
                    isExpanded ? undefined : { backgroundColor: "#E4E5ED" }
                  }
                  className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 lg:py-3 ${
                    isExpanded
                      ? "px-2 lg:px-2.5 xl:px-3"
                      : "px-1.5 lg:px-2 xl:px-2.5"
                  }`}
                >
                  {/* The lock sits on the "#N" line rather than beside the title:
                      that row has spare width, while the title already wraps to
                      two lines at these block widths. Color lives on the row so
                      the icon inherits it through currentColor. */}
                  <motion.div
                    transition={transition}
                    animate={{ color: isExpanded ? "#ffffff" : GRAY_LABEL }}
                    className="flex items-center justify-center gap-1"
                  >
                    <span className="text-sm font-bold leading-none xl:text-base">
                      #{index}
                    </span>
                    {isLocked && (
                      <Lock
                        aria-label="Not activated yet"
                        className="size-3 shrink-0 xl:size-3.5"
                      />
                    )}
                  </motion.div>
                  <motion.span
                    transition={transition}
                    animate={{ color: isExpanded ? accentLabel : GRAY_TEXT }}
                    // Capped width so the label wraps onto a second line instead
                    // of stretching the block wide on one. Wide enough that the
                    // longest label ("User, their Journey & Market") fits in two.
                    //
                    // The height is pinned to two lines (line-height 1.25 at each
                    // font size) so one-line labels still reserve the second row —
                    // otherwise they centre themselves and sit off the shared
                    // baseline of their neighbours.
                    className={`block min-h-[30px] max-w-[116px] text-center text-xs leading-tight xl:min-h-[35px] xl:max-w-[140px] xl:text-sm ${
                      isExpanded ? "font-bold" : "font-medium"
                    }`}
                  >
                    {milestone.label}
                  </motion.span>
                  <Chevron
                    fill={isExpanded ? accent : BLOCK_GRAY}
                    stroke={isExpanded ? undefined : CHEVRON_GRAY}
                    transition={transition}
                  />
                </motion.div>

                {/* Fixed sub-steps — fade + slide in only while expanded. */}
                <AnimatePresence
                  initial={false}
                  onExitComplete={() =>
                    setExitingIndex((cur) => (cur === index ? null : cur))
                  }
                >
                  {isExpanded && (
                    <motion.div
                      key="substeps"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={transition}
                      className="flex items-stretch"
                    >
                      {milestone.subSteps.map((subStep, i) => (
                        <SubStepCell
                          key={subStep.label}
                          subStep={subStep}
                          showDivider={i < milestone.subSteps.length - 1}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Arrow tip terminating the expanded block — tinted to match the
                    last sub-step so the block ends in its own color. */}
                {isExpanded && (
                  <Chevron
                    fill={
                      milestone.subSteps.at(-1)?.status === "done"
                        ? GREEN_TINT
                        : INDIGO_TINT
                    }
                    stroke={accent}
                    transition={transition}
                  />
                )}
              </motion.div>
            );
          })}

          {/* Trailing scroll room so the later milestones can reach the left edge.
              Width is set imperatively per selection to the minimum needed. */}
          <div ref={spacerRef} aria-hidden className="shrink-0" />
        </div>
      </div>

      {/* Pinned outside the scroll strip so the counts stay visible when the
          milestones overflow. */}
      <div className="flex shrink-0 flex-col items-end justify-center border-l border-[#E4E5ED] bg-white px-3 py-2 lg:px-5 lg:py-3 xl:px-8">
        <div className="flex items-center gap-2 whitespace-nowrap text-xs xl:text-sm">
          <span className="text-gray-500">Payer interviews:</span>
          <span className="font-semibold text-[#111827]">
            {payerInterviews}
          </span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-xs xl:text-sm">
          <span className="text-gray-400">Current number:</span>
          <span className="font-medium text-gray-400">{currentNumber}</span>
        </div>
      </div>
    </div>
  );
}

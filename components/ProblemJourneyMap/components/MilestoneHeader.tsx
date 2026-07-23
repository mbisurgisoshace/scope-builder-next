'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { CheckCircle2, Info, Calendar, type LucideIcon } from 'lucide-react';

import { useMilestoneSelection } from '../MilestoneSelectionContext';

type SubStepStatus = 'done' | 'active' | 'pending';

interface SubStep {
  label: string;
  /** Fixed icon for the sub-step. `done` sub-steps show a green check instead. */
  icon?: LucideIcon;
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
}

// Number of progress segments rendered under each sub-step.
const SEGMENTS = 3;

// Width of the chevron arrow that terminates / separates each block.
const CHEVRON_W = 14;

const INDIGO = '#6935FD';
const CHEVRON_GRAY = '#E5E7EB';
const GRAY_TEXT = '#9CA3AF';
const INDIGO_LABEL = '#C7D2FE'; // indigo-200, used for the "Milestone" caption

// Shared transition for every animated property so resize, color and content
// reveal all move together. easeInOut cubic-bezier, ~280ms.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

const FIXED_SUB_STEPS: Pick<SubStep, 'label' | 'icon'>[] = [
  { label: 'Market' },
  { label: 'Journey map', icon: Info },
  { label: 'Check-In', icon: Calendar },
];

const DEFAULT_MILESTONES: Milestone[] = [
  {
    label: 'Milestone 1',
    subSteps: [
      { ...FIXED_SUB_STEPS[0], status: 'done', filled: 3 },
      { ...FIXED_SUB_STEPS[1], status: 'active', filled: 1 },
      { ...FIXED_SUB_STEPS[2], status: 'active', filled: 1 },
    ],
  },
  { label: 'Milestone 2', subSteps: buildPendingSubSteps() },
  { label: 'Milestone 3', subSteps: buildPendingSubSteps() },
  { label: 'Milestone 4', subSteps: buildPendingSubSteps() },
  { label: 'Milestone 5', subSteps: buildPendingSubSteps() },
];

function buildPendingSubSteps(): SubStep[] {
  return FIXED_SUB_STEPS.map((s) => ({ ...s, status: 'pending', filled: 0 }));
}

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
        animate={{ stroke: stroke ?? 'rgba(0,0,0,0)' }}
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
            i < filled ? 'bg-indigo-600' : 'bg-gray-200'
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
  const Icon = subStep.icon;
  return (
    <div className="relative flex flex-col items-center justify-center gap-1.5 px-3 py-2 lg:px-5 lg:py-3 xl:px-8">
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap text-xs font-medium text-gray-700 xl:text-sm">
          {subStep.label}
        </span>
        {subStep.status !== 'done' && Icon && (
          <Icon size={14} className="text-gray-400" />
        )}
      </div>

      {subStep.status === 'done' ? (
        <div className="flex items-center gap-1">
          <CheckCircle2 size={13} className="text-green-500" />
          <span className="text-xs text-green-500">Done</span>
        </div>
      ) : (
        <ProgressSegments filled={subStep.filled} />
      )}

      {showDivider && <Chevron fill="rgba(0,0,0,0)" stroke={CHEVRON_GRAY} />}
    </div>
  );
}

export function MilestoneHeader({
  milestones = DEFAULT_MILESTONES,
  payerInterviews = 8,
  currentNumber = 4,
}: MilestoneHeaderProps) {
  // Selected milestone is shared via context so the tab content (Get Started)
  // can react to it. `expandedIndex` here mirrors the selected milestone.
  const { selectedMilestone: expandedIndex, setSelectedMilestone } =
    useMilestoneSelection();
  const total = milestones.length;

  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? INSTANT : TRANSITION;

  // A collapsing block keeps its content-sized width until its sub-steps have
  // finished exiting — otherwise it snaps narrow immediately and the outgoing
  // sub-steps overlap the neighbouring blocks for the length of the exit.
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndexRef = useRef(expandedIndex);

  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = expandedIndex;
    if (prev !== expandedIndex) setExitingIndex(prev);
  }, [expandedIndex]);

  // Bring the selected milestone into view when the strip is scrolled. Wait for
  // the grow animation to settle, otherwise this measures the pre-grow box and
  // under-scrolls.
  useEffect(() => {
    const scroll = () =>
      blockRefs.current[expandedIndex]?.scrollIntoView({
        inline: 'nearest',
        block: 'nearest',
        behavior: reduceMotion ? 'auto' : 'smooth',
      });

    if (reduceMotion) {
      scroll();
      return;
    }
    const id = window.setTimeout(scroll, TRANSITION.duration * 1000);
    return () => window.clearTimeout(id);
  }, [expandedIndex, reduceMotion]);

  return (
    <div className="flex w-full items-stretch border-b border-[#E4E5ED] bg-white">
      <div className="no-scrollbar min-w-0 flex-1 overflow-x-auto">
        <div className="flex w-full min-w-max items-stretch [--ms-basis:90px] lg:[--ms-basis:110px] xl:[--ms-basis:130px]">
          {milestones.map((milestone, index) => {
            const isExpanded = index === expandedIndex;
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
                  borderColor: isExpanded ? INDIGO : 'rgba(0,0,0,0)',
                }}
                style={{
                  zIndex,
                  flexBasis: 'var(--ms-basis)',
                  flexShrink: 0,
                  minWidth: sizeToContent ? 'max-content' : 0,
                }}
                className="group relative flex cursor-pointer items-stretch border-y border-l"
              >
                {/* Milestone label — arrow-shaped block. Purple when expanded. */}
                <motion.div
                  transition={transition}
                  animate={{ backgroundColor: isExpanded ? INDIGO : '#ffffff' }}
                  className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 lg:py-3 ${
                    isExpanded
                      ? 'px-3 lg:px-5 xl:px-8'
                      : 'px-2 group-hover:bg-gray-50 lg:px-3 xl:px-4'
                  }`}
                >
                  <motion.span
                    transition={transition}
                    animate={{ color: isExpanded ? INDIGO_LABEL : GRAY_TEXT }}
                    className="text-[10px] font-medium xl:text-xs"
                  >
                    Milestone
                  </motion.span>
                  <motion.span
                    transition={transition}
                    animate={{ color: isExpanded ? '#ffffff' : GRAY_TEXT }}
                    className="text-base font-semibold leading-none lg:text-lg"
                  >
                    {index + 1}
                  </motion.span>
                  <Chevron
                    fill={isExpanded ? INDIGO : '#ffffff'}
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
                      className="flex items-center"
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

                {/* Purple arrow tip terminating the expanded block. */}
                {isExpanded && (
                  <Chevron
                    fill="#ffffff"
                    stroke={INDIGO}
                    transition={transition}
                  />
                )}
              </motion.div>
            );
          })}
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

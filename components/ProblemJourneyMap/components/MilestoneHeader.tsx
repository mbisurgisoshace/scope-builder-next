'use client';

import React, { useState } from 'react';
import { CheckCircle2, Info, Calendar, type LucideIcon } from 'lucide-react';

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
  defaultExpanded?: number;
  payerInterviews?: number;
  currentNumber?: number;
}

// Number of progress segments rendered under each sub-step.
const SEGMENTS = 3;

// Width of the chevron arrow that terminates / separates each block.
const CHEVRON_W = 14;

const INDIGO = '#6935FD';
const CHEVRON_GRAY = '#E5E7EB';

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
 * two diagonal border lines.
 */
function Chevron({
  fill,
  stroke,
  width = CHEVRON_W,
}: {
  fill: string;
  stroke?: string;
  width?: number;
}) {
  return (
    <svg
      className="pointer-events-none absolute top-0 z-10 h-full"
      style={{ right: -width, width }}
      viewBox={`0 0 ${width} 100`}
      preserveAspectRatio="none"
    >
      <path d={`M0 0 L${width} 50 L0 100 Z`} fill={fill} />
      {stroke && (
        <path
          d={`M0 0 L${width} 50 L0 100`}
          fill="none"
          stroke={stroke}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}

function ProgressSegments({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-5 rounded-full ${
            i < filled ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function SubStepCell({ subStep, showDivider }: { subStep: SubStep; showDivider: boolean }) {
  const Icon = subStep.icon;
  return (
    <div className="relative flex flex-col items-center justify-center gap-1.5 px-8 py-3">
      <div className="flex items-center gap-1.5">
        <span className="whitespace-nowrap text-sm font-medium text-gray-700">
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

      {showDivider && <Chevron fill="none" stroke={CHEVRON_GRAY} />}
    </div>
  );
}

export function MilestoneHeader({
  milestones = DEFAULT_MILESTONES,
  defaultExpanded = 0,
  payerInterviews = 8,
  currentNumber = 4,
}: MilestoneHeaderProps) {
  const [expandedIndex, setExpandedIndex] = useState(defaultExpanded);
  const total = milestones.length;

  return (
    <div className="flex w-full items-stretch border-b border-[#E4E5ED] bg-white">
      {milestones.map((milestone, index) => {
        const isExpanded = index === expandedIndex;
        // Left blocks stack above right ones so their chevrons overlay the next block.
        const zIndex = total - index;

        if (!isExpanded) {
          return (
            <button
              type="button"
              key={milestone.label}
              onClick={() => setExpandedIndex(index)}
              className="relative flex w-[130px] shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 bg-white py-3 pl-6 pr-4 transition-colors hover:bg-gray-50"
              style={{ zIndex }}
            >
              <span className="text-xs font-medium text-gray-400">Milestone</span>
              <span className="text-lg font-semibold leading-none text-gray-400">
                {index + 1}
              </span>
              <Chevron fill="white" stroke={CHEVRON_GRAY} />
            </button>
          );
        }

        return (
          <div
            key={milestone.label}
            className="relative flex flex-1 items-stretch border-y border-l border-[#6935FD]"
            style={{ zIndex }}
          >
            {/* Active milestone label — arrow-shaped purple block */}
            <div className="relative flex flex-col items-center justify-center bg-indigo-600 px-8 py-3">
              <span className="text-xs font-medium text-indigo-200">Milestone</span>
              <span className="text-lg font-semibold leading-none text-white">
                {index + 1}
              </span>
              <Chevron fill={INDIGO} />
            </div>

            {/* Fixed sub-steps */}
            <div className="flex flex-1 items-center">
              {milestone.subSteps.map((subStep, i) => (
                <SubStepCell
                  key={subStep.label}
                  subStep={subStep}
                  showDivider={i < milestone.subSteps.length - 1}
                />
              ))}
            </div>

            {/* Purple arrow tip terminating the expanded block */}
            <Chevron fill="white" stroke={INDIGO} />
          </div>
        );
      })}

      <div className="ml-auto flex shrink-0 flex-col items-end justify-center px-8 py-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Payer interviews:</span>
          <span className="font-semibold text-[#111827]">{payerInterviews}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-400">Current number:</span>
          <span className="font-medium text-gray-400">{currentNumber}</span>
        </div>
      </div>
    </div>
  );
}

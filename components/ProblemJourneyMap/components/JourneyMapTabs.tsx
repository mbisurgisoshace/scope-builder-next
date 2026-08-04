"use client";

import React, { useEffect, useState } from "react";
import { ListChecks, Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { GetStartedCardsProvider } from "../GetStartedCardsContext";
import { InterviewPrep } from "./InterviewPrep/InterviewPrep";
import { GetStarted } from "./GetStarted/GetStarted";
import { Market } from "./Market/Market";
import { MilestoneStepsDialog } from "./MilestoneStepsDialog";

const STORAGE_KEY = "pjm-active-tab";

type TabValue = "get-started" | "canvas" | "market" | "interview-prep";

const TABS: { value: TabValue; label: string }[] = [
  { value: "get-started", label: "Instructions" },
  { value: "canvas", label: "Canvas" },
  { value: "market", label: "Market" },
  { value: "interview-prep", label: "Interview Prep." },
];

const TAB_VALUES = TABS.map((t) => t.value);

const DEFAULT_TAB: TabValue = "canvas";

interface JourneyMapTabsProps {
  /** The live journey-map canvas. Rendered only while the Canvas tab is active. */
  canvas: React.ReactNode;
  /** Render every tab as a read-only viewer (Examples pages). */
  readOnly?: boolean;
  /** When set, tabs read example set N's data instead of the active org's. */
  exampleNumber?: number;
}

function EmptyTab() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex w-[300px] flex-col items-center gap-3 rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1ECFF]">
          <Lock className="h-6 w-6 text-[#6A35FF]" />
        </div>
        <h3 className="text-base font-semibold text-[#1F2430]">
          This step will be available soon
        </h3>
        <p className="text-xs text-[#697288]">
          This page will get available once the prior steps are completed.
        </p>
      </div>
    </div>
  );
}

export function JourneyMapTabs({
  canvas,
  readOnly = false,
  exampleNumber,
}: JourneyMapTabsProps) {
  const [value, setValue] = useState<TabValue>(DEFAULT_TAB);
  const [stepsOpen, setStepsOpen] = useState(false);

  // Restore the last-used tab on mount (kept out of the initial state to avoid an
  // SSR/hydration mismatch). Falls back to the default when nothing is stored.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TAB_VALUES.includes(stored as TabValue)) {
      setValue(stored as TabValue);
    }
  }, []);

  const select = (next: TabValue) => {
    setValue(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    // Get Started cards are cached here rather than fetched per consumer: the
    // Instructions tab and the Milestone Steps dialog show the same cards and
    // both mount and unmount often.
    <GetStartedCardsProvider exampleNumber={exampleNumber} readOnly={readOnly}>
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Tab bar — a darker grey band than the content area below it. */}
        <div className="flex w-full items-end gap-1 bg-[#E2E4EA] px-4 pt-2  border-[#CDCFDE]">
          {TABS.map((tab) => {
            const active = value === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => select(tab.value)}
                className={cn(
                  "flex cursor-pointer flex-col items-center w-[105px] gap-1.5 rounded-t-lg pt-1 pb-2 text-[12px] font-semibold transition-colors",
                  active
                    ? "bg-[#EFF0F4] text-[#6A35FF] border border-[#CDCFDE] border-b-[#EFF0F4]"
                    : "text-[#697288] hover:text-[#4B4560]",
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "h-1 w-6 rounded-full transition-colors",
                    active ? "bg-[#6A35FF]" : "bg-[#C4C5D0]",
                  )}
                />
              </button>
            );
          })}

          {/* Shortcut to this milestone's checklist, so a step can be read and
            ticked off without leaving the current tab. Redundant on Instructions
            (the card is right there), and `readOnly` is what the Examples mirror
            passes, where there is nothing to tick. */}
          {value !== "get-started" && !readOnly && (
            <button
              type="button"
              onClick={() => setStepsOpen(true)}
              className="mb-2 ml-auto flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#CDCFDE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4B4560] transition-colors hover:text-[#6A35FF]"
            >
              <ListChecks className="size-3.5" />
              Milestone Steps
            </button>
          )}
        </div>

        <MilestoneStepsDialog open={stepsOpen} onOpenChange={setStepsOpen} />

        {/* Content — matches the active folder tab colour so they read as connected. */}
        <div className="min-h-0 flex-1 bg-[#EFF0F4]">
          {value === "canvas" ? (
            canvas
          ) : value === "get-started" ? (
            <GetStarted readOnly={readOnly} exampleNumber={exampleNumber} />
          ) : value === "market" ? (
            <Market readOnly={readOnly} exampleNumber={exampleNumber} />
          ) : value === "interview-prep" ? (
            <InterviewPrep readOnly={readOnly} exampleNumber={exampleNumber} />
          ) : (
            <EmptyTab />
          )}
        </div>
      </div>
    </GetStartedCardsProvider>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { InterviewPrep } from "./InterviewPrep/InterviewPrep";

const STORAGE_KEY = "pjm-active-tab";

type TabValue = "get-started" | "canvas" | "market" | "interview-prep";

const TABS: { value: TabValue; label: string }[] = [
  { value: "get-started", label: "Get Started" },
  { value: "canvas", label: "Canvas" },
  { value: "market", label: "Market" },
  { value: "interview-prep", label: "Interview Prep." },
];

const TAB_VALUES = TABS.map((t) => t.value);

const DEFAULT_TAB: TabValue = "canvas";

interface JourneyMapTabsProps {
  /** The live journey-map canvas. Rendered only while the Canvas tab is active. */
  canvas: React.ReactNode;
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

export function JourneyMapTabs({ canvas }: JourneyMapTabsProps) {
  const [value, setValue] = useState<TabValue>(DEFAULT_TAB);

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
                "flex flex-col items-center w-[105px] gap-1.5 rounded-t-lg pt-1 pb-2 text-[12px] font-semibold transition-colors",
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
      </div>

      {/* Content — matches the active folder tab colour so they read as connected. */}
      <div className="min-h-0 flex-1 bg-[#EFF0F4]">
        {value === "canvas" ? (
          canvas
        ) : value === "interview-prep" ? (
          <InterviewPrep />
        ) : (
          <EmptyTab />
        )}
      </div>
    </div>
  );
}

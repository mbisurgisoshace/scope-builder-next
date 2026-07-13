"use client";

import React, { createContext, useContext, useState } from "react";

interface MilestoneSelectionValue {
  /** 0-based index of the selected milestone (milestone number = selectedMilestone + 1). */
  selectedMilestone: number;
  setSelectedMilestone: (index: number) => void;
}

const MilestoneSelectionContext = createContext<MilestoneSelectionValue>(null!);

export function useMilestoneSelection() {
  return useContext(MilestoneSelectionContext);
}

export function MilestoneSelectionProvider({
  defaultSelected = 0,
  children,
}: {
  defaultSelected?: number;
  children: React.ReactNode;
}) {
  const [selectedMilestone, setSelectedMilestone] = useState(defaultSelected);

  return (
    <MilestoneSelectionContext.Provider
      value={{ selectedMilestone, setSelectedMilestone }}
    >
      {children}
    </MilestoneSelectionContext.Provider>
  );
}

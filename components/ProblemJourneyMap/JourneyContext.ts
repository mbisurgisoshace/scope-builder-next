'use client';

import { createContext, useContext } from 'react';
import type { ActionSheetTab, Solution } from './components/ActionNodeSheet';
import type { StakeholderRow } from '@/services/market';

export type JourneyNodeType = 'trigger' | 'action' | 'split_route';

export interface JourneyNodeData extends Record<string, unknown> {
  id: string;
  type: JourneyNodeType;
  content?: string;
  stakeholderIds?: number[];
}

export interface JourneyEdgeData extends Record<string, unknown> {
  /** User-set branch label. Absent or empty falls back to the derived "Option n". */
  label?: string;
}

interface JourneyContextValue {
  /** When true the canvas is a pure viewer: all edit affordances are hidden and
   * every mutator is a no-op. Milestone/card navigation stays enabled. */
  readOnly: boolean;
  /**
   * Whether the startup has unlocked a given milestone, for features that appear
   * as the curriculum progresses. Resolved from the DB server-side by the page —
   * it tracks real access, *not* the milestone selected in the header, so
   * browsing the header never reveals or hides canvas features.
   *
   * Call it with a named constant from `lib/milestones` (`PROBLEMS_MILESTONE`,
   * …) rather than a bare number, so a gate can be re-pointed in one place.
   */
  isMilestoneUnlocked: (milestone: number) => boolean;
  addTriggerNode: () => void;
  addChildNode: (parentId: string, type: JourneyNodeType) => void;
  updateNodeData: (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => void;
  /** Rename a branch connection. An empty string clears it back to "Option n". */
  updateEdgeLabel: (edgeId: string, label: string) => void;
  /** Org-wide stakeholder rows from the Market tab, grouped elsewhere by
   * `stakeholder_type`. Loaded once server-side; edits on the Market tab appear
   * here after a reload. */
  stakeholderRows: StakeholderRow[];
  /** Open the editor sheet scoped to a specific problem, on the given tab
   * (defaults to "problem"). The tab is forced on every open. */
  openProblem: (nodeId: string, problemId: string, tab?: ActionSheetTab) => void;
  /** Append a blank problem to a node and return its id. */
  addEmptyProblem: (nodeId: string) => string;
  /** Remove a problem (and its solution) from a node. */
  removeProblem: (nodeId: string, problemId: string) => void;
  /** The solution for a given problem, if any. */
  solutionForProblem: (nodeId: string, problemId: string) => Solution | null;
}

export const JourneyContext = createContext<JourneyContextValue>(null!);

export function useJourneyContext() {
  return useContext(JourneyContext);
}

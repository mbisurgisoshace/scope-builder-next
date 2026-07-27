'use client';

import { createContext, useContext } from 'react';
import type { Solution } from './components/ActionNodeSheet';
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
  addTriggerNode: () => void;
  addChildNode: (parentId: string, type: JourneyNodeType) => void;
  updateNodeData: (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => void;
  /** Rename a branch connection. An empty string clears it back to "Option n". */
  updateEdgeLabel: (edgeId: string, label: string) => void;
  /** Org-wide stakeholder rows from the Market tab, grouped elsewhere by
   * `stakeholder_type`. Loaded once server-side; edits on the Market tab appear
   * here after a reload. */
  stakeholderRows: StakeholderRow[];
  /** Open the editor sheet scoped to a specific problem. */
  openProblem: (nodeId: string, problemId: string) => void;
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

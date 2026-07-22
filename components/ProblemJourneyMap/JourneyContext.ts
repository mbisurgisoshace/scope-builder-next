'use client';

import { createContext, useContext } from 'react';
import type { Solution } from './components/ActionNodeSheet';

export type JourneyNodeType = 'trigger' | 'action' | 'split_route';

export interface JourneyNodeData extends Record<string, unknown> {
  id: string;
  type: JourneyNodeType;
  content?: string;
  jobTitle?: string | null;
}

interface JourneyContextValue {
  addTriggerNode: () => void;
  addChildNode: (parentId: string, type: JourneyNodeType) => void;
  updateNodeData: (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => void;
  jobTitles: string[];
  addJobTitle: (jobTitle: string) => void;
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

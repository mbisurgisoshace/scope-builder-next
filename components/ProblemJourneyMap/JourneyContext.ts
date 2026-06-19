'use client';

import { createContext, useContext } from 'react';

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
}

export const JourneyContext = createContext<JourneyContextValue>(null!);

export function useJourneyContext() {
  return useContext(JourneyContext);
}

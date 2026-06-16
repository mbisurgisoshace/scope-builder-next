'use client';

import { createContext, useContext } from 'react';

export type JourneyNodeType = 'trigger' | 'action' | 'split_route';

export interface JourneyParticipant {
  id: string;
  name: string;
  job_title: string | null;
}

export interface JourneyNodeData extends Record<string, unknown> {
  id: string;
  type: JourneyNodeType;
  content?: string;
  stakeholderId?: string | null;
}

interface JourneyContextValue {
  addChildNode: (parentId: string, type: JourneyNodeType) => void;
  updateNodeData: (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => void;
  participants: JourneyParticipant[];
}

export const JourneyContext = createContext<JourneyContextValue>(null!);

export function useJourneyContext() {
  return useContext(JourneyContext);
}

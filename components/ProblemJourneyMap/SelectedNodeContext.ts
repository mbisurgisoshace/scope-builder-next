'use client';

import { createContext, useContext } from 'react';

export const SelectedNodeContext = createContext<string | null>(null);
export const useSelectedNode = () => useContext(SelectedNodeContext);

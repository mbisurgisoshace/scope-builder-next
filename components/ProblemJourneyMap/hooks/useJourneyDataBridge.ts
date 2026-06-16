'use client';

import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

import type { JourneyNodeType, JourneyNodeData } from '../JourneyContext';

function colorForType(type: JourneyNodeType) {
  if (type === 'trigger') return '#EEF1FF';
  if (type === 'split_route') return '#FFF7ED';
  return '#ffffff';
}

function buildShape(id: string, type: JourneyNodeType) {
  return {
    id,
    type,
    x: 0,
    y: 0,
    width: 240,
    height: 120,
    color: colorForType(type),
    content: '',
    stakeholderId: null,
    cardTitle: null,
    text: null,
    subtype: null,
  };
}

export function useJourneyDataBridge() {
  const { setNodes, setEdges } = useReactFlow();

  const addChildNode = useCallback(
    (parentId: string, type: JourneyNodeType) => {
      const newId = crypto.randomUUID();
      const connId = crypto.randomUUID();

      setNodes((current) => {
        const parent = current.find((n) => n.id === parentId);
        const pos = parent
          ? { x: parent.position.x + 340, y: parent.position.y }
          : { x: 0, y: 0 };
        return [
          ...current,
          {
            id: newId,
            type,
            position: pos,
            data: buildShape(newId, type) as unknown as JourneyNodeData,
          },
        ];
      });

      setEdges((current) => [
        ...current,
        {
          id: connId,
          source: parentId,
          target: newId,
          type: 'journey',
          sourceHandle: 'right',
          targetHandle: 'left',
        },
      ]);
    },
    [setNodes, setEdges]
  );

  const updateNodeData = useCallback(
    (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => {
      setNodes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, ...patch } as unknown as JourneyNodeData }
            : n
        )
      );
    },
    [setNodes]
  );

  return { addChildNode, updateNodeData };
}

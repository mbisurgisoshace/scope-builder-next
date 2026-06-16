'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';

import type { JourneyNodeType, JourneyNodeData } from '../JourneyContext';
import type { Problem, Solution } from '../components/ActionNodeSheet';
import { useRealtimeJourney, type JourneyNodeStorage, type JourneyEdgeStorage } from './useRealtimeJourney';

const INITIAL_TRIGGER_ID = 'initial-trigger';

const INITIAL_TRIGGER_NODE: Node = {
  id: INITIAL_TRIGGER_ID,
  type: 'trigger',
  position: { x: 0, y: 0 },
  data: {
    id: INITIAL_TRIGGER_ID,
    type: 'trigger',
    content: '',
    stakeholderId: null,
  } as unknown as Record<string, unknown>,
};

function colorForType(type: JourneyNodeType) {
  if (type === 'trigger') return '#EEF1FF';
  if (type === 'split_route') return '#FFF7ED';
  return '#ffffff';
}

function buildNodeStorage(id: string, type: JourneyNodeType): JourneyNodeStorage {
  return { id, type, content: '', stakeholderId: null, problems: [], solutions: [] };
}

function lbNodeToRFNode(lb: JourneyNodeStorage): Node {
  return {
    id: lb.id,
    type: lb.type,
    position: { x: 0, y: 0 },
    data: {
      id: lb.id,
      type: lb.type,
      content: lb.content,
      stakeholderId: lb.stakeholderId,
      color: colorForType(lb.type),
    } as unknown as Record<string, unknown>,
  };
}

function lbEdgeToRFEdge(lb: JourneyEdgeStorage): Edge {
  return {
    id: lb.id,
    source: lb.source,
    target: lb.target,
    type: 'journey',
    sourceHandle: lb.sourceHandle,
    targetHandle: lb.targetHandle,
  };
}

export function useJourneyDataBridge() {
  const {
    lbNodes,
    lbEdges,
    addJourneyNode,
    addJourneyEdge,
    updateJourneyNode,
    addProblem: lbAddProblem,
    addSolution: lbAddSolution,
  } = useRealtimeJourney();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Guards against re-seeding Liveblocks on each effect run
  const initializedRef = useRef(false);

  // Diff-based Liveblocks → React Flow sync (blink-free)
  useEffect(() => {
    if (lbNodes === null || lbEdges === null) return;

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (lbNodes.length > 0) {
        // Existing room: initialize RF state from Liveblocks
        setNodes(lbNodes.map(lbNodeToRFNode));
        setEdges(lbEdges.map(lbEdgeToRFEdge));
      } else {
        // Fresh room: seed local state + Liveblocks with the initial trigger
        setNodes([INITIAL_TRIGGER_NODE]);
        addJourneyNode(buildNodeStorage(INITIAL_TRIGGER_ID, 'trigger'));
      }
      return;
    }

    // Subsequent sync: only apply structural diffs from remote collaborators.
    // Local mutations already update RF state immediately so their diff is always zero.
    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const lbIds = new Set(lbNodes.map((lb) => lb.id));

      const remoteAdditions = lbNodes
        .filter((lb) => !currentIds.has(lb.id))
        .map(lbNodeToRFNode);

      const removedIds = new Set(
        currentNodes.filter((n) => !lbIds.has(n.id)).map((n) => n.id)
      );

      // Data-only update (no structural change): patch content/stakeholder without touching positions.
      // Return the SAME array reference when nothing changed so RF's prop sync doesn't fire
      // and overwrite positions the layout hook has already written to the internal store.
      if (remoteAdditions.length === 0 && removedIds.size === 0) {
        const hasDataChange = lbNodes.some((lb) => {
          const rf = currentNodes.find((n) => n.id === lb.id);
          if (!rf) return false;
          const data = rf.data as unknown as JourneyNodeData;
          return data.content !== lb.content || data.stakeholderId !== lb.stakeholderId;
        });
        if (!hasDataChange) return currentNodes;

        return currentNodes.map((n) => {
          const lb = lbNodes.find((lb) => lb.id === n.id);
          if (!lb) return n;
          const data = n.data as unknown as JourneyNodeData;
          if (data.content === lb.content && data.stakeholderId === lb.stakeholderId) return n;
          return { ...n, data: { ...n.data, content: lb.content, stakeholderId: lb.stakeholderId } as unknown as Record<string, unknown> };
        });
      }

      let result = currentNodes.filter((n) => !removedIds.has(n.id));
      result = [...result, ...remoteAdditions];
      return result;
    });

    setEdges((currentEdges) => {
      const currentIds = new Set(currentEdges.map((e) => e.id));
      const lbIds = new Set(lbEdges.map((e) => e.id));

      const remoteAdditions = lbEdges
        .filter((lb) => !currentIds.has(lb.id))
        .map(lbEdgeToRFEdge);

      const removedIds = new Set(
        currentEdges.filter((e) => !lbIds.has(e.id)).map((e) => e.id)
      );

      if (remoteAdditions.length === 0 && removedIds.size === 0) return currentEdges;

      let result = currentEdges.filter((e) => !removedIds.has(e.id));
      result = [...result, ...remoteAdditions];
      return result;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lbNodes, lbEdges]);

  const addChildNode = useCallback(
    (parentId: string, type: JourneyNodeType) => {
      const newId = crypto.randomUUID();
      const connId = crypto.randomUUID();

      // 1. Update RF state immediately for smooth, blink-free UX
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
            data: {
              id: newId,
              type,
              content: '',
              stakeholderId: null,
              color: colorForType(type),
            } as unknown as Record<string, unknown>,
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

      // 2. Persist to Liveblocks (optimistic mutation — produces zero diff when useEffect fires)
      addJourneyNode(buildNodeStorage(newId, type));
      addJourneyEdge({ id: connId, source: parentId, target: newId, sourceHandle: 'right', targetHandle: 'left' });
    },
    [setNodes, setEdges, addJourneyNode, addJourneyEdge]
  );

  const updateNodeData = useCallback(
    (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => {
      setNodes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, ...patch } as unknown as Record<string, unknown> }
            : n
        )
      );
      updateJourneyNode(id, patch);
    },
    [setNodes, updateJourneyNode]
  );

  const addProblem = useCallback(
    (nodeId: string, description: string) => {
      const problem = { id: crypto.randomUUID(), description };
      lbAddProblem(nodeId, problem);
    },
    [lbAddProblem]
  );

  const addSolution = useCallback(
    (nodeId: string, description: string) => {
      const solution = { id: crypto.randomUUID(), description };
      lbAddSolution(nodeId, solution);
    },
    [lbAddSolution]
  );

  // Derive problems/solutions Maps from Liveblocks data
  const nodeProblems = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const lb of lbNodes ?? []) {
      map.set(lb.id, lb.problems ?? []);
    }
    return map;
  }, [lbNodes]);

  const nodeSolutions = useMemo(() => {
    const map = new Map<string, Solution[]>();
    for (const lb of lbNodes ?? []) {
      map.set(lb.id, lb.solutions ?? []);
    }
    return map;
  }, [lbNodes]);

  return {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    addChildNode,
    updateNodeData,
    addProblem,
    addSolution,
    nodeProblems,
    nodeSolutions,
  };
}

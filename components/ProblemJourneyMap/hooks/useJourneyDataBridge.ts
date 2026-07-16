'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';

import type { JourneyNodeType, JourneyNodeData } from '../JourneyContext';
import type { Problem, Solution, ProblemQuestionAnswer, SolutionQuestionAnswer, NodeConclusion, ConclusionStatus, PainOrGain } from '../components/ActionNodeSheet';
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
    jobTitle: null,
  } as unknown as Record<string, unknown>,
};

function colorForType(type: JourneyNodeType) {
  if (type === 'trigger') return '#EEF1FF';
  if (type === 'split_route') return '#FFF7ED';
  return '#ffffff';
}

function buildNodeStorage(id: string, type: JourneyNodeType): JourneyNodeStorage {
  return { id, type, content: '', jobTitle: null, problems: [], solutions: [], conclusions: [] };
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
      jobTitle: lb.jobTitle,
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
    updateProblem: lbUpdateProblem,
    addSolution: lbAddSolution,
    updateSolution: lbUpdateSolution,
    upsertConclusion: lbUpsertConclusion,
  } = useRealtimeJourney();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const initializedRef = useRef(false);

  // Diff-based Liveblocks → React Flow sync (blink-free)
  useEffect(() => {
    if (lbNodes === null || lbEdges === null) return;

    if (!initializedRef.current) {
      initializedRef.current = true;

      if (lbNodes.length > 0) {
        setNodes(lbNodes.map(lbNodeToRFNode));
        setEdges(lbEdges.map(lbEdgeToRFEdge));
      } else {
        setNodes([INITIAL_TRIGGER_NODE]);
        addJourneyNode(buildNodeStorage(INITIAL_TRIGGER_ID, 'trigger'));
      }
      return;
    }

    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const lbIds = new Set(lbNodes.map((lb) => lb.id));

      const remoteAdditions = lbNodes
        .filter((lb) => !currentIds.has(lb.id))
        .map(lbNodeToRFNode);

      const removedIds = new Set(
        currentNodes.filter((n) => !lbIds.has(n.id)).map((n) => n.id)
      );

      if (remoteAdditions.length === 0 && removedIds.size === 0) {
        const hasDataChange = lbNodes.some((lb) => {
          const rf = currentNodes.find((n) => n.id === lb.id);
          if (!rf) return false;
          const data = rf.data as unknown as JourneyNodeData;
          return data.content !== lb.content || data.jobTitle !== lb.jobTitle;
        });
        if (!hasDataChange) return currentNodes;

        return currentNodes.map((n) => {
          const lb = lbNodes.find((lb) => lb.id === n.id);
          if (!lb) return n;
          const data = n.data as unknown as JourneyNodeData;
          if (data.content === lb.content && data.jobTitle === lb.jobTitle) return n;
          return { ...n, data: { ...n.data, content: lb.content, jobTitle: lb.jobTitle } as unknown as Record<string, unknown> };
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

  const addTriggerNode = useCallback(() => {
    const newId = crypto.randomUUID();
    setNodes((current) => [
      ...current,
      {
        id: newId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          id: newId,
          type: 'trigger',
          content: '',
          jobTitle: null,
        } as unknown as Record<string, unknown>,
      },
    ]);
    addJourneyNode(buildNodeStorage(newId, 'trigger'));
  }, [setNodes, addJourneyNode]);

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
            data: {
              id: newId,
              type,
              content: '',
              jobTitle: null,
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

  // Single-problem upsert: update the node's existing problem if present,
  // otherwise create it.
  const saveProblem = useCallback(
    (
      nodeId: string,
      description: string,
      type: string,
      painOrGain: PainOrGain,
      questions: ProblemQuestionAnswer[]
    ) => {
      const existing = nodeProblems.get(nodeId)?.[0];
      if (existing) {
        lbUpdateProblem(nodeId, existing.id, {
          description,
          type,
          painOrGain,
          questions,
        });
      } else {
        lbAddProblem(nodeId, {
          id: crypto.randomUUID(),
          description,
          type,
          painOrGain,
          questions,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lbAddProblem, lbUpdateProblem, lbNodes]
  );

  const addSolution = useCallback(
    (nodeId: string, description: string, questions: SolutionQuestionAnswer[]) => {
      const solution = { id: crypto.randomUUID(), description, questions };
      lbAddSolution(nodeId, solution);
    },
    [lbAddSolution]
  );

  const updateSolution = useCallback(
    (
      nodeId: string,
      solutionId: string,
      description: string,
      questions: SolutionQuestionAnswer[]
    ) => {
      lbUpdateSolution(nodeId, solutionId, { description, questions });
    },
    [lbUpdateSolution]
  );

  const nodeProblems = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const lb of lbNodes ?? []) {
      map.set(
        lb.id,
        (lb.problems ?? []).map((p) => ({
          id: p.id,
          description: p.description,
          type: p.type ?? '',
          painOrGain: (p.painOrGain ?? 'pain') as PainOrGain,
          questions: (p.questions ?? []).map((q) => ({
            bankQuestionId: q.bankQuestionId,
            answer: q.answer,
            source: q.source ?? '',
            confidence: q.confidence ?? 0,
            isHypothesis: q.isHypothesis ?? false,
          })),
        }))
      );
    }
    return map;
  }, [lbNodes]);

  const nodeSolutions = useMemo(() => {
    const map = new Map<string, Solution[]>();
    for (const lb of lbNodes ?? []) {
      map.set(
        lb.id,
        (lb.solutions ?? []).map((s) => ({
          ...s,
          questions: s.questions ?? [],
        }))
      );
    }
    return map;
  }, [lbNodes]);

  const nodeConclusions = useMemo(() => {
    const map = new Map<string, NodeConclusion[]>();
    for (const lb of lbNodes ?? []) {
      map.set(lb.id, lb.conclusions ?? []);
    }
    return map;
  }, [lbNodes]);

  const upsertConclusion = useCallback(
    (nodeId: string, id: string, status: ConclusionStatus, content: string) => {
      lbUpsertConclusion(nodeId, { id, status, content });
    },
    [lbUpsertConclusion]
  );

  return {
    nodes,
    edges,
    setNodes,
    onNodesChange,
    onEdgesChange,
    addTriggerNode,
    addChildNode,
    updateNodeData,
    saveProblem,
    addSolution,
    updateSolution,
    nodeProblems,
    nodeSolutions,
    nodeConclusions,
    upsertConclusion,
  };
}

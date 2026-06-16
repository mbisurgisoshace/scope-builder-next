'use client';

import { useStorage, useMutation } from '@liveblocks/react/suspense';
import { LiveObject } from '@liveblocks/client';
import type { JourneyNodeStorage, JourneyEdgeStorage } from '@/liveblocks.config';
import type { ProblemQuestionAnswer } from '../components/ActionNodeSheet';

export type { JourneyNodeStorage, JourneyEdgeStorage };

export function useRealtimeJourney() {
  const lbNodes = useStorage(
    (root) => root.journeyNodes as unknown as readonly JourneyNodeStorage[]
  );
  const lbEdges = useStorage(
    (root) => root.journeyEdges as unknown as readonly JourneyEdgeStorage[]
  );

  const addJourneyNode = useMutation(({ storage }, node: JourneyNodeStorage) => {
    (storage.get('journeyNodes') as any).push(new LiveObject(node as any));
  }, []);

  const addJourneyEdge = useMutation(({ storage }, edge: JourneyEdgeStorage) => {
    (storage.get('journeyEdges') as any).push(new LiveObject(edge as any));
  }, []);

  const updateJourneyNode = useMutation(
    (
      { storage },
      id: string,
      patch: Partial<Omit<JourneyNodeStorage, 'id' | 'type'>>
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === id);
      if (node) node.update(patch);
    },
    []
  );

  const addProblem = useMutation(
    (
      { storage },
      nodeId: string,
      problem: { id: string; description: string; questions: ProblemQuestionAnswer[] }
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: Array<{ id: string; description: string; questions: ProblemQuestionAnswer[] }> =
          node.get('problems') ?? [];
        node.update({ problems: [...current, problem] });
      }
    },
    []
  );

  const updateProblem = useMutation(
    (
      { storage },
      nodeId: string,
      problemId: string,
      patch: { description: string; questions: ProblemQuestionAnswer[] }
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: Array<{ id: string; description: string; questions: ProblemQuestionAnswer[] }> =
          node.get('problems') ?? [];
        const updated = current.map((p) =>
          p.id === problemId ? { ...p, ...patch } : p
        );
        node.update({ problems: updated });
      }
    },
    []
  );

  const addSolution = useMutation(
    ({ storage }, nodeId: string, solution: { id: string; description: string }) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: Array<{ id: string; description: string }> = node.get('solutions') ?? [];
        node.update({ solutions: [...current, solution] });
      }
    },
    []
  );

  return {
    lbNodes,
    lbEdges,
    addJourneyNode,
    addJourneyEdge,
    updateJourneyNode,
    addProblem,
    updateProblem,
    addSolution,
  };
}

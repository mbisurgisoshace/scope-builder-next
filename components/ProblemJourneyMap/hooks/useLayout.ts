'use client';

// Adapted from .claude/examples/react-flow/dynamic-layouting-pro-example/src/hooks/useLayout.ts
// Change from the original: x ↔ y are swapped so the tree grows left-to-right instead of top-to-bottom.

import { useEffect, useRef } from 'react';
import {
  useReactFlow,
  useStore,
  type Node,
  type Edge,
  type ReactFlowState,
} from '@xyflow/react';
import { stratify, tree } from 'd3-hierarchy';
import { timer } from 'd3-timer';

// nodeSize([verticalSpread, horizontalDepth])
// 200px between sibling centers (vertical), 340px between level centers (horizontal)
const layout = tree<Node>().nodeSize([200, 340]).separation(() => 1);

const ANIMATION_DURATION = 300;

function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  // Build a d3 hierarchy from the flat node/edge list.
  // stratify requires exactly one root (no incoming edge) and each non-root
  // to have exactly one parent — which is guaranteed by the journey map's
  // "one parent per node" creation rule.
  const hierarchy = stratify<Node>()
    .id((d) => d.id)
    .parentId((d) => edges.find((e) => e.target === d.id)?.source)(nodes);

  const root = layout(hierarchy);

  // Swap x ↔ y to get a left-to-right tree:
  //   d3 node.y = depth  → RF position.x (how far right)
  //   d3 node.x = breadth → RF position.y (how far down)
  return root.descendants().map((d) => ({
    ...d.data,
    position: { x: d.y, y: d.x },
  }));
}

// Re-run whenever node OR edge count changes.
// Edge count is needed because shape + connection arrive as a single atomic mutation —
// nodeCount changes once and edgeCount changes once in the same render batch.
// Without edgeCount, if stratify somehow runs before edges are applied it would fail
// and never re-trigger (nodeCount didn't change again).
const nodeCountSelector = (state: ReactFlowState) => state.nodeLookup.size;
const edgeCountSelector = (state: ReactFlowState) => state.edges.length;

export function useLayout() {
  const initial = useRef(true);
  const nodeCount = useStore(nodeCountSelector);
  const edgeCount = useStore(edgeCountSelector);
  const { getNodes, getNode, setNodes, getEdges, fitView } = useReactFlow();

  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();

    // Need at least one node to layout
    if (nodes.length === 0) return;

    let targetNodes: Node[];
    try {
      targetNodes = layoutNodes(nodes, edges);
    } catch {
      // stratify throws if the graph isn't a valid tree (e.g. multiple roots
      // during a transient state while Liveblocks is syncing). Skip this tick.
      return;
    }

    // Build per-node from→to transition pairs for animation
    const transitions = targetNodes.map((node) => ({
      id: node.id,
      from: getNode(node.id)?.position ?? node.position,
      to: node.position,
      node,
    }));

    // Verbatim d3-timer animation from the RF Pro dynamic layouting example
    const t = timer((elapsed: number) => {
      const s = Math.min(elapsed / ANIMATION_DURATION, 1);

      const currNodes = transitions.map(({ node, from, to }) => ({
        ...node,
        position: {
          x: from.x + (to.x - from.x) * s,
          y: from.y + (to.y - from.y) * s,
        },
      }));

      setNodes(currNodes);

      if (elapsed >= ANIMATION_DURATION) {
        // Snap to final positions
        setNodes(
          transitions.map(({ node, to }) => ({ ...node, position: to }))
        );
        t.stop();

        if (!initial.current) {
          fitView({ duration: 200, padding: 0.3 });
        }
        initial.current = false;
      }
    });

    return () => t.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount, edgeCount]);
}

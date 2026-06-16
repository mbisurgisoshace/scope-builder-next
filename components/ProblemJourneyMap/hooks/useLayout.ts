'use client';

// Adapted from .claude/examples/react-flow/dynamic-layouting-pro-example/src/hooks/useLayout.ts
// Change from the original: x ↔ y are swapped so the tree grows left-to-right instead of top-to-bottom.
// Extended: vertical spacing is computed from each node's actual measured height so nodes with
// dynamic content (problems / solutions) never overlap their siblings.

import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import {
  useReactFlow,
  useStore,
  type Node,
  type Edge,
  type ReactFlowState,
} from '@xyflow/react';
import { stratify, tree, type HierarchyPointNode } from 'd3-hierarchy';
import { timer } from 'd3-timer';

const HORIZONTAL_DEPTH_SPACING = 420; // px between tree levels (left → right)
const VERTICAL_GAP = 40;              // px gap between siblings (top ↔ bottom)
const ANIMATION_DURATION = 300;

function nodeHeight(n: Node): number {
  return n.measured?.height ?? 120;
}

// Total vertical space a subtree needs (including the root node of that subtree).
function subtreeHeight(d: HierarchyPointNode<Node>): number {
  if (!d.children || d.children.length === 0) return nodeHeight(d.data);
  const childrenTotal =
    d.children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
    VERTICAL_GAP * (d.children.length - 1);
  return Math.max(nodeHeight(d.data), childrenTotal);
}

// Assign d.x (breadth → RF position.y) for every node in the subtree,
// centering each parent over its children and stacking siblings without overlap.
function assignVertical(d: HierarchyPointNode<Node>, topY: number): void {
  if (!d.children || d.children.length === 0) {
    d.x = topY + nodeHeight(d.data) / 2;
    return;
  }

  const childrenTotalH =
    d.children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
    VERTICAL_GAP * (d.children.length - 1);
  const totalH = Math.max(nodeHeight(d.data), childrenTotalH);

  d.x = topY + totalH / 2;

  let childTopY = topY + (totalH - childrenTotalH) / 2;
  for (const child of d.children) {
    assignVertical(child, childTopY);
    childTopY += subtreeHeight(child) + VERTICAL_GAP;
  }
}

function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  const hierarchy = stratify<Node>()
    .id((d) => d.id)
    .parentId((d) => edges.find((e) => e.target === d.id)?.source)(nodes);

  // Use d3 tree only for horizontal depth positions (d.y).
  // Vertical positions (d.x) are recomputed from actual measured heights below.
  const treeLayout = tree<Node>()
    .nodeSize([1, HORIZONTAL_DEPTH_SPACING])
    .separation(() => 1);
  const root = treeLayout(hierarchy);

  const rootH = subtreeHeight(root);
  assignVertical(root, -rootH / 2);

  // d.y = horizontal depth  → RF position.x (how far right)
  // d.x = center y          → RF position.y = top-left y (subtract half-height to convert)
  return root.descendants().map((d) => ({
    ...d.data,
    position: { x: d.y, y: d.x - nodeHeight(d.data) / 2 },
  }));
}

// Re-run when node/edge count changes OR when total measured height changes
// (i.e. a node grew because problems/solutions were added).
const nodeCountSelector = (state: ReactFlowState) => state.nodeLookup.size;
const edgeCountSelector = (state: ReactFlowState) => state.edges.length;
const totalHeightSelector = (state: ReactFlowState) =>
  [...state.nodeLookup.values()].reduce(
    (sum, n) => sum + (n.measured?.height ?? 0),
    0
  );

// setNodesState: when ReactFlow is in controlled mode, pass the useNodesState setter here
// so layout positions are written to the controlled state (not just the internal RF store,
// which gets overwritten on every re-render in controlled mode).
export function useLayout(setNodesState?: Dispatch<SetStateAction<Node[]>>) {
  const initial = useRef(true);
  const nodeCount = useStore(nodeCountSelector);
  const edgeCount = useStore(edgeCountSelector);
  const totalHeight = useStore(totalHeightSelector);
  const { getNodes, getNode, setNodes: setNodesInternal, getEdges, fitView } = useReactFlow();
  const setNodes = (setNodesState ?? setNodesInternal) as typeof setNodesInternal;

  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();

    if (nodes.length === 0) return;

    let targetNodes: Node[];
    try {
      targetNodes = layoutNodes(nodes, edges);
    } catch {
      // stratify throws if the graph isn't a valid tree (e.g. multiple roots
      // during a transient state while Liveblocks is syncing). Skip this tick.
      return;
    }

    const transitions = targetNodes.map((node) => ({
      id: node.id,
      from: getNode(node.id)?.position ?? node.position,
      to: node.position,
      node,
    }));

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
        setNodes(transitions.map(({ node, to }) => ({ ...node, position: to })));
        t.stop();

        if (!initial.current) {
          fitView({ duration: 200, padding: 0.3 });
        }
        initial.current = false;
      }
    });

    return () => t.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount, edgeCount, totalHeight]);
}

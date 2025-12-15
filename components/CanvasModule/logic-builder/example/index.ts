// logic/exampleGraph.ts

import { LogicGraph } from "../LogicGraph";
import { LogicConnection } from "../types";
import { NodeInstance } from "../NodeInstance";
import { createDefaultNodeRegistry } from "../NodeLibrary";

export function buildExampleGraph() {
  const registry = createDefaultNodeRegistry();

  const graph = new LogicGraph(
    { id: "graph-1", name: "Sample flow" },
    registry
  );

  // ─────────────────────────────
  // Create nodes
  // ─────────────────────────────

  const start = new NodeInstance({
    id: "node-start",
    typeId: "start",
  });

  const assign = new NodeInstance({
    id: "node-assign",
    typeId: "assign",
    config: {
      variableName: "x",
    },
  });

  const condition = new NodeInstance({
    id: "node-if",
    typeId: "if",
    // config could contain expression later; for now just a stub
  });

  const logNode = new NodeInstance({
    id: "node-log",
    typeId: "log",
  });

  const ret = new NodeInstance({
    id: "node-return",
    typeId: "return",
  });

  // Add them to the graph
  graph.addNode(start);
  graph.addNode(assign);
  graph.addNode(condition);
  graph.addNode(logNode);
  graph.addNode(ret);

  // ─────────────────────────────
  // Create connections
  // ─────────────────────────────

  const connections: LogicConnection[] = [
    // control: start → assign → if
    {
      id: "conn-start-assign",
      fromNodeId: "node-start",
      fromPortId: "out", // Start.out
      toNodeId: "node-assign",
      toPortId: "in", // Assign.in
    },
    {
      id: "conn-assign-if",
      fromNodeId: "node-assign",
      fromPortId: "out", // Assign.out
      toNodeId: "node-if",
      toPortId: "in", // If.in
    },

    // data: assign.result → if.condition
    {
      id: "conn-assign-if-cond",
      fromNodeId: "node-assign",
      fromPortId: "result", // Assign.result
      toNodeId: "node-if",
      toPortId: "condition", // If.condition
    },

    // If true branch → log
    {
      id: "conn-if-true-log",
      fromNodeId: "node-if",
      fromPortId: "true",
      toNodeId: "node-log",
      toPortId: "in",
    },

    // If false branch → return
    {
      id: "conn-if-false-return",
      fromNodeId: "node-if",
      fromPortId: "false",
      toNodeId: "node-return",
      toPortId: "in",
    },

    // Data: assign.result → log.value
    {
      id: "conn-assign-log-value",
      fromNodeId: "node-assign",
      fromPortId: "result",
      toNodeId: "node-log",
      toPortId: "value",
    },

    // Data: assign.result → return.value
    {
      id: "conn-assign-return-value",
      fromNodeId: "node-assign",
      fromPortId: "result",
      toNodeId: "node-return",
      toPortId: "value",
    },
  ];

  for (const conn of connections) {
    graph.addConnection(conn);
  }

  return { graph, registry };
}

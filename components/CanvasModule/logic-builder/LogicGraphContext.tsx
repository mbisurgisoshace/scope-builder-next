// logic/LogicGraphContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { LogicGraph } from "./LogicGraph";
import {
  InMemoryNodeDefinitionRegistry,
  NodeDefinitionRegistry,
} from "./NodeRegistry";
import { LogicGraphService } from "./LogicGraphService";
import { NodeDefinition } from "./NodeDefinition";

interface LogicGraphContextValue {
  graph: LogicGraph;
  registry: NodeDefinitionRegistry;
  service: LogicGraphService;
  refresh: () => void;

  // 👇 new for UI
  connectingFrom: { nodeId: string; portId: string } | null;
  beginConnection: (nodeId: string, portId: string) => void;
  completeConnection: (nodeId: string, portId: string) => void;
  cancelConnection: () => void;
}

const LogicGraphContext = createContext<LogicGraphContextValue | null>(null);

export const LogicGraphProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [version, setVersion] = useState(0);

  const [connectingFrom, setConnectingFrom] = useState<{
    nodeId: string;
    portId: string;
  } | null>(null);

  // 1) Registry – created once
  const registryRef = useRef<NodeDefinitionRegistry | null>(null);
  if (!registryRef.current) {
    const registry = new InMemoryNodeDefinitionRegistry();
    registry.register(
      new NodeDefinition({
        typeId: "logic/function",
        label: "Function",
        ports: [
          // Inputs
          {
            id: "arg:a",
            name: "a",
            kind: "input",
            channel: "data",
            valueType: "number",
          },
          {
            id: "arg:b",
            name: "b",
            kind: "input",
            channel: "data",
            valueType: "number",
          },

          // Output
          {
            id: "return",
            name: "return",
            kind: "output",
            channel: "data",
            valueType: "number",
          },
        ],
      })
    );

    // TODO: register your node definitions here
    // e.g.:
    // registerDefaultLogicNodes(registry);

    registryRef.current = registry;
  }

  // 2) LogicGraph – created once with (props, registry)
  const graphRef = useRef<LogicGraph | null>(null);
  if (!graphRef.current) {
    graphRef.current = new LogicGraph(
      {
        id: "main-logic-graph",
        name: "Main Logic Graph",
      },
      registryRef.current!
    );
  }

  // 3) Service – thin wrapper around the domain
  const serviceRef = useRef<LogicGraphService | null>(null);
  if (!serviceRef.current) {
    serviceRef.current = new LogicGraphService(graphRef.current!);
  }

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  const beginConnection = useCallback((nodeId: string, portId: string) => {
    setConnectingFrom({ nodeId, portId });
  }, []);

  const completeConnection = useCallback(
    (nodeId: string, portId: string) => {
      if (!connectingFrom) return;

      const from = connectingFrom;
      const to = { nodeId, portId };

      // avoid self-connecting same port
      if (from.nodeId === to.nodeId && from.portId === to.portId) {
        setConnectingFrom(null);
        return;
      }

      try {
        serviceRef.current!.connectPorts({
          fromNodeId: from.nodeId,
          fromPortId: from.portId,
          toNodeId: to.nodeId,
          toPortId: to.portId,
        });
        refresh();
      } catch (err) {
        console.error("Failed to connect ports:", err);
        // later: toast / inline error
      } finally {
        setConnectingFrom(null);
      }
    },
    [connectingFrom, refresh]
  );

  const cancelConnection = useCallback(() => {
    setConnectingFrom(null);
  }, []);

  const value = useMemo<LogicGraphContextValue>(
    () => ({
      graph: graphRef.current!,
      registry: registryRef.current!,
      service: serviceRef.current!,
      refresh,
      connectingFrom,
      beginConnection,
      completeConnection,
      cancelConnection,
    }),
    [
      version,
      refresh,
      connectingFrom,
      beginConnection,
      completeConnection,
      cancelConnection,
    ]
  );

  return (
    <LogicGraphContext.Provider value={value}>
      {children}
    </LogicGraphContext.Provider>
  );
};

export function useLogicGraph(): LogicGraphContextValue {
  const ctx = useContext(LogicGraphContext);
  if (!ctx) {
    throw new Error("useLogicGraph must be used within LogicGraphProvider");
  }
  return ctx;
}

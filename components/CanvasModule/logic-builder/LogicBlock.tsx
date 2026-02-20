"use client";

import React from "react";
import { Shape as IShape } from "../types";
import { ShapeFrameProps } from "../blocks/BlockFrame";

import { LogicNodeBlock } from "./LogicNodeBlock"; // your If block
import { FunctionNodeBlock } from "./FunctionNodeBlock"; // new one

type Props = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  // keep this optional so you can pass it later from InfiniteCanvas
  onSpawnLinkedNode?: (args: { fromNodeId: any; fromPortId: any }) => void;
};

export const LogicBlock: React.FC<Props> = (props) => {
  const { shape } = props;

  console.log("shape", shape);

  const logicTypeId =
    (shape as any).logicTypeId ??
    (shape as any).data?.logicTypeId ??
    "logic/if";

  console.log("logicTypeId", logicTypeId);

  if (logicTypeId === "logic/function") {
    return <FunctionNodeBlock {...props} />;
  }

  // default = If
  return <LogicNodeBlock {...props} />;
};

"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

export function JourneyEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const { getEdges } = useReactFlow();

  // Determine if this edge needs an "Option N" label (source has multiple children)
  const siblingsFromSource = getEdges().filter((e) => e.source === source);
  const showLabel = siblingsFromSource.length > 1;
  const optionIndex = siblingsFromSource.findIndex((e) => e.id === id) + 1;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: "#A198BA", strokeWidth: 1.5, ...style }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan absolute pointer-events-none"
            style={{
              transform: `translate(${labelX}px, ${labelY}px) translate(-50%, -50%)`,
            }}
          >
            <span className="text-[10px] font-medium text-gray-400 bg-white px-1.5 py-0.5 rounded-full border border-gray-200 shadow-sm">
              Option {optionIndex}
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

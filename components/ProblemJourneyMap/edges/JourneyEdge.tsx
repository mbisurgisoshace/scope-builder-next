"use client";

import { useCallback, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { useJourneyContext, type JourneyEdgeData } from "../JourneyContext";

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
  data,
}: EdgeProps) {
  const { getEdges } = useReactFlow();
  const { readOnly, updateEdgeLabel } = useJourneyContext();

  const edgeData = data as unknown as JourneyEdgeData | undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Determine if this edge needs an "Option N" label (source has multiple children)
  const siblingsFromSource = getEdges().filter((e) => e.source === source);
  const showLabel = siblingsFromSource.length > 1;
  const optionIndex = siblingsFromSource.findIndex((e) => e.id === id) + 1;

  // A custom label wins; an absent or blank one falls back to the derived
  // numbering, which renumbers as siblings are added or removed.
  const displayLabel = edgeData?.label?.trim() || `Option ${optionIndex}`;

  const startEdit = useCallback(() => {
    if (readOnly) return;
    setDraft(edgeData?.label ?? "");
    setEditing(true);
  }, [readOnly, edgeData?.label]);

  const commit = useCallback(() => {
    setEditing(false);
    updateEdgeLabel(id, draft.trim());
  }, [id, draft, updateEdgeLabel]);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const centerX = (sourceX + targetX) / 2;
  const labelX = (centerX + targetX) / 2;
  const labelY = targetY;

  const pillClasses =
    "text-sm leading-none font-medium text-[#111827] bg-white px-1.5 py-0.5 rounded-full border border-gray-300";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: "#7A7099", strokeWidth: 1.5, ...style }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            className={`nodrag nopan absolute ${
              readOnly ? "pointer-events-none" : "pointer-events-auto"
            }`}
            style={{
              transform: `translate(${labelX}px, ${labelY}px) translate(-50%, -55%)`,
            }}
          >
            {editing ? (
              <input
                autoFocus
                value={draft}
                placeholder={`Option ${optionIndex}`}
                // The label sits over the pane, so keep pointer and key events
                // from reaching React Flow (pan, zoom, shortcuts).
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setEditing(false);
                  }
                }}
                style={{ width: `${Math.max(draft.length, 8)}ch` }}
                className={`${pillClasses} outline-none focus:border-[#6A35FF]`}
              />
            ) : (
              <span
                onDoubleClick={startEdit}
                title={readOnly ? undefined : "Double-click to rename"}
                className={`${pillClasses} ${readOnly ? "" : "cursor-text"}`}
              >
                {displayLabel}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

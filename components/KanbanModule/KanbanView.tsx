"use client";

import { v4 as uuidv4 } from "uuid";
import { PlusCircleIcon, PlusIcon } from "lucide-react";
import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";
import { Button } from "../ui/button";
import { CardType, Shape } from "../CanvasModule/types";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "./SortableItem";
import { useCallback, useEffect, useMemo, useState } from "react";
import { KanbanBoardCategory } from "@/lib/generated/prisma";
import Board from "./Board";
import BoardItem from "./BoardItem";

interface KanbanViewProps {
  kanbanBoards: KanbanBoardCategory[];
}

export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
  const { shapes, addShape, updateShape } = useRealtimeShapes();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [containers, setContainers] = useState<
    (KanbanBoardCategory & { shapes: Shape[] })[]
  >(
    kanbanBoards.map((b) => {
      const boardShapes = [];
      for (const id of b.shape_ids) {
        const shape = shapes.find((s) => s.id === id);
        if (shape) boardShapes.push(shape);
      }
      return { ...b, shapes: boardShapes };
    })
  );

  useEffect(() => {}, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const add = (type: string) => {
    const id = uuidv4();
    addShape("card", 20, 20, id);
    updateShape(id, (s) => ({ ...s, subtype: type as CardType }));
  };

  // Helper: returns ordered shapes for a given board key
  const getBoardItems = useCallback(
    (board: KanbanBoardCategory) =>
      shapes
        .filter((s) => board.shape_ids.includes(s.id))
        .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0)),
    [shapes]
  );

  const findBoardKeyForShape = useCallback(
    (shapeId: string): string | null => {
      for (const b of kanbanBoards) {
        if (b.shape_ids.includes(shapeId)) return String(b.id);
      }
      return null;
    },
    [kanbanBoards]
  );

  const boardIdSet = useMemo(
    () => new Set(kanbanBoards.map((b) => String(b.id))),
    [kanbanBoards]
  );
  const itemIdSet = useMemo(
    () => new Set(kanbanBoards.flatMap((b) => b.shape_ids.map(String))),
    [kanbanBoards]
  );
  const isBoardId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && boardIdSet.has(String(id)),
    [boardIdSet]
  );
  const isItemId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && itemIdSet.has(String(id)),
    [itemIdSet]
  );

  // Reorder within a single board: rewrite kanbanOrder sequentially (robust & smooth)
  const reorderWithinBoard = useCallback(
    (boardKey: string, fromId: string, toId: string) => {
      const board = kanbanBoards.find((b) => String(b.id) === boardKey);
      if (!board) return;

      const ordered = getBoardItems(board);
      const ids = ordered.map((s) => s.id);

      const fromIdx = ids.indexOf(fromId);
      const toIdx = ids.indexOf(toId);
      if (fromIdx === -1 || toIdx === -1) return;

      const moved = arrayMove(ids, fromIdx, toIdx);

      // Normalizamos kanbanOrder (espaciado 1000)
      moved.forEach((id, idx) => {
        const nextOrder = (idx + 1) * 1000;
        const current = ordered.find((s) => s.id === id);
        if (!current || current.kanbanOrder === nextOrder) return;
        updateShape(id, (s) => ({ ...s, kanbanOrder: nextOrder }));
      });
    },
    [kanbanBoards, getBoardItems, updateShape]
  );

  // Drag end handler (per-board because each board has its own DndContext)
  const makeHandleDragEnd = (boardKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderWithinBoard(boardKey, String(active.id), String(over.id));
  };

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const { id } = active;
    setActiveId(id);
  }

  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;

    // Handle Items Sorting
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("item") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active container and over container
      // const activeContainer = findValueOfItems(active.id, "item");
      // const overContainer = findValueOfItems(over.id, "item");
      // // If the active or over container is not found, return
      // if (!activeContainer || !overContainer) return;
      // // Find the index of the active and over container
      // const activeContainerIndex = containers.findIndex(
      //   (container) => container.id === activeContainer.id
      // );
      // const overContainerIndex = containers.findIndex(
      //   (container) => container.id === overContainer.id
      // );
      // // Find the index of the active and over item
      // const activeitemIndex = activeContainer.items.findIndex(
      //   (item) => item.id === active.id
      // );
      // const overitemIndex = overContainer.items.findIndex(
      //   (item) => item.id === over.id
      // );
      // // In the same container
      // if (activeContainerIndex === overContainerIndex) {
      //   let newItems = [...containers];
      //   newItems[activeContainerIndex].items = arrayMove(
      //     newItems[activeContainerIndex].items,
      //     activeitemIndex,
      //     overitemIndex
      //   );
      //   setContainers(newItems);
      // } else {
      //   // In different containers
      //   let newItems = [...containers];
      //   const [removeditem] = newItems[activeContainerIndex].items.splice(
      //     activeitemIndex,
      //     1
      //   );
      //   newItems[overContainerIndex].items.splice(
      //     overitemIndex,
      //     0,
      //     removeditem
      //   );
      //   setContainers(newItems);
      // }
    }

    // Handling Item Drop Into a Container
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      // const activeContainer = findValueOfItems(active.id, "item");
      // const overContainer = findValueOfItems(over.id, "container");
      // // If the active or over container is not found, return
      // if (!activeContainer || !overContainer) return;
      // // Find the index of the active and over container
      // const activeContainerIndex = containers.findIndex(
      //   (container) => container.id === activeContainer.id
      // );
      // const overContainerIndex = containers.findIndex(
      //   (container) => container.id === overContainer.id
      // );
      // // Find the index of the active and over item
      // const activeitemIndex = activeContainer.items.findIndex(
      //   (item) => item.id === active.id
      // );
      // // Remove the active item from the active container and add it to the over container
      // let newItems = [...containers];
      // const [removeditem] = newItems[activeContainerIndex].items.splice(
      //   activeitemIndex,
      //   1
      // );
      // newItems[overContainerIndex].items.push(removeditem);
      // setContainers(newItems);
    }
  };

  // This is the function that handles the sorting of the containers and items when the user is done dragging.
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // Handling Container Sorting
    if (
      active.id.toString().includes("container") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === active.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === over.id
      );
      // Swap the active and over container
      let newItems = [...containers];
      newItems = arrayMove(newItems, activeContainerIndex, overContainerIndex);
      setContainers(newItems);
    }

    function findValueOfItems(id: UniqueIdentifier | undefined, type: string) {
      if (type === "container") {
        return containers.find((item) => item.id === id);
      }
      if (type === "item") {
        return containers.find((container) =>
          container.shapes.find((item) => item.id === id)
        );
      }
    }

    console.log("active, over", active, over);

    // Handling item Sorting
    if (
      isItemId(active?.id) &&
      isItemId(over?.id) &&
      active &&
      over &&
      active.id !== over.id
    ) {
      const fromId = String(active.id);
      const toId = String(over.id);

      const fromBoardKey = findBoardKeyForShape(fromId);
      const toBoardKey = findBoardKeyForShape(toId);
      if (!fromBoardKey || !toBoardKey) return;
      if (fromBoardKey === toBoardKey) {
        reorderWithinBoard(fromBoardKey, fromId, toId);
      }
      // Find the active and over container
      // const activeContainer = findValueOfItems(active.id, "item");
      // const overContainer = findValueOfItems(over.id, "item");

      // // If the active or over container is not found, return
      // if (!activeContainer || !overContainer) return;
      // // Find the index of the active and over container
      // const activeContainerIndex = containers.findIndex(
      //   (container) => container.id === activeContainer.id
      // );
      // const overContainerIndex = containers.findIndex(
      //   (container) => container.id === overContainer.id
      // );
      // // Find the index of the active and over item
      // const activeitemIndex = activeContainer.shapes.findIndex(
      //   (item) => item.id === active.id
      // );
      // const overitemIndex = overContainer.shapes.findIndex(
      //   (item) => item.id === over.id
      // );

      // // In the same container
      // if (activeContainerIndex === overContainerIndex) {
      //   let newItems = [...containers];
      //   newItems[activeContainerIndex].shapes = arrayMove(
      //     newItems[activeContainerIndex].shapes,
      //     activeitemIndex,
      //     overitemIndex
      //   );
      //   setContainers(newItems);
      // } else {
      //   // In different containers
      //   let newItems = [...containers];
      //   const [removeditem] = newItems[activeContainerIndex].shapes.splice(
      //     activeitemIndex,
      //     1
      //   );
      //   newItems[overContainerIndex].shapes.splice(
      //     overitemIndex,
      //     0,
      //     removeditem
      //   );
      //   setContainers(newItems);
      // }
    }
    // Handling item dropping into Container
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("container") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      //   const activeContainer = findValueOfItems(active.id, "item");
      //   const overContainer = findValueOfItems(over.id, "container");
      //   // If the active or over container is not found, return
      //   if (!activeContainer || !overContainer) return;
      //   // Find the index of the active and over container
      //   const activeContainerIndex = containers.findIndex(
      //     (container) => container.id === activeContainer.id
      //   );
      //   const overContainerIndex = containers.findIndex(
      //     (container) => container.id === overContainer.id
      //   );
      //   // Find the index of the active and over item
      //   const activeitemIndex = activeContainer.items.findIndex(
      //     (item) => item.id === active.id
      //   );
      //   let newItems = [...containers];
      //   const [removeditem] = newItems[activeContainerIndex].items.splice(
      //     activeitemIndex,
      //     1
      //   );
      //   newItems[overContainerIndex].items.push(removeditem);
      //   setContainers(newItems);
      // }
      // setActiveId(null);
    }
  }

  console.log("containers", containers);

  return (
    <div className="min-h-0">
      <div className="flex w-full h-full gap-4 px-2 pb-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* @ts-ignore */}
          <SortableContext
            items={containers.map((b) => b.id.toString() as UniqueIdentifier)}
          >
            {containers.map((board) => {
              const boardItems = getBoardItems(board);
              const ids = boardItems.map((s) => s.id);
              return (
                <Board
                  id={board.id}
                  title={board.name}
                  key={board.id}
                  // onAddItem={() => {
                  //   setShowAddItemModal(true);
                  //   setCurrentContainerId(container.id);
                  // }}
                >
                  {/* @ts-ignore */}
                  <SortableContext items={ids}>
                    <div className="flex-1 min-h-0  p-1 space-y-2">
                      {boardItems.map((shape) => (
                        <BoardItem key={shape.id} shape={shape} />
                      ))}
                    </div>
                  </SortableContext>
                </Board>
              );
            })}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

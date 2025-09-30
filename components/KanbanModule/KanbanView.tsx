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
import { useCallback, useEffect, useState } from "react";
import { KanbanBoardCategory } from "@/lib/generated/prisma";
import Board from "./Board";
import BoardItem from "./BoardItem";

interface KanbanViewProps {
  kanbanBoards: KanbanBoardCategory[];
}

export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
  const [containers, setContainers] = useState<KanbanBoardCategory[]>([]);
  const { shapes, addShape, updateShape } = useRealtimeShapes();

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

  // Reorder within a single board: rewrite kanbanOrder sequentially (robust & smooth)
  const reorderWithinBoard = useCallback(
    (boardKey: string, fromId: string, toId: string) => {
      const board = kanbanBoards.find((b) => b.id.toString() === boardKey);
      const boardItems = getBoardItems(board!);
      const ids = boardItems.map((s) => s.id);

      const oldIndex = ids.indexOf(fromId);
      const newIndex = ids.indexOf(toId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newIds = arrayMove(ids, oldIndex, newIndex);

      // write back normalized order (index * 1000)
      newIds.forEach((id, idx) => {
        //const target = shapes.find((s) => s.id === id);
        const target = boardItems.find((s) => s.id === id);
        const nextOrder = (idx + 1) * 1000;

        if (!target || target.kanbanOrder === nextOrder) return;
        updateShape(id, (s) => ({ ...s, kanbanOrder: nextOrder }));
      });
    },
    [getBoardItems, updateShape]
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
    //setActiveId(id);
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
        // return containers.find((container) =>
        //   container.items.find((item) => item.id === id)
        // );
      }
    }

    // Handling item Sorting
    if (
      active.id.toString().includes("item") &&
      over?.id.toString().includes("item") &&
      active &&
      over &&
      active.id !== over.id
    ) {
      // Find the active and over container
      const activeContainer = findValueOfItems(active.id, "item");
      const overContainer = findValueOfItems(over.id, "item");

      // If the active or over container is not found, return
      if (!activeContainer || !overContainer) return;
      // Find the index of the active and over container
      const activeContainerIndex = containers.findIndex(
        (container) => container.id === activeContainer.id
      );
      const overContainerIndex = containers.findIndex(
        (container) => container.id === overContainer.id
      );
      // Find the index of the active and over item
      // const activeitemIndex = activeContainer.items.findIndex(
      //   (item) => item.id === active.id
      // );
      // const overitemIndex = overContainer.items.findIndex(
      //   (item) => item.id === over.id
      // );

      // In the same container
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

    return (
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="flex w-full h-full gap-4 px-2 pb-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            // onDragStart={handleDragStart}
            // onDragMove={handleDragMove}
            // onDragEnd={handleDragEnd}
          >
            {/* @ts-ignore */}
            <SortableContext
              items={kanbanBoards.map(
                (b) => b.id.toString() as UniqueIdentifier
              )}
            >
              {kanbanBoards.map((board) => {
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
                      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1 space-y-2">
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
}

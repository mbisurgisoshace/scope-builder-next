// "use client";

// import { v4 as uuidv4 } from "uuid";
// import { PlusCircleIcon, PlusIcon } from "lucide-react";
// import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
// import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";
// import { Button } from "../ui/button";
// import { CardType, Shape } from "../CanvasModule/types";
// import {
//   DndContext,
//   DragEndEvent,
//   DragMoveEvent,
//   DragStartEvent,
//   KeyboardSensor,
//   PointerSensor,
//   UniqueIdentifier,
//   useSensor,
//   useSensors,
//   closestCorners,
//   rectIntersection,
//   pointerWithin,
//   type CollisionDetection,
//   DragOverlay,
//   DragOverEvent,
// } from "@dnd-kit/core";
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
// } from "@dnd-kit/sortable";

// import { SortableItem } from "./SortableItem";
// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { KanbanBoardCategory } from "@/lib/generated/prisma";
// import Board from "./Board";
// import BoardItem from "./BoardItem";

// interface KanbanViewProps {
//   kanbanBoards: KanbanBoardCategory[];
// }

// export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
//   const { shapes, addShape, updateShape } = useRealtimeShapes();
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [containers, setContainers] = useState<
//     (KanbanBoardCategory & { shapes: Shape[] })[]
//   >(
//     kanbanBoards.map((b) => {
//       const boardShapes = [];
//       for (const id of b.shape_ids) {
//         const shape = shapes.find((s) => s.id === id);
//         if (shape) boardShapes.push(shape);
//       }
//       return { ...b, shapes: boardShapes };
//     })
//   );

//   useEffect(() => {}, []);

//   const sensors = useSensors(
//     useSensor(PointerSensor, {
//       activationConstraint: {
//         //delay: 100,
//         distance: 5,
//       },
//     }),
//     useSensor(KeyboardSensor, {
//       coordinateGetter: sortableKeyboardCoordinates,
//     })
//   );

//   const findContainerIndexByBoardKey = useCallback(
//     (boardKey: string) =>
//       containers.findIndex((c) => String(c.id) === boardKey),
//     [containers]
//   );
//   const findContainerIndexByItemId = useCallback(
//     (shapeId: string) =>
//       containers.findIndex((c) => c.shapes.some((s) => s.id === shapeId)),
//     [containers]
//   );

//   const shapeById = useCallback(
//     (id: string) => shapes.find((s) => s.id === id),
//     [shapes]
//   );

//   const add = (type: string) => {
//     const id = uuidv4();
//     addShape("card", 20, 20, id);
//     updateShape(id, (s) => ({ ...s, subtype: type as CardType }));
//   };

//   // Helper: returns ordered shapes for a given board key
//   const getBoardItems = useCallback(
//     (board: KanbanBoardCategory) =>
//       shapes
//         .filter((s) => board.shape_ids.includes(s.id))
//         .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0)),
//     [shapes]
//   );

//   const findBoardKeyForShape = useCallback(
//     (shapeId: string): string | null => {
//       for (const b of kanbanBoards) {
//         if (b.shape_ids.includes(shapeId)) return String(b.id);
//       }
//       return null;
//     },
//     [kanbanBoards]
//   );

//   const [boardItemsMap, setBoardItemsMap] = useState<Record<string, string[]>>(
//     {}
//   );
//   const initializedRef = useRef(false);

//   // Inicializa mapa local desde props + shapes (orden por kanbanOrder)
//   useEffect(() => {
//     if (initializedRef.current) return;
//     const init: Record<string, string[]> = {};
//     for (const b of kanbanBoards) {
//       const ids = b.shape_ids.filter((id) => !!shapeById(id));
//       const ordered = [...ids].sort(
//         (a, b) =>
//           (shapeById(a)?.kanbanOrder ?? 0) - (shapeById(b)?.kanbanOrder ?? 0)
//       );
//       init[String(b.id)] = ordered;
//     }
//     setBoardItemsMap(init);
//     initializedRef.current = true;
//   }, [kanbanBoards, shapeById]);

//   // Si aún no inicializamos, usamos shape_ids como fallback
//   const getIdsForBoard = useCallback(
//     (board: KanbanBoardCategory) =>
//       boardItemsMap[String(board.id)] ?? board.shape_ids,
//     [boardItemsMap]
//   );

//   // Reescribe kanbanOrder en un set de ids (espaciado 1000)
//   const normalizeOrders = useCallback(
//     (ids: string[]) => {
//       ids.forEach((id, idx) => {
//         const nextOrder = (idx + 1) * 1000;
//         const current = shapeById(id);
//         if (current && current.kanbanOrder !== nextOrder) {
//           updateShape(id, (s) => ({ ...s, kanbanOrder: nextOrder }));
//         }
//       });
//     },
//     [shapeById, updateShape]
//   );

//   const boardIdSet = useMemo(
//     () => new Set(kanbanBoards.map((b) => String(b.id))),
//     [kanbanBoards]
//   );
//   const itemIdSet = useMemo(
//     () => new Set(kanbanBoards.flatMap((b) => b.shape_ids.map(String))),
//     [kanbanBoards]
//   );
//   const isBoardId = useCallback(
//     (id?: UniqueIdentifier | null) => !!id && boardIdSet.has(String(id)),
//     [boardIdSet]
//   );
//   const isItemId = useCallback(
//     (id?: UniqueIdentifier | null) => !!id && itemIdSet.has(String(id)),
//     [itemIdSet]
//   );

//   // Reorder within a single board: rewrite kanbanOrder sequentially (robust & smooth)
//   const reorderWithinBoard = useCallback(
//     (boardKey: string, fromId: string, toId: string) => {
//       const board = kanbanBoards.find((b) => String(b.id) === boardKey);
//       if (!board) return;

//       const ordered = getBoardItems(board);
//       const ids = ordered.map((s) => s.id);

//       const fromIdx = ids.indexOf(fromId);
//       const toIdx = ids.indexOf(toId);
//       if (fromIdx === -1 || toIdx === -1) return;

//       const moved = arrayMove(ids, fromIdx, toIdx);

//       // Normalizamos kanbanOrder (espaciado 1000)
//       moved.forEach((id, idx) => {
//         const nextOrder = (idx + 1) * 1000;
//         const current = ordered.find((s) => s.id === id);
//         if (!current || current.kanbanOrder === nextOrder) return;
//         updateShape(id, (s) => ({ ...s, kanbanOrder: nextOrder }));
//       });
//     },
//     [kanbanBoards, getBoardItems, updateShape]
//   );

//   const reorderWithinBoardPreview = useCallback(
//     (boardKey: string, fromId: string, toId: string) => {
//       setBoardItemsMap((prev) => {
//         const ids = prev[boardKey] ?? [];
//         const oldIndex = ids.indexOf(fromId);
//         const newIndex = ids.indexOf(toId);
//         if (oldIndex === -1 || newIndex === -1) return prev;
//         return { ...prev, [boardKey]: arrayMove(ids, oldIndex, newIndex) };
//       });
//     },
//     []
//   );

//   const reorderWithinBoardCommit = useCallback(
//     (boardKey: string) => {
//       const ids = boardItemsMap[boardKey] ?? [];
//       normalizeOrders(ids);
//     },
//     [boardItemsMap, normalizeOrders]
//   );

//   const moveAcrossBoardsPreview = useCallback(
//     (
//       fromBoardKey: string,
//       toBoardKey: string,
//       shapeId: string,
//       toIndex?: number
//     ) => {
//       if (fromBoardKey === toBoardKey) return;
//       setBoardItemsMap((prev) => {
//         const from = prev[fromBoardKey] ?? [];
//         const to = prev[toBoardKey] ?? [];
//         if (!from.includes(shapeId)) return prev;
//         const newFrom = from.filter((id) => id !== shapeId);
//         const cleanTo = to.filter((id) => id !== shapeId);
//         const insertAt =
//           typeof toIndex === "number"
//             ? Math.max(0, Math.min(cleanTo.length, toIndex))
//             : cleanTo.length;
//         const newTo = [
//           ...cleanTo.slice(0, insertAt),
//           shapeId,
//           ...cleanTo.slice(insertAt),
//         ];
//         return { ...prev, [fromBoardKey]: newFrom, [toBoardKey]: newTo };
//       });
//     },
//     []
//   );

//   // Put these near your other callbacks

//   // Preview: reorder within same board while hovering a different item
//   const previewReorder = useCallback(
//     (boardKey: string, fromId: string, toId: string) => {
//       setBoardItemsMap((prev) => {
//         const ids = prev[boardKey] ?? [];
//         const fromIdx = ids.indexOf(fromId);
//         const toIdx = ids.indexOf(toId);
//         if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) return prev;
//         return { ...prev, [boardKey]: arrayMove(ids, fromIdx, toIdx) };
//       });
//     },
//     []
//   );

//   // Preview: move into another board while hovering either a card (insert before) or the board (append)
//   const previewMove = useCallback(
//     (
//       fromBoardKey: string,
//       toBoardKey: string,
//       shapeId: string,
//       toIndex?: number
//     ) => {
//       if (!fromBoardKey || !toBoardKey || fromBoardKey === toBoardKey) return;
//       setBoardItemsMap((prev) => {
//         const from = prev[fromBoardKey] ?? [];
//         const to = prev[toBoardKey] ?? [];
//         if (!from.includes(shapeId)) return prev;

//         const newFrom = from.filter((id) => id !== shapeId);
//         const cleanTo = to.filter((id) => id !== shapeId);
//         const insertAt =
//           typeof toIndex === "number"
//             ? Math.max(0, Math.min(cleanTo.length, toIndex))
//             : cleanTo.length;

//         const newTo = [
//           ...cleanTo.slice(0, insertAt),
//           shapeId,
//           ...cleanTo.slice(insertAt),
//         ];

//         return { ...prev, [fromBoardKey]: newFrom, [toBoardKey]: newTo };
//       });
//     },
//     []
//   );

//   function handleDragOver(event: DragOverEvent) {
//     const { active, over } = event;
//     if (!active || !over) return;

//     const activeType = active.data.current?.type as
//       | "item"
//       | "board"
//       | undefined;
//     const overType = over.data.current?.type as "item" | "board" | undefined;
//     if (activeType !== "item") return;

//     const fromId = String(active.id);

//     setContainers((prev) => {
//       const next = [...prev];

//       const srcBoardIdx = findContainerIndexByItemId(fromId);
//       if (srcBoardIdx < 0) return prev;

//       const srcList = [...next[srcBoardIdx].shapes];
//       const srcIdx = srcList.findIndex((s) => s.id === fromId);
//       if (srcIdx < 0) return prev;

//       // A) hovering another item -> insert BEFORE that item
//       if (overType === "item" && fromId !== String(over.id)) {
//         const toId = String(over.id);
//         const dstBoardIdx = findContainerIndexByItemId(toId);
//         if (dstBoardIdx < 0) return prev;

//         const dstList =
//           dstBoardIdx === srcBoardIdx ? srcList : [...next[dstBoardIdx].shapes];
//         const dstIdx = dstList.findIndex((s) => s.id === toId);
//         if (dstIdx < 0) return prev;

//         const [moved] = srcList.splice(srcIdx, 1);
//         if (dstBoardIdx === srcBoardIdx) {
//           // reorder within same board
//           srcList.splice(dstIdx, 0, moved);
//           next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
//         } else {
//           // move across boards
//           dstList.splice(dstIdx, 0, moved);
//           next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
//           next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
//         }
//         return next;
//       }

//       // B) hovering board background -> append to that column
//       if (overType === "board") {
//         const dstBoardKey =
//           (over.data.current?.boardKey as string) ?? String(over.id);
//         const dstBoardIdx = findContainerIndexByBoardKey(dstBoardKey);
//         if (dstBoardIdx < 0 || dstBoardIdx === srcBoardIdx) return prev;

//         const dstList = [...next[dstBoardIdx].shapes];
//         const [moved] = srcList.splice(srcIdx, 1);
//         dstList.push(moved);

//         next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
//         next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
//         return next;
//       }

//       return prev;
//     });
//   }

//   const moveAcrossBoards = useCallback(
//     (
//       fromBoardKey: string,
//       toBoardKey: string,
//       shapeId: string,
//       toIndex?: number
//     ) => {
//       if (fromBoardKey === toBoardKey) return;

//       setBoardItemsMap((prev) => {
//         const from = prev[fromBoardKey] ?? [];
//         const to = prev[toBoardKey] ?? [];
//         if (!from.includes(shapeId)) return prev;

//         const newFrom = from.filter((id) => id !== shapeId);
//         const cleanTo = to.filter((id) => id !== shapeId);
//         const insertAt =
//           typeof toIndex === "number"
//             ? Math.max(0, Math.min(cleanTo.length, toIndex))
//             : cleanTo.length;
//         const newTo = [
//           ...cleanTo.slice(0, insertAt),
//           shapeId,
//           ...cleanTo.slice(insertAt),
//         ];

//         // Normalizamos órdenes en ambos boards
//         normalizeOrders(newFrom);
//         normalizeOrders(newTo);

//         // ✅ NEW: Persistimos cambios en DB (membresía + orden final)
//         // void persistMoveAcrossBoards({
//         //   shapeId,
//         //   fromBoardKey,
//         //   toBoardKey,
//         //   newFromIds: newFrom,
//         //   newToIds: newTo,
//         //   toIndex: insertAt,
//         // });

//         return { ...prev, [fromBoardKey]: newFrom, [toBoardKey]: newTo };
//       });
//     },
//     [normalizeOrders]
//   );

//   // Drag end handler (per-board because each board has its own DndContext)
//   const makeHandleDragEnd = (boardKey: string) => (event: DragEndEvent) => {
//     const { active, over } = event;
//     if (!over || active.id === over.id) return;
//     reorderWithinBoard(boardKey, String(active.id), String(over.id));
//   };

//   // function handleDragStart(event: DragStartEvent) {
//   //   const { active } = event;
//   //   const { id } = active;
//   //   setActiveId(id);
//   // }

//   // const handleDragMove = (event: DragMoveEvent) => {
//   //   const { active, over } = event;

//   //   // Handle Items Sorting
//   //   if (
//   //     active.id.toString().includes("item") &&
//   //     over?.id.toString().includes("item") &&
//   //     active &&
//   //     over &&
//   //     active.id !== over.id
//   //   ) {
//   //     // Find the active container and over container
//   //     // const activeContainer = findValueOfItems(active.id, "item");
//   //     // const overContainer = findValueOfItems(over.id, "item");
//   //     // // If the active or over container is not found, return
//   //     // if (!activeContainer || !overContainer) return;
//   //     // // Find the index of the active and over container
//   //     // const activeContainerIndex = containers.findIndex(
//   //     //   (container) => container.id === activeContainer.id
//   //     // );
//   //     // const overContainerIndex = containers.findIndex(
//   //     //   (container) => container.id === overContainer.id
//   //     // );
//   //     // // Find the index of the active and over item
//   //     // const activeitemIndex = activeContainer.items.findIndex(
//   //     //   (item) => item.id === active.id
//   //     // );
//   //     // const overitemIndex = overContainer.items.findIndex(
//   //     //   (item) => item.id === over.id
//   //     // );
//   //     // // In the same container
//   //     // if (activeContainerIndex === overContainerIndex) {
//   //     //   let newItems = [...containers];
//   //     //   newItems[activeContainerIndex].items = arrayMove(
//   //     //     newItems[activeContainerIndex].items,
//   //     //     activeitemIndex,
//   //     //     overitemIndex
//   //     //   );
//   //     //   setContainers(newItems);
//   //     // } else {
//   //     //   // In different containers
//   //     //   let newItems = [...containers];
//   //     //   const [removeditem] = newItems[activeContainerIndex].items.splice(
//   //     //     activeitemIndex,
//   //     //     1
//   //     //   );
//   //     //   newItems[overContainerIndex].items.splice(
//   //     //     overitemIndex,
//   //     //     0,
//   //     //     removeditem
//   //     //   );
//   //     //   setContainers(newItems);
//   //     // }
//   //   }

//   //   // Handling Item Drop Into a Container
//   //   if (
//   //     active.id.toString().includes("item") &&
//   //     over?.id.toString().includes("container") &&
//   //     active &&
//   //     over &&
//   //     active.id !== over.id
//   //   ) {
//   //     // Find the active and over container
//   //     // const activeContainer = findValueOfItems(active.id, "item");
//   //     // const overContainer = findValueOfItems(over.id, "container");
//   //     // // If the active or over container is not found, return
//   //     // if (!activeContainer || !overContainer) return;
//   //     // // Find the index of the active and over container
//   //     // const activeContainerIndex = containers.findIndex(
//   //     //   (container) => container.id === activeContainer.id
//   //     // );
//   //     // const overContainerIndex = containers.findIndex(
//   //     //   (container) => container.id === overContainer.id
//   //     // );
//   //     // // Find the index of the active and over item
//   //     // const activeitemIndex = activeContainer.items.findIndex(
//   //     //   (item) => item.id === active.id
//   //     // );
//   //     // // Remove the active item from the active container and add it to the over container
//   //     // let newItems = [...containers];
//   //     // const [removeditem] = newItems[activeContainerIndex].items.splice(
//   //     //   activeitemIndex,
//   //     //   1
//   //     // );
//   //     // newItems[overContainerIndex].items.push(removeditem);
//   //     // setContainers(newItems);
//   //   }
//   // };

//   // This is the function that handles the sorting of the containers and items when the user is done dragging.
//   function handleDragStart(event: DragStartEvent) {
//     const { active } = event;
//     setActiveId(String(active.id));
//   }

//   function handleDragMove(event: DragMoveEvent) {
//     const { active, over } = event;
//     if (!active || !over) return;

//     const aType = active.data.current?.type;
//     const oType = over.data.current?.type;

//     // solo nos interesan las cards
//     if (aType !== "item") return;
//     const fromId = String(active.id);

//     // A) sobre otra card -> preview exacto (antes de esa card)
//     if (oType === "item" && fromId !== String(over.id)) {
//       const toId = String(over.id);
//       const fromBoardKey =
//         active.data.current?.boardKey ?? findBoardKeyForShape(fromId);
//       const toBoardKey =
//         over.data.current?.boardKey ?? findBoardKeyForShape(toId);
//       if (!fromBoardKey || !toBoardKey) return;

//       if (fromBoardKey === toBoardKey) {
//         reorderWithinBoardPreview(fromBoardKey, fromId, toId);
//       } else {
//         const toIds = boardItemsMap[toBoardKey] ?? [];
//         const toIndex = toIds.indexOf(toId);
//         moveAcrossBoardsPreview(
//           fromBoardKey,
//           toBoardKey,
//           fromId,
//           toIndex >= 0 ? toIndex : undefined
//         );
//       }
//       return;
//     }

//     // B) sobre el fondo del board -> preview append
//     if (oType === "board") {
//       const toBoardKey = over.data.current?.boardKey ?? String(over.id);
//       const fromBoardKey =
//         active.data.current?.boardKey ?? findBoardKeyForShape(fromId);
//       if (!fromBoardKey || !toBoardKey) return;
//       if (fromBoardKey !== toBoardKey) {
//         moveAcrossBoardsPreview(fromBoardKey, toBoardKey, fromId);
//       }
//       return;
//     }
//   }

//   function handleDragEnd(event: DragEndEvent) {
//     const { active, over } = event;

//     // Handling Container Sorting
//     if (
//       active.id.toString().includes("container") &&
//       over?.id.toString().includes("container") &&
//       active &&
//       over &&
//       active.id !== over.id
//     ) {
//       // Find the index of the active and over container
//       const activeContainerIndex = containers.findIndex(
//         (container) => container.id === active.id
//       );
//       const overContainerIndex = containers.findIndex(
//         (container) => container.id === over.id
//       );
//       // Swap the active and over container
//       let newItems = [...containers];
//       newItems = arrayMove(newItems, activeContainerIndex, overContainerIndex);
//       setContainers(newItems);
//     }

//     function findValueOfItems(id: UniqueIdentifier | undefined, type: string) {
//       if (type === "container") {
//         return containers.find((item) => item.id === id);
//       }
//       if (type === "item") {
//         return containers.find((container) =>
//           container.shapes.find((item) => item.id === id)
//         );
//       }
//     }

//     console.log("active, over", active, over);

//     // Handling item Sorting
//     // if (
//     //   isItemId(active?.id) &&
//     //   isItemId(over?.id) &&
//     //   active &&
//     //   over &&
//     //   active.id !== over.id
//     // ) {
//     //   const fromId = String(active.id);
//     //   const toId = String(over.id);

//     //   const fromBoardKey = findBoardKeyForShape(fromId);
//     //   const toBoardKey = findBoardKeyForShape(toId);
//     //   if (!fromBoardKey || !toBoardKey) return;
//     //   if (fromBoardKey === toBoardKey) {
//     //     reorderWithinBoard(fromBoardKey, fromId, toId);
//     //   }
//     //   // Find the active and over container
//     //   // const activeContainer = findValueOfItems(active.id, "item");
//     //   // const overContainer = findValueOfItems(over.id, "item");

//     //   // // If the active or over container is not found, return
//     //   // if (!activeContainer || !overContainer) return;
//     //   // // Find the index of the active and over container
//     //   // const activeContainerIndex = containers.findIndex(
//     //   //   (container) => container.id === activeContainer.id
//     //   // );
//     //   // const overContainerIndex = containers.findIndex(
//     //   //   (container) => container.id === overContainer.id
//     //   // );
//     //   // // Find the index of the active and over item
//     //   // const activeitemIndex = activeContainer.shapes.findIndex(
//     //   //   (item) => item.id === active.id
//     //   // );
//     //   // const overitemIndex = overContainer.shapes.findIndex(
//     //   //   (item) => item.id === over.id
//     //   // );

//     //   // // In the same container
//     //   // if (activeContainerIndex === overContainerIndex) {
//     //   //   let newItems = [...containers];
//     //   //   newItems[activeContainerIndex].shapes = arrayMove(
//     //   //     newItems[activeContainerIndex].shapes,
//     //   //     activeitemIndex,
//     //   //     overitemIndex
//     //   //   );
//     //   //   setContainers(newItems);
//     //   // } else {
//     //   //   // In different containers
//     //   //   let newItems = [...containers];
//     //   //   const [removeditem] = newItems[activeContainerIndex].shapes.splice(
//     //   //     activeitemIndex,
//     //   //     1
//     //   //   );
//     //   //   newItems[overContainerIndex].shapes.splice(
//     //   //     overitemIndex,
//     //   //     0,
//     //   //     removeditem
//     //   //   );
//     //   //   setContainers(newItems);
//     //   // }
//     // }
//     if (isItemId(active?.id) && active.id !== over?.id) {
//       const fromId = String(active.id);
//       console.log("fromId", fromId);

//       // Caso 1: soltaste sobre OTRA CARD
//       if (isItemId(over?.id)) {
//         const toId = String(over!.id);
//         const fromBoardKey = findBoardKeyForShape(fromId);
//         const toBoardKey = findBoardKeyForShape(toId);
//         console.log("toId", toId, fromBoardKey, toBoardKey);

//         if (!fromBoardKey || !toBoardKey) return;

//         if (fromBoardKey === toBoardKey) {
//           // Mismo board ⇒ solo reordenamos por kanbanOrder
//           reorderWithinBoard(fromBoardKey, fromId, toId);
//         } else {
//           console.log("moveAcrossBoards");

//           // Boards distintos ⇒ insertamos ANTES de toId en destino
//           const toIds = boardItemsMap[toBoardKey] ?? [];
//           const toIndex = toIds.indexOf(toId);
//           moveAcrossBoards(
//             fromBoardKey,
//             toBoardKey,
//             fromId,
//             toIndex >= 0 ? toIndex : undefined
//           );
//         }
//       }

//       // Caso 2 (opcional): soltaste sobre el FONDO de una columna
//       // Para que esto funcione, tu <Board> debe ser droppable con id=String(board.id)
//       if (isBoardId(over?.id)) {
//         const toBoardKey = String(over!.id);
//         const fromBoardKey = findBoardKeyForShape(fromId);

//         if (!fromBoardKey || !toBoardKey) return;
//         moveAcrossBoards(fromBoardKey, toBoardKey, fromId); // append al final del destino
//       }
//     }
//     // Handling item dropping into Container
//     if (
//       active.id.toString().includes("item") &&
//       over?.id.toString().includes("container") &&
//       active &&
//       over &&
//       active.id !== over.id
//     ) {
//       // Find the active and over container
//       //   const activeContainer = findValueOfItems(active.id, "item");
//       //   const overContainer = findValueOfItems(over.id, "container");
//       //   // If the active or over container is not found, return
//       //   if (!activeContainer || !overContainer) return;
//       //   // Find the index of the active and over container
//       //   const activeContainerIndex = containers.findIndex(
//       //     (container) => container.id === activeContainer.id
//       //   );
//       //   const overContainerIndex = containers.findIndex(
//       //     (container) => container.id === overContainer.id
//       //   );
//       //   // Find the index of the active and over item
//       //   const activeitemIndex = activeContainer.items.findIndex(
//       //     (item) => item.id === active.id
//       //   );
//       //   let newItems = [...containers];
//       //   const [removeditem] = newItems[activeContainerIndex].items.splice(
//       //     activeitemIndex,
//       //     1
//       //   );
//       //   newItems[overContainerIndex].items.push(removeditem);
//       //   setContainers(newItems);
//       // }
//       // setActiveId(null);
//     }
//   }

//   console.log("containers", containers);

//   return (
//     <div className="min-h-0">
//       <div className="flex w-full h-full gap-4 px-2 pb-2">
//         <DndContext
//           sensors={sensors}
//           collisionDetection={closestCorners}
//           // collisionDetection={pointerWithin}
//           // onDragStart={handleDragStart}
//           onDragOver={handleDragOver}
//           onDragMove={handleDragMove}
//           onDragEnd={handleDragEnd}
//         >
//           {/* @ts-ignore */}
//           <SortableContext
//             items={containers.map((b) => b.id.toString() as UniqueIdentifier)}
//           >
//             {containers.map((board) => {
//               const boardItems = getBoardItems(board);
//               const ids = boardItems.map((s) => s.id);
//               return (
//                 <Board
//                   id={board.id}
//                   title={board.name}
//                   key={board.id}
//                   // onAddItem={() => {
//                   //   setShowAddItemModal(true);
//                   //   setCurrentContainerId(container.id);
//                   // }}
//                 >
//                   {/* @ts-ignore */}
//                   <SortableContext items={ids}>
//                     <div className="flex-1 min-h-0  p-1 space-y-2">
//                       {boardItems.map((shape) => (
//                         <BoardItem
//                           key={shape.id}
//                           shape={shape}
//                           boardKey={board.id.toString()}
//                         />
//                       ))}
//                     </div>
//                   </SortableContext>
//                 </Board>
//               );
//             })}
//           </SortableContext>
//         </DndContext>
//       </div>
//     </div>
//   );
// }

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
  type CollisionDetection,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "./SortableItem";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KanbanBoardCategory } from "@/lib/generated/prisma";
import Board from "./Board";
import BoardItem from "./BoardItem";

interface KanbanViewProps {
  kanbanBoards: KanbanBoardCategory[];
}

export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
  const { shapes, addShape, updateShape } = useRealtimeShapes();
  const [activeId, setActiveId] = useState<string | null>(null);

  // 🌟 UI SOURCE OF TRUTH (used for rendering & preview)
  const [containers, setContainers] = useState<
    (KanbanBoardCategory & { shapes: Shape[] })[]
  >(
    kanbanBoards.map((b) => {
      const boardShapes: Shape[] = [];
      for (const id of b.shape_ids) {
        const shape = shapes.find((s) => s.id === id);
        if (shape) boardShapes.push(shape);
      }
      // keep initial render ordered by kanbanOrder
      boardShapes.sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
      return { ...b, shapes: boardShapes };
    })
  );

  useEffect(() => {}, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ===== helpers bound to current UI state (containers) =====

  const findContainerIndexByBoardKey = useCallback(
    (boardKey: string) =>
      containers.findIndex((c) => String(c.id) === boardKey),
    [containers]
  );

  const findContainerIndexByItemId = useCallback(
    (shapeId: string) =>
      containers.findIndex((c) => c.shapes.some((s) => s.id === shapeId)),
    [containers]
  );

  const shapeById = useCallback(
    (id: string) => shapes.find((s) => s.id === id),
    [shapes]
  );

  const add = (type: string) => {
    const id = uuidv4();
    addShape("card", 20, 20, id);
    updateShape(id, (s) => ({ ...s, subtype: type as CardType }));
  };

  // 🔁 CHANGED: find board for a shape from *containers* (live UI), not props
  const findBoardKeyForShape = useCallback(
    (shapeId: string): string | null => {
      const entry = containers.find((c) =>
        c.shapes.some((s) => s.id === shapeId)
      );
      return entry ? String(entry.id) : null;
    },
    [containers]
  );

  // 🔁 CHANGED: item/board detection based on *containers* (live UI)
  const boardIdSet = useMemo(
    () => new Set(containers.map((b) => String(b.id))),
    [containers]
  );
  const itemIdSet = useMemo(() => {
    const s = new Set<string>();
    containers.forEach((b) => b.shapes.forEach((sh) => s.add(sh.id)));
    return s;
  }, [containers]);
  const isBoardId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && boardIdSet.has(String(id)),
    [boardIdSet]
  );
  const isItemId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && itemIdSet.has(String(id)),
    [itemIdSet]
  );

  // 🔁 CHANGED: normalize orders using the *current containers state*
  const normalizeAllOrders = useCallback(() => {
    containers.forEach((col) => {
      col.shapes.forEach((shape, idx) => {
        const nextOrder = (idx + 1) * 1000;
        if (shape.kanbanOrder !== nextOrder) {
          updateShape(shape.id, (s) => ({ ...s, kanbanOrder: nextOrder }));
        }
      });
    });
  }, [containers, updateShape]);

  // ===== DnD Handlers =====

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(String(active.id));
  }

  // ✅ onDragOver updates *containers* (the state we render from) → no snap
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const activeType = active.data.current?.type as
      | "item"
      | "board"
      | undefined;
    const overType = over.data.current?.type as "item" | "board" | undefined;
    if (activeType !== "item") return;

    const fromId = String(active.id);

    setContainers((prev) => {
      const next = [...prev];

      const srcBoardIdx = findContainerIndexByItemId(fromId);
      if (srcBoardIdx < 0) return prev;

      const srcList = [...next[srcBoardIdx].shapes];
      const srcIdx = srcList.findIndex((s) => s.id === fromId);
      if (srcIdx < 0) return prev;

      // A) hover another item: insert BEFORE it
      if (overType === "item" && fromId !== String(over.id)) {
        const toId = String(over.id);
        const dstBoardIdx = findContainerIndexByItemId(toId);
        if (dstBoardIdx < 0) return prev;

        const dstList =
          dstBoardIdx === srcBoardIdx ? srcList : [...next[dstBoardIdx].shapes];
        const dstIdx = dstList.findIndex((s) => s.id === toId);
        if (dstIdx < 0) return prev;

        const [moved] = srcList.splice(srcIdx, 1);
        if (dstBoardIdx === srcBoardIdx) {
          srcList.splice(dstIdx, 0, moved);
          next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
        } else {
          dstList.splice(dstIdx, 0, moved);
          next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
          next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
        }
        return next;
      }

      // B) hover board background: append to destination
      if (overType === "board") {
        const dstBoardKey =
          (over.data.current?.boardKey as string) ?? String(over.id);
        const dstBoardIdx = findContainerIndexByBoardKey(dstBoardKey);
        if (dstBoardIdx < 0 || dstBoardIdx === srcBoardIdx) return prev;

        const dstList = [...next[dstBoardIdx].shapes];
        const [moved] = srcList.splice(srcIdx, 1);
        dstList.push(moved);

        next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
        next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
        return next;
      }

      return prev;
    });
  }

  // 🔁 CHANGED: DragMove (optional) – you can leave it or remove it.
  function handleDragMove(_event: DragMoveEvent) {
    // no-op; preview handled in onDragOver
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!active || !over) return;

    // At this point, containers already reflect the final lists due to preview.
    // We just normalize kanbanOrder (and later you’ll persist shape_ids arrays to DB).
    normalizeAllOrders();
  }

  // ===== Render directly from *containers* (🔁 CHANGED) =====
  return (
    <div className="min-h-0">
      <div className="flex w-full h-full gap-4 px-2 pb-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* @ts-ignore */}
          <SortableContext
            items={containers.map((b) => b.id.toString() as UniqueIdentifier)}
          >
            {containers.map((board) => {
              // 🔁 CHANGED: use board.shapes (live) instead of getBoardItems(board)
              const boardItems = board.shapes;
              const ids = boardItems.map((s) => s.id);
              return (
                <Board id={board.id} title={board.name} key={board.id}>
                  {/* @ts-ignore */}
                  <SortableContext
                    items={ids}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 min-h-0 p-1 space-y-2">
                      {boardItems.map((shape) => (
                        <BoardItem
                          key={shape.id}
                          shape={shape}
                          boardKey={board.id.toString()} // dnd-kit data for items
                        />
                      ))}
                    </div>
                  </SortableContext>
                </Board>
              );
            })}
          </SortableContext>

          {/* Overlay (optional). Keep simple/static if you use it. */}
          {/* <DragOverlay adjustScale={false} dropAnimation={null}>
            {activeId ? (
              <div className="w-[420px] rounded-lg bg-white shadow p-2">
                {(shapeById(activeId)?.text as any) ?? "Card"}
              </div>
            ) : null}
          </DragOverlay> */}
        </DndContext>
      </div>
    </div>
  );
}

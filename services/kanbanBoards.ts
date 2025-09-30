import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";

export async function getRoomKanbanBoards(roomId: string) {
  const shapes = await getKanbanBoardShapes(roomId);

  const kanbanBoards = await prisma.kanbanBoardCategory.findMany({
    where: { room_id: roomId },
    orderBy: { order: "asc" },
  });

  if (kanbanBoards.length === 0) {
    const kanbanBoard = await prisma.kanbanBoardCategory.create({
      data: {
        order: 0,
        room_id: roomId,
        name: "Unnamed board",
        shape_ids: shapes.map((shape) => shape.id),
      },
    });
    return [kanbanBoard];
  }

  for (const shape of shapes) {
    const isShapeInAnyBoard = kanbanBoards.some((board) =>
      board.shape_ids.includes(shape.id)
    );

    if (!isShapeInAnyBoard) {
      const defaultBoard = kanbanBoards[0];
      defaultBoard.shape_ids.push(shape.id);
      await prisma.kanbanBoardCategory.update({
        where: { id: defaultBoard.id },
        data: { shape_ids: defaultBoard.shape_ids },
      });
    }
  }

  return kanbanBoards;
}

export async function getKanbanBoardShapes(roomId: string) {
  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const storage = await liveblocks.getStorageDocument(roomId, "json");

  return (
    storage.shapes.filter(
      (shape) => !["rect", "text", "ellipse"].includes(shape.type)
    ) || []
  );
}

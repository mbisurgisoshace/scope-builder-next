import { prisma } from "@/lib/prisma";

export default async function getRoomKanbanBoards(roomId: string) {
  const kanbanBoards = await prisma.kanbanBoardCategory.findMany({
    where: { room_id: roomId },
    orderBy: { order: "asc" },
  });

  if (kanbanBoards.length === 0) {
    const kanbanBoard = await prisma.kanbanBoardCategory.create({
      data: {
        order: 0,
        shape_ids: [],
        room_id: roomId,
        name: "Unnamed board",
      },
    });
    return [kanbanBoard];
  }

  return kanbanBoards;
}

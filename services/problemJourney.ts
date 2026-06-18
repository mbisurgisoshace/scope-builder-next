"use server";

import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function generateProblemJourneyRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const roomStorage: any = await liveblocks.getStorageDocument(roomId);

  if (Object.keys(roomStorage.data).length === 0) {
    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        journeyNodes: { liveblocksType: "LiveList", data: [] },
        journeyEdges: { liveblocksType: "LiveList", data: [] },
      },
    });
  }
}

export async function getProblemJourneyParticipants(orgId: string) {
  return prisma.participant.findMany({
    where: { org_id: orgId },
    select: { id: true, name: true, job_title: true },
    orderBy: { name: "asc" },
  });
}

export async function createJourneyStakeholder(name: string, role: string) {
  const { orgId, userId } = await auth();
  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const participant = await prisma.participant.create({
    data: { id: uuidv4(), name, role, org_id: orgId },
    select: { id: true, name: true, job_title: true },
  });

  return participant;
}

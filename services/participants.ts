"use server";

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { participantFormSchema } from "@/schemas/participant";

export async function getParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
  });

  return participant;
}

export async function getParticipants() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const participants = await prisma.participant.findMany({
    where: { org_id: orgId },
  });

  return participants;
}

export async function createParticipant(
  values: z.infer<typeof participantFormSchema>
) {
  const participantId = uuidv4();
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const newParticipant = await prisma.participant.create({
    data: {
      ...values,
      org_id: orgId,
      id: participantId,
      ParticipantRoom: {
        create: {
          roomId: uuidv4(),
        },
      },
    },
  });

  revalidatePath(`/participants`);

  return newParticipant;
}

export async function updateParticipant(
  participantId: string,
  values: z.infer<typeof participantFormSchema>
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { ...values },
  });

  revalidatePath(`/participants`);
}

export async function markParticipantAsComplete(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "complete" },
  });

  revalidatePath(`/participants`);
}

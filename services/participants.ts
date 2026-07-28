"use server";

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { participantFormSchema } from "@/schemas/participant";
import {
  ParticipantRelationship,
  ParticipantStatus,
} from "@/lib/generated/prisma";

// Statuses owned by the interview flow (markParticipantAsComplete /
// markParticipantAsDocumented). A scheduled date must not drag these back to
// "scheduled" — that would bounce the card backwards on the kanban.
const LOCKED_STATUSES: ParticipantStatus[] = ["complete", "documented"];

// The form submits "" for an unselected relationship; Prisma rejects that for an
// enum column, so it has to become null.
function toRelationship(value?: string): ParticipantRelationship | null {
  return value ? (value as ParticipantRelationship) : null;
}

export async function getParticipantTags() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const tags = await prisma.participantTag.findMany({
    where: { org_id: orgId },
  });

  return tags.map((tag) => tag.name);
}

export async function createParticipantTag(tagName: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newTag = await prisma.participantTag.create({
    data: {
      name: tagName,
      org_id: orgId,
    },
  });

  revalidatePath(`/participants`);
}

export async function getParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
  });

  return participant;
}

export async function getParticipants() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participants = await prisma.participant.findMany({
    where: { org_id: orgId },
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function getAllParticipants() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const participants = await prisma.participant.findMany({
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function createParticipant(
  values: z.infer<typeof participantFormSchema>,
) {
  const participantId = uuidv4();
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newParticipant = await prisma.participant.create({
    data: {
      ...values,
      relationship: toRelationship(values.relationship),
      // A brand-new participant can't be complete/documented, so no guard needed.
      status: values.scheduled_date
        ? "scheduled"
        : (values.status as ParticipantStatus),
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
  values: z.infer<typeof participantFormSchema>,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  // Read the live status rather than trusting the value the form round-tripped —
  // the interview flow may have advanced it while the edit sheet was open.
  const current = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
    select: { status: true },
  });

  const status = current && LOCKED_STATUSES.includes(current.status)
    ? current.status
    : values.scheduled_date
      ? "scheduled"
      : (values.status as ParticipantStatus);

  await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: {
      ...values,
      relationship: toRelationship(values.relationship),
      status,
    },
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

export async function markParticipantAsDocumented(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "documented" },
  });

  // "layout" so the nested /participants/interviews is revalidated too — a bare
  // revalidatePath("/participants") only busts that exact page, and this status
  // change is what the interviews header's payer count is counting.
  revalidatePath(`/participants`, "layout");
}

export async function deleteParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  await prisma.participant.delete({
    where: { id: participantId, org_id: orgId },
  });

  revalidatePath(`/participants`);
}

export async function getInterviewMilestonesWithProgress() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const [milestones, documentedCount, payerDocumentedCount] = await Promise.all(
    [
      prisma.interviewMilestone.findMany({
        where: { org_id: orgId },
        orderBy: { date: "asc" },
      }),
      prisma.participant.count({
        where: { org_id: orgId, status: "documented" },
      }),
      prisma.participant.count({
        where: {
          org_id: orgId,
          status: "documented",
          role: { contains: "Payer" },
        },
      }),
    ],
  );

  return { milestones, documentedCount, payerDocumentedCount };
}

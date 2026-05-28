"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

export async function getOfficeHourSlots() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const slots = await prisma.officeHourSlot.findMany({
    where: { org_id: orgId },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  });

  return slots;
}

export async function createOfficeHourSlot(
  date: Date,
  startTime: string,
  endTime: string
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const slot = await prisma.officeHourSlot.create({
    data: {
      id: uuidv4(),
      org_id: orgId,
      date,
      start_time: startTime,
      end_time: endTime,
    },
  });

  revalidatePath("/office-hours");
  return slot;
}

export async function updateOfficeHourSlot(
  id: string,
  startTime: string,
  endTime: string
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const slot = await prisma.officeHourSlot.update({
    where: { id, org_id: orgId },
    data: { start_time: startTime, end_time: endTime },
  });

  revalidatePath("/office-hours");
  return slot;
}

export async function deleteOfficeHourSlot(id: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  await prisma.officeHourSlot.delete({
    where: { id, org_id: orgId },
  });

  revalidatePath("/office-hours");
}

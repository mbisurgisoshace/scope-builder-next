"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function getOfficeHourSlots() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const slots = await prisma.officeHourSlot.findMany({
    where: { user_id: userId },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  });

  return slots;
}

export async function createOfficeHourSlot(
  date: Date,
  startTime: string,
  endTime: string
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const mentorName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Mentor";

  const slot = await prisma.officeHourSlot.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      mentor_name: mentorName,
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
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const slot = await prisma.officeHourSlot.update({
    where: { id, user_id: userId },
    data: { start_time: startTime, end_time: endTime },
  });

  revalidatePath("/office-hours");
  return slot;
}

export async function deleteOfficeHourSlot(id: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await prisma.officeHourSlot.delete({
    where: { id, user_id: userId },
  });

  revalidatePath("/office-hours");
}

export async function getAllSlotsWithBookings() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const slots = await prisma.officeHourSlot.findMany({
    include: { booking: true },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  });

  return slots;
}

export async function bookSlot(slotId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const booking = await prisma.officeHourBooking.create({
    data: {
      id: uuidv4(),
      slot_id: slotId,
      user_id: userId,
    },
  });

  revalidatePath("/office-hours");
  return booking;
}

export async function cancelBooking(slotId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await prisma.officeHourBooking.delete({
    where: { slot_id: slotId, user_id: userId },
  });

  revalidatePath("/office-hours");
}

"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  MILESTONE_COUNT,
  MILESTONE_NUMBERS,
  ALWAYS_AVAILABLE_MILESTONE,
  type MilestoneAccessState,
} from "@/lib/milestones";

/**
 * Unlike most services here, milestone access is administered from `/startups`
 * for *other* startups, so these actions take an explicit `orgId` instead of
 * reading the caller's active org from `auth()` — same shape as the cross-org
 * reads in `services/participants.ts` (`getAllParticipants`).
 */

/**
 * Access for every startup that has rows, keyed by org id. Orgs with no rows are
 * absent from the map; callers fall back to `defaultMilestoneAccess()`.
 */
export async function getAllMilestoneAccess(): Promise<
  Record<string, MilestoneAccessState[]>
> {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const rows = await prisma.milestoneAccess.findMany();

  const byOrg: Record<string, MilestoneAccessState[]> = {};

  for (const row of rows) {
    if (!byOrg[row.org_id]) {
      // Seed all 5 slots so consumers can index by milestone without holes.
      byOrg[row.org_id] = MILESTONE_NUMBERS.map((milestone) => ({
        milestone,
        available: milestone === ALWAYS_AVAILABLE_MILESTONE,
        submittedAt: null,
      }));
    }

    const slot = byOrg[row.org_id][row.milestone - 1];

    if (!slot) continue;

    slot.available =
      row.milestone === ALWAYS_AVAILABLE_MILESTONE ? true : row.available;
    slot.submittedAt = row.submitted_at;
  }

  return byOrg;
}

/**
 * When the active startup submitted this milestone, or null if it hasn't.
 *
 * Unlike the rest of this module these two actions are the startup acting on its
 * *own* milestone from the Instructions tab, so they read the active org from
 * `auth()` rather than taking an explicit `orgId`.
 */
export async function getMilestoneSubmission(
  milestone: number,
): Promise<Date | null> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const row = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { submitted_at: true },
  });

  return row?.submitted_at ?? null;
}

/**
 * Mark this milestone submitted for the active startup. Submitting is one-way —
 * the Instructions card disables the button afterwards — so an existing
 * `submitted_at` is left alone rather than being bumped to now.
 */
export async function submitMilestone(milestone: number): Promise<Date> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  if (milestone < 1 || milestone > MILESTONE_COUNT) {
    throw new Error(`Invalid milestone: ${milestone}`);
  }

  const existing = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { submitted_at: true },
  });

  if (existing?.submitted_at) return existing.submitted_at;

  const submittedAt = new Date();

  await prisma.milestoneAccess.upsert({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    // Milestone 1 has no row until now for most startups; `available` is forced
    // true for it on read (see getAllMilestoneAccess), so false here is fine.
    create: {
      org_id: orgId,
      milestone,
      available: milestone === ALWAYS_AVAILABLE_MILESTONE,
      submitted_at: submittedAt,
    },
    update: { submitted_at: submittedAt },
  });

  revalidatePath("/startups");
  revalidatePath("/user-journey-map");

  return submittedAt;
}

export async function setMilestoneAvailability(
  orgId: string,
  milestone: number,
  available: boolean,
) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (milestone < 1 || milestone > MILESTONE_COUNT) {
    throw new Error(`Invalid milestone: ${milestone}`);
  }

  if (milestone === ALWAYS_AVAILABLE_MILESTONE) {
    throw new Error("Milestone 1 is always available and cannot be changed");
  }

  await prisma.milestoneAccess.upsert({
    where: {
      org_id_milestone: {
        org_id: orgId,
        milestone,
      },
    },
    create: {
      org_id: orgId,
      milestone,
      available,
    },
    update: {
      available,
    },
  });

  revalidatePath("/startups");
}

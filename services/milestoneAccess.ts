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

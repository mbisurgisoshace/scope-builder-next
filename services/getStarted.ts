"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { subStepKey } from "@/lib/milestones";

export type GetStartedCardWithData = Prisma.GetStartedCardGetPayload<{
  include: { items: { include: { reviews: true } }; reviews: true };
}>;

export async function getGetStartedCards(milestone: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  // Card content is global curriculum (same for every startup); only the
  // reviewed state is per-org, so `reviews` is scoped to the active org.
  const cards = await prisma.getStartedCard.findMany({
    where: { milestone },
    orderBy: { order: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { reviews: { where: { org_id: orgId } } },
      },
      reviews: { where: { org_id: orgId } },
    },
  });

  return cards;
}

/**
 * Reviewed state of every sub-step item, keyed by sub-step key ("1.1", "1.2"…),
 * for the active org. Covers all 5 milestones in one query so the milestone
 * header can show progress for the blocks that aren't expanded.
 */
export async function getSubStepProgress(): Promise<Record<string, boolean>> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const items = await prisma.getStartedItem.findMany({
    where: { sub_step: { not: null } },
    select: {
      sub_step: true,
      card: { select: { milestone: true } },
      reviews: { where: { org_id: orgId }, select: { reviewed: true } },
    },
  });

  const progress: Record<string, boolean> = {};

  for (const item of items) {
    if (item.sub_step == null) continue;
    progress[subStepKey(item.card.milestone, item.sub_step)] =
      item.reviews.some((review) => review.reviewed);
  }

  return progress;
}

export async function setCardReviewed(cardId: number, reviewed: boolean) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.getStartedReview.upsert({
    where: {
      org_id_card_id: {
        org_id: orgId,
        card_id: cardId,
      },
    },
    create: {
      org_id: orgId,
      card_id: cardId,
      reviewed,
    },
    update: {
      reviewed,
    },
  });

  revalidatePath("/user-journey-map");
}

export async function setItemReviewed(itemId: number, reviewed: boolean) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.getStartedReview.upsert({
    where: {
      org_id_item_id: {
        org_id: orgId,
        item_id: itemId,
      },
    },
    create: {
      org_id: orgId,
      item_id: itemId,
      reviewed,
    },
    update: {
      reviewed,
    },
  });

  revalidatePath("/user-journey-map");
}

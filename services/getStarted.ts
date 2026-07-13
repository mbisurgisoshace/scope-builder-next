"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export type GetStartedCardWithData = Prisma.GetStartedCardGetPayload<{
  include: { items: true; reviews: true };
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
      items: { orderBy: { order: "asc" } },
      reviews: { where: { org_id: orgId } },
    },
  });

  return cards;
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

  revalidatePath("/problem-journey-map");
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

  revalidatePath("/problem-journey-map");
}

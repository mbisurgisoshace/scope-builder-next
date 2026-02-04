"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export type HypothesisWithQuestions = Prisma.HypothesisGetPayload<{
  include: { questions: true };
}>;

export async function getHypothesis() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const hypotheses = await prisma.hypothesis.findMany({
    include: { questions: true },
  });

  return hypotheses;
}

export async function createHypothesis() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const hypotheses = await prisma.hypothesis.create({
    data: {
      title: "New Hypothesis",
    },
  });

  revalidatePath("/hypotheses");
}

export async function createHypothesisQuestion(
  hypothesisId: number,
  title: string,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const question = await prisma.question.create({
    data: {
      title,
      hypothesis_id: hypothesisId,
    },
  });

  revalidatePath("/hypotheses");
}

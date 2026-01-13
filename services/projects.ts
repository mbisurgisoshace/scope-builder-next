"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getProject(projectId: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      org_id: orgId,
    },
  });

  if (!project) redirect("/projects");

  return project;
}

export async function getProjects() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const projects = await prisma.project.findMany({
    where: {
      org_id: orgId,
    },
  });

  return projects;
}

export async function createProject(name: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newProject = await prisma.project.create({
    data: {
      org_id: orgId,
      project_name: name,
    },
  });

  revalidatePath("/");

  return newProject;
}

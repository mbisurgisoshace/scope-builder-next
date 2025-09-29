import { v4 as uuidv4 } from "uuid";
import {
  createValuePropositionVersion,
  getSegmentsPropData,
  getValuePropositionVersions,
} from "@/services/valueProposition";
import ValuePropositionTabsView from "./_components/ValuePropositionTabs";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";

export default async function ValuePropositionPage() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const versions = await getValuePropositionVersions();
  const segmentsPropData = await getSegmentsPropData();

  const version = await createValuePropositionVersion();
  if (version) versions.push(version);

  const questions = await prisma.cardQuestions.findMany({});

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <QuestionsProvider segments={segmentsPropData} questions={questions}>
          <ValuePropositionTabsView rooms={versions} />
        </QuestionsProvider>
      </div>
    </div>
  );
}

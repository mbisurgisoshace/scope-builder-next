import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import MultiCanvas from "./components/MultiCanvas";
import { getSegmentsPropData } from "@/services/valueProposition";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";

export default async function ValuePropositionCanvasPage() {
  const { orgId } = await auth();

  const segmentsPropData = await getSegmentsPropData();
  const questions = await prisma.cardQuestions.findMany({});

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <QuestionsProvider segments={segmentsPropData} questions={questions}>
          <MultiCanvas orgId={orgId} />
        </QuestionsProvider>
      </div>
    </div>
  );
}

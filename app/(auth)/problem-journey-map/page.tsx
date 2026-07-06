import { auth } from "@clerk/nextjs/server";
import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { Room } from "@/components/Room";
import { generateProblemJourneyRoom } from "@/services/problemJourney";
import { getJobTitles } from "@/services/jobTitles";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const [, jobTitles] = await Promise.all([
    generateProblemJourneyRoom(roomId),
    getJobTitles(),
  ]);

  return (
    <div className="flex flex-col h-full">
      <MilestoneHeader />
      <div className="flex-1 min-h-0">
        <Room roomId={roomId}>
          <ProblemJourneyCanvas jobTitles={jobTitles} />
        </Room>
      </div>
    </div>
  );
}

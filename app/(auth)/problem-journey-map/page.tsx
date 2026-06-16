import { auth } from "@clerk/nextjs/server";
import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { StepperBar } from "@/components/ProblemJourneyMap/components/StepperBar";
import { Room } from "@/components/Room";
import { generateProblemJourneyRoom, getProblemJourneyParticipants } from "@/services/problemJourney";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const [, participants] = await Promise.all([
    generateProblemJourneyRoom(roomId),
    getProblemJourneyParticipants(orgId!),
  ]);

  return (
    <div className="flex flex-col h-full">
      <StepperBar />
      <div className="flex-1 min-h-0">
        <Room roomId={roomId}>
          <ProblemJourneyCanvas participants={participants} />
        </Room>
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";
import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { Room } from "@/components/Room";
import { generateProblemJourneyRoom } from "@/services/problemJourney";
import { getMarketData } from "@/services/market";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const [, marketData] = await Promise.all([
    generateProblemJourneyRoom(roomId),
    getMarketData(),
  ]);

  return (
    <MilestoneSelectionProvider>
      <div className="flex flex-col h-full">
        <MilestoneHeader />
        <JourneyMapTabs
          canvas={
            <Room roomId={roomId}>
              <ProblemJourneyCanvas
                stakeholderRows={marketData.stakeholderRows}
              />
            </Room>
          }
        />
      </div>
    </MilestoneSelectionProvider>
  );
}

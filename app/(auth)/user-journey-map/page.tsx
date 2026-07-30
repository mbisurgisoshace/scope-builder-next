import { auth } from "@clerk/nextjs/server";
import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { Room } from "@/components/Room";
import { generateProblemJourneyRoom } from "@/services/problemJourney";
import { getMarketData } from "@/services/market";
import { isMilestoneAvailable } from "@/services/milestoneAccess";
import { EVIDENCE_MILESTONE } from "@/lib/milestones";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const [, marketData, evidenceUnlocked] = await Promise.all([
    generateProblemJourneyRoom(roomId),
    getMarketData(),
    isMilestoneAvailable(EVIDENCE_MILESTONE),
  ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider>
        <div className="flex flex-col h-full">
          <MilestoneHeader />
          <JourneyMapTabs
            canvas={
              <Room roomId={roomId}>
                <ProblemJourneyCanvas
                  stakeholderRows={marketData.stakeholderRows}
                  evidenceUnlocked={evidenceUnlocked}
                />
              </Room>
            }
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}

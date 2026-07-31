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
import { getInterviewMilestonesWithProgress } from "@/services/participants";
import { EVIDENCE_MILESTONE, MIN_PAYER_INTERVIEWS } from "@/lib/milestones";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const [, marketData, evidenceUnlocked, { payerDocumentedCount }] =
    await Promise.all([
      generateProblemJourneyRoom(roomId),
      getMarketData(),
      isMilestoneAvailable(EVIDENCE_MILESTONE),
      getInterviewMilestonesWithProgress(),
    ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider>
        <div className="flex flex-col h-full">
          <MilestoneHeader
            payerInterviews={MIN_PAYER_INTERVIEWS}
            currentNumber={payerDocumentedCount}
          />
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

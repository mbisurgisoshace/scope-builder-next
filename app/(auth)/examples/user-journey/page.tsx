import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { Room } from "@/components/Room";
import { generateExampleProblemJourneyRoom, getExampleMarketData } from "@/services/examples";
import { isMilestoneAvailable } from "@/services/milestoneAccess";
import { exampleRoomId } from "@/lib/examples";
import { EVIDENCE_MILESTONE } from "@/lib/milestones";

// Read-only showcase mirror of /user-journey-map. Everything is identical to the
// real page except the data is example set N (global) and no control can edit it.
const EXAMPLE_NUMBER = 1;

export default async function ExampleProblemJourneyPage() {
  const roomId = exampleRoomId(EXAMPLE_NUMBER);
  const [, marketData, evidenceUnlocked] = await Promise.all([
    generateExampleProblemJourneyRoom(roomId),
    getExampleMarketData(EXAMPLE_NUMBER),
    // The example data is global, but the evidence controls follow the *viewer's*
    // own milestone access so the showcase matches the shape of their own map.
    isMilestoneAvailable(EVIDENCE_MILESTONE),
  ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider exampleNumber={EXAMPLE_NUMBER}>
        <div className="flex flex-col h-full">
          <MilestoneHeader />
          <JourneyMapTabs
            readOnly
            exampleNumber={EXAMPLE_NUMBER}
            canvas={
              <Room roomId={roomId}>
                <ProblemJourneyCanvas
                  stakeholderRows={marketData.stakeholderRows}
                  evidenceUnlocked={evidenceUnlocked}
                  readOnly
                />
              </Room>
            }
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}

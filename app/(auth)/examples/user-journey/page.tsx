import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { Room } from "@/components/Room";
import {
  generateExampleProblemJourneyRoom,
  getExampleMarketData,
  getExampleSubStepProgress,
} from "@/services/examples";
import { getAvailableMilestones } from "@/services/milestoneAccess";
import { exampleRoomId } from "@/lib/examples";

// Read-only showcase mirror of /user-journey-map. Everything is identical to the
// real page except the data is example set N (global) and no control can edit it.
const EXAMPLE_NUMBER = 1;

export default async function ExampleProblemJourneyPage() {
  const roomId = exampleRoomId(EXAMPLE_NUMBER);
  const [, marketData, availableMilestones, subStepProgress] =
    await Promise.all([
      generateExampleProblemJourneyRoom(roomId),
      getExampleMarketData(EXAMPLE_NUMBER),
      // The example data is global, but the milestone gates follow the *viewer's*
      // own access so the showcase matches the shape of their own map — a startup
      // still on Milestone 1 sees the example without problems, same as theirs.
      getAvailableMilestones(),
      // The sub-step gates, in contrast, stay example-scoped like the header
      // above them — the showcase is presented at the progress it was authored
      // at, rather than clipped to the viewer's own sub-steps.
      getExampleSubStepProgress(EXAMPLE_NUMBER),
    ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider
        exampleNumber={EXAMPLE_NUMBER}
        initialProgress={subStepProgress}
      >
        <div className="flex flex-col h-full">
          <MilestoneHeader />
          <JourneyMapTabs
            readOnly
            exampleNumber={EXAMPLE_NUMBER}
            canvas={
              <Room roomId={roomId}>
                <ProblemJourneyCanvas
                  stakeholderRows={marketData.stakeholderRows}
                  availableMilestones={availableMilestones}
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

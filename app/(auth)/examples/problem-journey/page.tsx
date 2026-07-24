import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { Room } from "@/components/Room";
import { generateExampleProblemJourneyRoom, getExampleJobTitles } from "@/services/examples";
import { exampleRoomId } from "@/lib/examples";

// Read-only showcase mirror of /problem-journey-map. Everything is identical to the
// real page except the data is example set N (global) and no control can edit it.
const EXAMPLE_NUMBER = 1;

export default async function ExampleProblemJourneyPage() {
  const roomId = exampleRoomId(EXAMPLE_NUMBER);
  const [, jobTitles] = await Promise.all([
    generateExampleProblemJourneyRoom(roomId),
    getExampleJobTitles(EXAMPLE_NUMBER),
  ]);

  return (
    <MilestoneSelectionProvider>
      <div className="flex flex-col h-full">
        <MilestoneHeader />
        <JourneyMapTabs
          readOnly
          exampleNumber={EXAMPLE_NUMBER}
          canvas={
            <Room roomId={roomId}>
              <ProblemJourneyCanvas jobTitles={jobTitles} readOnly />
            </Room>
          }
        />
      </div>
    </MilestoneSelectionProvider>
  );
}

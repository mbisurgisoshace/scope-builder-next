import ParticipantsKanbanView from "@/app/(auth)/participants/interviews/_components/ParticipantsKanbanView";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import {
  getExampleParticipantTags,
  getExampleJobTitles,
  getExampleInterviewMilestonesWithProgress,
} from "@/services/examples";

// Read-only showcase mirror of /participants/interviews. Same Kanban, but sourced
// from example set N (global) with every add/edit/answer control removed.
const EXAMPLE_NUMBER = 1;

export default async function ExampleInterviewsPage() {
  const [tags, jobTitles, { payerDocumentedCount }] = await Promise.all([
    getExampleParticipantTags(EXAMPLE_NUMBER),
    getExampleJobTitles(EXAMPLE_NUMBER),
    getExampleInterviewMilestonesWithProgress(EXAMPLE_NUMBER),
  ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider exampleNumber={EXAMPLE_NUMBER}>
        <div className="flex flex-col h-full overflow-hidden">
          <MilestoneHeader
            payerInterviews={Number(
              process.env.NEXT_PUBLIC_MIN_PAYER_INTERVIEWS ?? 8,
            )}
            currentNumber={payerDocumentedCount}
          />
          <div className="flex-1 min-h-0 px-8 py-4">
            <ParticipantsKanbanView
              tags={tags}
              jobTitles={jobTitles}
              readOnly
              exampleNumber={EXAMPLE_NUMBER}
            />
          </div>
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}

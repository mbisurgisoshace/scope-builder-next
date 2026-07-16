import ParticipantsKanbanView from "./_components/ParticipantsKanbanView";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import {
  getParticipantTags,
  getInterviewMilestonesWithProgress,
} from "@/services/participants";
import { getJobTitles } from "@/services/jobTitles";

export default async function ParticipantsInterviewPage() {
  const [tags, jobTitles, { payerDocumentedCount }] = await Promise.all([
    getParticipantTags(),
    getJobTitles(),
    getInterviewMilestonesWithProgress(),
  ]);

  return (
    // MilestoneHeader reads the selected milestone from context and throws without a
    // provider. Nothing else on this page consumes the selection — it only drives
    // which milestone the header expands.
    <MilestoneSelectionProvider>
      <div className="flex flex-col h-full overflow-hidden">
        {/* `milestones` is left to the component's defaults: per-milestone step
            progress has no data source yet, so it stays mock for now. */}
        <MilestoneHeader
          payerInterviews={Number(
            process.env.NEXT_PUBLIC_MIN_PAYER_INTERVIEWS ?? 8,
          )}
          currentNumber={payerDocumentedCount}
        />
        <div className="flex-1 min-h-0 px-8 py-4">
          <ParticipantsKanbanView tags={tags} jobTitles={jobTitles} />
        </div>
      </div>
    </MilestoneSelectionProvider>
  );
}

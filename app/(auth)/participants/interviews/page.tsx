import ParticipantsKanbanView from "./_components/ParticipantsKanbanView";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import {
  getParticipantTags,
  getInterviewMilestonesWithProgress,
} from "@/services/participants";
import { getJobTitles } from "@/services/jobTitles";
import {
  getAvailableMilestones,
  getReviewedMilestones,
} from "@/services/milestoneAccess";
import { checkRole } from "@/lib/auth";
import { MIN_PAYER_INTERVIEWS } from "@/lib/milestones";

export default async function ParticipantsInterviewPage() {
  const [
    tags,
    jobTitles,
    { payerDocumentedCount },
    isAdmin,
    isMentor,
    reviewedMilestones,
    availableMilestones,
  ] = await Promise.all([
    getParticipantTags(),
    getJobTitles(),
    getInterviewMilestonesWithProgress(),
    checkRole("admin"),
    checkRole("mentor"),
    getReviewedMilestones(),
    getAvailableMilestones(),
  ]);

  return (
    // MilestoneHeader reads the selected milestone from context and throws without a
    // provider. Nothing else on this page consumes the selection — it only drives
    // which milestone the header expands.
    <MilestoneSelectionProvider>
      {/* Sub-step progress is read-only here — the steps card that writes it
          lives on the Instructions tab of /user-journey-map. */}
      <SubStepProgressProvider>
        <div className="flex flex-col h-full overflow-hidden">
          <MilestoneHeader
            payerInterviews={MIN_PAYER_INTERVIEWS}
            currentNumber={payerDocumentedCount}
            reviewedMilestones={reviewedMilestones}
            availableMilestones={availableMilestones}
          />
          <div className="flex-1 min-h-0 px-8 py-4">
            <ParticipantsKanbanView
              tags={tags}
              jobTitles={jobTitles}
              canReview={isAdmin || isMentor}
            />
          </div>
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}

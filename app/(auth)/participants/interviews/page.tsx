import ParticipantKanbanHeader from "./_components/ParticipantKanbanHeader";
import ParticipantsKanbanView from "./_components/ParticipantsKanbanView";
import {
  getParticipantTags,
  getInterviewMilestonesWithProgress,
} from "@/services/participants";

export default async function ParticipantsInterviewPage() {
  const [tags, { milestones, documentedCount, payerDocumentedCount }] =
    await Promise.all([
      getParticipantTags(),
      getInterviewMilestonesWithProgress(),
    ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ParticipantKanbanHeader
        milestones={milestones}
        documentedCount={documentedCount}
        payerDocumentedCount={payerDocumentedCount}
      />
      <div className="flex-1 min-h-0 px-8 py-4">
        <ParticipantsKanbanView tags={tags} />
      </div>
    </div>
  );
}

import ParticipantKanbanHeader from "./_components/ParticipantKanbanHeader";
import ParticipantsKanbanView from "./_components/ParticipantsKanbanView";
import { getParticipantTags } from "@/services/participants";

export default async function ParticipantsInterviewPage() {
  const tags = await getParticipantTags();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ParticipantKanbanHeader />
      <div className="flex-1 min-h-0 px-8 py-4">
        <ParticipantsKanbanView tags={tags} />
      </div>
    </div>
  );
}

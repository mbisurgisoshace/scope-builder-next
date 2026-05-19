import ParticipantKanbanHeader from "./_components/ParticipantKanbanHeader";
import ParticipantsKanbanView from "./_components/ParticipantsKanbanView";

export default async function ParticipantsInterviewPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ParticipantKanbanHeader />
      <div className="flex-1 min-h-0 px-8 py-4">
        <ParticipantsKanbanView />
      </div>
    </div>
  );
}

import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";

// Liveblocks temporarily removed — testing pure local state to match RF Pro example smoothness
export default function ProblemJourneyMapPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <ProblemJourneyCanvas participants={[]} />
      </div>
    </div>
  );
}

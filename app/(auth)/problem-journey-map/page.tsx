import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { StepperBar } from "@/components/ProblemJourneyMap/components/StepperBar";

// Liveblocks temporarily removed — testing pure local state to match RF Pro example smoothness
export default function ProblemJourneyMapPage() {
  return (
    <div className="flex flex-col h-full">
      <StepperBar />
      <div className="flex-1 min-h-0">
        <ProblemJourneyCanvas participants={[]} />
      </div>
    </div>
  );
}

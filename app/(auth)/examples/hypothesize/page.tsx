import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";
import HypothesizeTabsView from "./_components/HypothesizeTabs";

export default function HypothesizePage() {
  return (
    <div className="flex flex-col h-full">
      <HypothesizeTabsView />
    </div>
  );
}

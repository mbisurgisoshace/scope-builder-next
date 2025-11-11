import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExcersiceTabsView from "./ExcercisesTabs";

export default function HypothesizeTabsView() {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <Tabs defaultValue="excercises" className="h-full bg-transparent">
        <TabsList className="bg-transparent">
          <TabsTrigger value="startup" className="">
            Startup
          </TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="excercises">Excercises</TabsTrigger>
        </TabsList>
        <TabsContent value="startup"></TabsContent>
        <TabsContent value="examples"></TabsContent>
        <TabsContent value="excercises" className="w-full h-full">
          <ExcersiceTabsView rooms={[{ id: 1 }, { id: 2 }]} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

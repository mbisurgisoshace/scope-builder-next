import InfiniteCanvas from "@/components/InfiniteCanvas";
import { Room } from "@/components/Room";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ExcersiceTabsView({ rooms }: { rooms: any[] }) {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <Tabs defaultValue={rooms[0]?.id} className="h-full bg-transparent">
        <TabsList className="bg-transparent">
          {rooms.map((t, i) => (
            <TabsTrigger key={t.id} value={t.id} className="">
              {`Excercise ${i + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {rooms.map((t) => (
          <TabsContent key={t.id} value={t.id} className="w-full h-full">
            <Room roomId={t.id}>
              <InfiniteCanvas />
            </Room>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

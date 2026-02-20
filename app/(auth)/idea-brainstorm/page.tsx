import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createBrainstormExampleCards,
  initializeExampleCards,
} from "@/services/rooms";
import { LogicGraphProvider } from "@/components/CanvasModule/logic-builder/LogicGraphContext";
import { DbSchemaProvider } from "@/components/CanvasModule/db/DbSchemaContext";
import { LogicConnectionProvider } from "@/components/CanvasModule/logic-builder/LogicConnectionContext";

import { playground } from "@/components/LogicModule/playground";

export default async function IdeaBrainstormPage() {
  const { orgId } = await auth();
  playground();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <DbSchemaProvider>
          <LogicConnectionProvider>
            <LogicGraphProvider>
              <Room roomId={`brainstorm-${orgId}`}>
                <InfiniteCanvas
                  toolbarOptions={{
                    text: true,
                    card: false,
                    table: false,
                    answer: false,
                    ellipse: true,
                    feature: true,
                    question: false,
                    rectangle: true,
                    interview: false,
                  }}
                />
              </Room>
            </LogicGraphProvider>
          </LogicConnectionProvider>
        </DbSchemaProvider>
      </div>
    </div>
  );
}

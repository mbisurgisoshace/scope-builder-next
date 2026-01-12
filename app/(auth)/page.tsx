import { auth } from "@clerk/nextjs/server";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { DbSchemaProvider } from "@/components/CanvasModule/db/DbSchemaContext";
import { DbCollectionProvider } from "@/components/CanvasModule/db/CollectionSchemaContext";
import { LogicGraphProvider } from "@/components/CanvasModule/logic-builder/LogicGraphContext";
import { LogicConnectionProvider } from "@/components/CanvasModule/logic-builder/LogicConnectionContext";

export default async function Home() {
  const { orgId } = await auth();

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`db-builder-${orgId}`}>
          <LogicGraphProvider>
            <LogicConnectionProvider>
              <DbSchemaProvider>
                <DbCollectionProvider>
                  <InfiniteCanvas
                    toolbarOptions={{
                      text: false,
                      card: false,
                      table: false,
                      answer: false,
                      ellipse: false,
                      feature: false,
                      question: false,
                      rectangle: false,
                      interview: false,
                    }}
                  />
                </DbCollectionProvider>
              </DbSchemaProvider>
            </LogicConnectionProvider>
          </LogicGraphProvider>
        </Room>
      </div>
    </div>
  );
}

import { auth } from "@clerk/nextjs/server";

import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { DbSchemaProvider } from "@/components/CanvasModule/db/DbSchemaContext";
import { DbCollectionProvider } from "@/components/CanvasModule/db/CollectionSchemaContext";
import { LogicGraphProvider } from "@/components/CanvasModule/logic-builder/LogicGraphContext";
import { LogicConnectionProvider } from "@/components/CanvasModule/logic-builder/LogicConnectionContext";
import ProjectsTable from "@/components/ProjectsTable";
import { NewProject } from "@/components/NewProject";
import { getProject } from "@/services/projects";

export default async function Home({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { orgId } = await auth();
  const { projectId } = await params;

  const project = await getProject(Number(projectId));

  console.log("project", project);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full flex flex-col gap-2">
        <Room roomId={`db-builder-${orgId}-${projectId}`}>
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

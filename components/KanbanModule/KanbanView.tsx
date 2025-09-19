import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";

interface KanbanViewProps {
  kanbanBoards: { label: string; key: string }[];
}

export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
  const { shapes } = useRealtimeShapes();

  console.log("shapes", shapes);

  return (
    <div className="flex flex-row gap-4 w-full h-full px-2 pb-2">
      {kanbanBoards.map((board) => (
        <div
          key={board.key}
          className="w-[300px] h-full bg-white p-1 rounded-lg shadow-md"
        >
          <h2 className="text-xl text-muted-foreground">{board.label}</h2>
          {shapes
            .filter((s) => s.type === board.key || s.subtype === board.key)
            .map((shape) => {
              //   const Component = shapeRegistry[shape.type];
              //   if (!Component) return null;
              //   return (
              //     <Component
              //       key={shape.id}
              //       shape={shape}
              //       isSelected={false}
              //       selectedCount={0}
              //       onResizeStart={() => {}}
              //       onMouseDown={() => {}}
              //     />
              //   );
              return <div>{shape.subtype}</div>;
            })}
        </div>
      ))}
    </div>
  );
}

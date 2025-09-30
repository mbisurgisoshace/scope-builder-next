import React from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { UniqueIdentifier } from "@dnd-kit/core/dist/types/other";
import { MoveIcon } from "lucide-react";

interface BoardProps {
  id: UniqueIdentifier;
  children: React.ReactNode;
  title?: string;
  description?: string;
  //onAddItem?: () => void;
}

const Board = ({
  id,
  children,
  title,
  description,
}: //onAddItem,
BoardProps) => {
  const {
    attributes,
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "container",
    },
  });
  return (
    <div
      {...attributes}
      ref={setNodeRef}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      className={clsx(
        "w-[440px] bg-white p-1 rounded-lg shadow-md flex min-h-0 flex-col",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <h1 className="text-gray-800 text-xl">{title}</h1>
        </div>
        <Button
          size={"icon"}
          variant={"ghost"}
          //className="border p-2 text-xs rounded-xl shadow-lg hover:shadow-xl"
          {...listeners}
        >
          <MoveIcon />
        </Button>
      </div>

      {children}
      {/* <Button variant="ghost" onClick={onAddItem}>
        Add Item
      </Button> */}
    </div>
  );
};

export default Board;

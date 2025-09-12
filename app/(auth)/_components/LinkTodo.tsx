import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { Task, Todo } from "../page";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LinkTodoProps {
  todo: Todo;
  markAsComplete: (id: string, complete: boolean) => Promise<void>;
}

export default function LinkTodo({ todo, markAsComplete }: LinkTodoProps) {
  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-[#B5BCCC] rounded-[8px] px-[12px] py-[12px] flex flex-col gap-3.5 ${
        todo.completed ? "bg-[#E4E5ED66]" : ""
      }`}
    >
      <div className="flex  gap-3.5 items-center">
        <div
          className={`size-4 min-w-[16px] rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${
            todo.completed ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
          }`}
          onClick={() => {
            markAsComplete(todo.id, !todo.completed);
          }}
        >
          {todo.completed && <CheckIcon className="size-2 text-white " />}
        </div>

        <span
          className={`w-full rounded-lg border-[1.5px] px-[12px] py-[12px] border-[#E4E5ED] text-[14px] font-medium text-[#6A35FF] ${
            todo.completed ? "line-through" : ""
          }`}
        >
          {todo.url}
        </span>
      </div>
      <div className="flex ml-7">
        <Link
          href={todo.url!}
          target="_blank"
          className="rounded-lg border-[1.5px] h-[44px] w-[44px] mr-2"
          >
          <Button variant={"link"} className="w-full h-full">
            <ExternalLinkIcon className="text-[#8B93A1]" />
          </Button>
        </Link>
        <span className="rounded-lg border-[1.5px] h-[44px] w-[44px]">
          <Button
            variant={"link"}
            className="w-full h-full"
            onClick={() => {
              navigator.clipboard.writeText(todo.url!);
            }}
            >
            <CopyIcon className="text-[#8B93A1]" />
          </Button>
        </span>
            </div>
    </li>
  );
}

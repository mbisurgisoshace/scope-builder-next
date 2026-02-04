"use client";

import {
  YoutubeIcon,
  BookOpenIcon,
  EllipsisIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MessageSquareMoreIcon,
  CircleCheckIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { markTopicAsCompleted } from "@/services/topics";

type Topic = {
  id: number;
  name: string;
  type: string;
  isDone: boolean;
  deadline: string;
  description: string | null;
  concept_tasks: { id: number; subtype: string; completed: boolean }[];
  startup_tasks: { id: number; subtype: string; completed: boolean }[];
  excercises_tasks: { id: number; subtype: string; completed: boolean }[];
};

interface TopicProps {
  topic: Topic;
}

export default function Topic({ topic }: TopicProps) {
  const [isOpen, setIsOpen] = useState(!topic.isDone);
  const [topicState, setTopicState] = useState<Topic>(topic);

  const markAsCompleted = async () => {
    await markTopicAsCompleted(topic.id);
    setTopicState({ ...topicState, isDone: true });
  };

  useEffect(() => {
    if (topicState.isDone) {
      setIsOpen(false);
    }
  }, [topicState.isDone]);

  return (
    <div key={topic.id} className="grid grid-cols-7 pr-4">
      <div className="col-span-2 flex flex-row items-center ">
        <div className="h-full flex flex-col items-center justify-center">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-[26px] min-w-[26px] h-[26px] min-h-[26px]  rounded-full flex items-center justify-center cursor-pointer ${topicState.isDone ? "bg-[#E4F5E9]" : "bg-[#F4F0FF]"}`}
          >
            {isOpen ? (
              <ChevronDownIcon
                className={` ${topicState.isDone ? "text-[#247C30]" : "text-[#6A35FF]"}`}
                size={18}
              />
            ) : (
              <ChevronRightIcon
                className={` ${topicState.isDone ? "text-[#247C30]" : "text-[#6A35FF]"}`}
                size={18}
              />
            )}
          </div>
          <div
            className={`w-1.5  h-full ${topicState.isDone ? "bg-[#E4F5E9]" : "bg-[#F4F0FF]"}`}
          />
        </div>
        <div className="h-full flex flex-col gap-4 px-3.5 w-full">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <Badge
                className={`${topicState.isDone ? "bg-[#E4F5E9] text-[#247C30]" : "bg-[#F4F0FF] text-[#6A35FF]"}`}
              >{`${topicState.type}`}</Badge>
              <Badge
                className={`${topicState.isDone ? "bg-[#E4F5E9] text-[#247C30]" : "bg-[#F4F0FF] text-[#6A35FF]"}`}
              >{`${topicState.deadline}`}</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* <Button variant="ghost" size="icon"> */}
                <EllipsisIcon className="cursor-pointer" size={20} />
                {/* </Button> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex flex-row justify-between items-center"
                    onClick={markAsCompleted}
                  >
                    Complete
                    <CircleCheckIcon
                      className="ml-2 text-green-500"
                      size={16}
                    />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isOpen && (
            <>
              <h3 className="text-sm font-semibold">{topicState.name}</h3>
              <p className="text-xs font-medium text-[#697288]">
                {topicState.description}
              </p>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-3 col-span-5  font-semibold border border-gray-400 rounded-[10px] mb-[30px]">
          <div className="border-r border-gray-400 p-4 h-[172px] grid grid-cols-4 gap-2 content-start">
            {topicState.concept_tasks.map((task) => (
              <TaskItem
                key={task.id}
                type={task.subtype}
                completed={task.completed}
              />
            ))}
          </div>
          <div className="border-r border-gray-400  p-4 h-[172px] grid grid-cols-4 gap-8">
            {topicState.excercises_tasks.map((task) => (
              <TaskItem
                key={task.id}
                type={task.subtype}
                completed={task.completed}
              />
            ))}
          </div>
          <div className="border-r border-gray-400  p-4  h-[172px] grid grid-cols-4 gap-8">
            {topicState.startup_tasks.map((task) => (
              <TaskItem
                key={task.id}
                type={task.subtype}
                completed={task.completed}
              />
            ))}
          </div>
        </div>
      )}

      {!isOpen && <div className="h-14" />}
    </div>
  );
}

const TaskItem = ({
  type,
  completed,
}: {
  type: string;
  completed: boolean;
}) => {
  if (type === "youtube")
    return (
      <ProgressItem
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <YoutubeIcon size={20} />
          </div>
        }
      >
        <div>
          <YouTubeEmbed
            width={400}
            height={226}
            params="controls=0"
            videoid="TZ43SRdTMs0"
          />
          <span className="text-[#697288] text-xs font-medium mt-4 mb-1 block">
            YouTube
          </span>
          <h3 className="text-[#111827] text-sm font-semibold mb-3">
            AI allocation in corporate management 2026{" "}
          </h3>
          <p className="text-[#697288] text-xs font-medium mb-1">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.{" "}
          </p>
        </div>
      </ProgressItem>
    );

  if (type === "lecture")
    return (
      <div
        className={`size-10 ${completed ? "bg-[#28BF58] text-[#FFFFFF]" : "bg-[#EDF6F0] text-[#8F84AE]"} flex items-center justify-center rounded-[8px] `}
      >
        <BookOpenIcon size={20} />
      </div>
    );

  if (type === "article")
    return (
      <div
        className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
      >
        <FileTextIcon size={20} />
      </div>
    );

  if (type === "comment")
    return (
      <div
        className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
      >
        <MessageSquareMoreIcon size={20} />
      </div>
    );

  return null;
};

const ProgressItem = ({
  triggerEl,
  children,
}: {
  triggerEl: React.ReactNode;
  children: React.ReactNode;
}) => {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer" asChild>
        {triggerEl}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[448px]">
        <DialogHeader>
          <DialogTitle>Details</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

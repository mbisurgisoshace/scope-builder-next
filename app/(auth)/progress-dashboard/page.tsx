import {
  YoutubeIcon,
  BookOpenIcon,
  FileTextIcon,
  ChevronDownIcon,
  MessageSquareMoreIcon,
} from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const TOPICS = [
  {
    id: 1,
    name: "Topic #1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, seddo eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    concept_tasks: [
      { id: 1, type: "youtube", completed: false },
      { id: 2, type: "youtube", completed: false },
      { id: 3, type: "youtube", completed: true },
      { id: 4, type: "lecture", completed: true },
      { id: 5, type: "article", completed: false },
    ],
    excercises_tasks: [
      { id: 1, type: "youtube", completed: false },
      { id: 2, type: "comment", completed: false },
    ],
    startup_tasks: [{ id: 1, type: "youtube", completed: false }],
    group_tasks: [{ id: 1, type: "youtube", completed: false }],
  },
  {
    id: 2,
    name: "Topic #2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, seddo eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    concept_tasks: [
      { id: 1, type: "youtube", completed: false },
      { id: 2, type: "youtube", completed: false },
    ],
    excercises_tasks: [{ id: 1, type: "youtube", completed: false }],
    startup_tasks: [],
    group_tasks: [{ id: 1, type: "youtube", completed: false }],
  },
  {
    id: 3,
    name: "Topic #3",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, seddo eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    concept_tasks: [],
    excercises_tasks: [],
    startup_tasks: [],
    group_tasks: [{ id: 1, type: "youtube", completed: false }],
  },
];

export default async function ProgressDashboardPage() {
  return (
    <div className="p-8 h-full bg-[#F0F1F5] flex justify-center">
      <div className="flex flex-col gap-5 max-w-[1182px] h-full">
        <div className="grid grid-cols-5 pr-8 gap-8">
          <h1 className="text-[#111827] text-2xl font-semibold col-span-1"></h1>
          <div className="grid grid-cols-4 h-[34px] col-span-4 bg-[#2E3545] text-white text-sm font-semibold border border-[#EFF0F4] rounded-[4px]">
            <div className="border-r border-[#F0F1F5] flex items-center px-4">
              Concept
            </div>
            <div className="border-r border-[#F0F1F5] flex items-center px-4">
              Practice exercises
            </div>
            <div className="border-r border-[#F0F1F5] flex items-center px-4  ">
              My startup
            </div>
            <div className="flex items-center px-4">My group</div>
          </div>
        </div>

        <div className="bg-white px-3.5 py-8 rounded-2xl w-full flex-1">
          {TOPICS.map((topic) => (
            <div key={topic.id} className="grid grid-cols-5 pr-4">
              <div className="col-span-1 flex flex-row items-center ">
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-[26px] h-[26px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
                    <ChevronDownIcon className="text-[#6A35FF]" size={18} />
                  </div>
                  <div className="w-1.5 bg-[#F4F0FF] h-full" />
                </div>
                <div className="h-full flex flex-col gap-4 px-3.5">
                  <Badge className="bg-[#F4F0FF] text-[#6A35FF]">{`Topic # ${topic.id}`}</Badge>
                  <h3 className="text-sm font-semibold">{topic.name}</h3>
                  <p className="text-xs font-medium text-[#697288]">
                    {topic.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 col-span-4  font-semibold border border-gray-400 rounded-[10px] mb-[30px]">
                <div className="border-r border-gray-400 p-4 h-[172px] grid grid-cols-4 gap-2 content-start">
                  {topic.concept_tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      type={task.type}
                      completed={task.completed}
                    />
                  ))}
                </div>
                <div className="border-r border-gray-400  p-4 h-[172px] grid grid-cols-4 gap-8">
                  {topic.excercises_tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      type={task.type}
                      completed={task.completed}
                    />
                  ))}
                </div>
                <div className="border-r border-gray-400  p-4  h-[172px] grid grid-cols-4 gap-8">
                  {topic.startup_tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      type={task.type}
                      completed={task.completed}
                    />
                  ))}
                </div>
                <div className="p-4 h-[172px] grid grid-cols-4 gap-8">
                  {topic.group_tasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      type={task.type}
                      completed={task.completed}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* <div className="grid grid-cols-5 pr-4">
            <div className="col-span-1 flex flex-row items-center ">
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-[26px] h-[26px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
                  <ChevronDownIcon className="text-[#6A35FF]" size={18} />
                </div>
                <div className="w-1.5 bg-[#F4F0FF] h-full" />
              </div>
              <div className="h-full flex flex-col gap-4 px-3.5">
                <Badge className="bg-[#F4F0FF] text-[#6A35FF]">Topic #1</Badge>
                <h3 className="text-sm font-semibold">Topic name goes here</h3>
                <p className="text-[11px] font-medium text-[#697288]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna
                  aliqua.{" "}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 col-span-4  font-semibold border border-[#E4E5ED] rounded-[10px] mb-[30px]">
              <div className="border-r border-[#E4E5ED] p-4 h-[172px] grid grid-cols-4 gap-2 content-start">
                <div className="size-10 bg-[#EDF6F0] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <YoutubeIcon size={18} />
                </div>
                <div className="size-10 bg-[#EDF6F0] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <YoutubeIcon size={18} />
                </div>
                <div className="size-10 bg-[#28BF58] flex items-center justify-center rounded-[8px] text-[#FFFFFF]">
                  <YoutubeIcon size={18} />
                </div>
                <div className="size-10 bg-[#28BF58] flex items-center justify-center rounded-[8px] text-[#FFFFFF]">
                  <BookOpenIcon size={18} />
                </div>
                <div className="size-10 bg-[#EDF6F0] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <FileTextIcon size={18} />
                </div>
              </div>
              <div className="border-r border-[#E4E5ED]  p-4 h-[172px] grid grid-cols-4 gap-8"></div>
              <div className="border-r border-[#E4E5ED]  p-4  h-[172px] grid grid-cols-4 gap-8"></div>
              <div className="p-4 h-[172px] grid grid-cols-4 gap-8"></div>
            </div>
          </div> */}

          {/* <div className="grid grid-cols-5 pr-4">
            <div className="col-span-1 flex flex-row items-center ">
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-[26px] h-[26px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
                  <ChevronDownIcon className="text-[#6A35FF]" size={18} />
                </div>
                <div className="w-1.5 bg-[#F4F0FF] h-full" />
              </div>
              <div className="h-full flex flex-col gap-4 px-3.5">
                <Badge className="bg-[#F4F0FF] text-[#6A35FF]">Topic #2</Badge>
                <h3 className="text-sm font-semibold">Topic name goes here</h3>
                <p className="text-[11px] font-medium text-[#697288]">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed
                  do eiusmod tempor incididunt ut labore et dolore magna
                  aliqua.{" "}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 col-span-4  font-semibold border border-[#E4E5ED] rounded-[10px]">
              <div className="border-r border-[#E4E5ED] p-4 h-[172px] grid grid-cols-4 gap-2 content-start">
                <div className="size-10 bg-[#EDF6F0] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <BookOpenIcon size={18} />
                </div>
                <div className="size-10 bg-[#EDF6F0] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <FileTextIcon size={18} />
                </div>
                <ProgressItem
                  triggerEl={
                    <div className="size-10 bg-[#28BF58] flex items-center justify-center rounded-[8px] text-[#FFFFFF]">
                      <YoutubeIcon size={18} />
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
                    <span className="text-[#697288] text-[11px] font-medium mt-4 mb-1 block">
                      YouTube
                    </span>
                    <h3 className="text-[#111827] text-sm font-semibold mb-3">
                      AI allocation in corporate management 2026{" "}
                    </h3>
                    <p className="text-[#697288] text-[11px] font-medium mb-1">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                      sed do eiusmod tempor incididunt ut labore et dolore magna
                      aliqua.{" "}
                    </p>
                  </div>
                </ProgressItem>
                <div className="size-10 bg-[#28BF58] flex items-center justify-center rounded-[8px] text-[#FFFFFF]">
                  <YoutubeIcon size={18} />
                </div>
                <div className="size-10 bg-[#F3F0FD] flex items-center justify-center rounded-[8px] text-[#8F84AE]">
                  <YoutubeIcon size={18} />
                </div>
              </div>
              <div className="border-r border-[#E4E5ED]  p-4 h-[172px] grid grid-cols-4 gap-8"></div>
              <div className="border-r border-[#E4E5ED]  p-4  h-[172px] grid grid-cols-4 gap-8"></div>
              <div className="p-4 h-[172px] grid grid-cols-4 gap-8">
                <div className="size-10 bg-[#FDF1E4] flex items-center justify-center rounded-[8px] text-[#CA7519]">
                  <MessageSquareMoreIcon size={18} />
                </div>
              </div>
            </div>
          </div> */}
        </div>
      </div>
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

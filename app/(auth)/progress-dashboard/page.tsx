import Topic from "./_components/Topic";

/*
Task Table  
  task_id
  topic_id
  type
  subtype
  order

Topics Table
  topic_id
  name
  description
  topic_type
  deadline
  order

TopicProgress Table
  org_id
  task_id optional
  topic_id optional
  completed
*/

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
    isDone: false,
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
    isDone: false,
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
    isDone: false,
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
            <Topic key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
}

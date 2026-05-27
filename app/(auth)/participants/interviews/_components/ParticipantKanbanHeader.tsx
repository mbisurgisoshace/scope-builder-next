import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { InterviewMilestone } from "@/lib/generated/prisma";

interface MilestoneStepProps {
  number: number;
  date: string;
  completed: number;
  total: number;
  label?: string;
  isLast?: boolean;
}

function MilestoneStep({
  number,
  date,
  completed,
  total,
  label = "Documented",
  isLast = false,
}: MilestoneStepProps) {
  const isComplete = completed === total;

  return (
    <div className="relative flex flex-1 items-center px-4 py-3 bg-white">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-semibold ${isComplete ? "text-[#70747D]" : "text-[#111827]"}`}
          >
            Milestone #{number}
          </span>
          <span className="text-xs text-gray-400">{date}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isComplete && <CheckCircle2 className="w-4 h-4 text-green-500" />}
          <span
            className={`text-[18px] font-semibold ${isComplete ? "text-[#70747D]" : "text-[#111827]"}`}
          >
            {completed}/{total}
          </span>
          <span className="text-sm font-medium text-[#70747D]">{label}</span>
        </div>
      </div>

      {!isLast && (
        <svg
          className="absolute -right-3 top-0 h-full w-3 z-10"
          viewBox="0 0 12 100"
          preserveAspectRatio="none"
        >
          <path d="M0 0 L12 50 L0 100 Z" fill="white" />
          <path
            d="M0 0 L12 50 L0 100"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
}

interface ParticipantKanbanHeaderProps {
  milestones: InterviewMilestone[];
  documentedCount: number;
}

export default function ParticipantKanbanHeader({
  milestones,
  documentedCount,
}: ParticipantKanbanHeaderProps) {
  return (
    <div className="flex border border-gray-200 overflow-hidden bg-white items-center justify-between">
      <div className="flex">
        {milestones.map((m, i) => {
          const completed = Math.min(documentedCount, m.documented_goal);
          const date = new Date(m.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <div key={m.id} className="w-[200px] px-2">
              <MilestoneStep
                number={i + 1}
                date={date}
                completed={completed}
                total={m.documented_goal}
                isLast={i === milestones.length - 1}
              />
            </div>
          );
        })}
      </div>

      <div className="px-8 flex gap-2 ">
        <Badge className="bg-[#EFF0F4] text-[#111827] px-4 py-2">
          <span>Minimum number of Payer interviews:</span>
          <span>8</span>
        </Badge>

        <Badge className="bg-[#EFF0F4] text-[#111827]">
          <span className="opacity-50">Current:</span>
          <span className="opacity-50">4</span>
        </Badge>
      </div>
    </div>
  );
}

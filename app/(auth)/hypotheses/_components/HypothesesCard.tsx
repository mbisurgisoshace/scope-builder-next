"use client";

import {
  MicIcon,
  FlameIcon,
  CircleXIcon,
  EllipsisIcon,
  HourglassIcon,
  CircleCheckIcon,
  MessageCircleIcon,
} from "lucide-react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

/*
  Hypotheses Table
    id
    type
    title
    priority
    description
    conclusion_status
    conclusion_content

  InterviewResponses Table
    id
    question_id
    participant_id
    response_content
    attachments

  Questions Tables
    id
    hypothesis_id
    title
*/

type Response = {
  id: string;
  content: string;
  interviewee: string;
};

type Question = {
  id: string;
  title: string;
  responses: Response[];
};

type Hypotheses = {
  id: string;
  type?: string;
  title: string;
  priority: number;
  description: string;
  interviews: string[];
  questions: Question[];
  conclusion_content?: string;
  conclusion_status?: "testing" | "validated" | "invalidated";
};

interface HypothesesCardProps {
  hypotheses: Hypotheses;
}

export default function HypothesesCard({ hypotheses }: HypothesesCardProps) {
  const [showResponses, setShowResponses] = useState(false);

  const getPriorityLevel = (priority: number | undefined) => {
    if (!priority) return "No priority";
    switch (priority) {
      case 1:
        return "Low priority";
      case 2:
        return "Medium priority";
      case 3:
        return "High priority";
      default:
        return "No priority";
    }
  };

  const getConclusionStatus = (status: string | undefined) => {
    switch (status) {
      case "testing":
        return (
          <span className="flex flex-row gap-2 text-[#6E6588] text-xs font-semibold items-center">
            <HourglassIcon size={20} />
            Testing
          </span>
        );
      case "validated":
        return (
          <span className="flex flex-row gap-2 text-[#247C30] text-xs font-semibold items-center">
            <CircleCheckIcon size={20} />
            Validated
          </span>
        );
      case "invalidated":
        return (
          <span className="flex flex-row gap-2 text-[#C23522] text-xs font-semibold items-center">
            <CircleXIcon size={20} />
            Invalidated
          </span>
        );
      default:
        return "Proposed";
    }
  };

  return (
    <div className="bg-white rounded-2xl px-10 py-8 grid grid-cols-3 gap-10">
      <div className="w-full col-span-2 border-r border-r-[#E4E5ED] pr-10">
        <h3 className="text-lg font-semibold w-full flex justify-between items-center mb-5">
          {hypotheses.title}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
          </DropdownMenu>
        </h3>
        {hypotheses.questions.length === 0 && (
          <span className="text-[#697288] font-semibold text-xs">
            No questions has been added yet.
          </span>
        )}

        {hypotheses.questions.length > 0 && (
          <div className="mb-9">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-0.5">
                <MicIcon className="text-[#697288] mr-3" size={24} />
                {hypotheses.interviews.map((interview, index) => {
                  return (
                    <div key={index}>
                      <span className="text-xs text-[#697288] font-semibold underline decoration-dotted">
                        {interview}
                      </span>
                      {index < hypotheses.interviews.length - 1 && (
                        <span className="text-xs text-[#697288] font-semibold">
                          ,{" "}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!hypotheses.questions.some(
                (question) => question.answers.length > 0,
              ) && (
                <span className="text-[#697288] text-xs font-semibold">
                  No responses yet
                </span>
              )}

              {hypotheses.questions.some(
                (question) => question.answers.length > 0,
              ) && (
                <span
                  className="text-[#6A35FF] text-xs font-semibold cursor-pointer"
                  onClick={() => setShowResponses(!showResponses)}
                >
                  {`${showResponses ? "Hide" : "Show responses"}`}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {hypotheses.questions.map((question, index) => (
            <div key={question.id} className="flex flex-col gap-2.5">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#6A35FF]" />
                  <span className="text-sm font-medium">{question.title}</span>
                </div>
                <div className="flex flex-row items-center gap-2 text-[#6E6588]">
                  <MessageCircleIcon size={18} />
                  <span className="font-semibold text-xs w-1.5">
                    {question.answers.length}
                  </span>
                </div>
              </div>

              {showResponses &&
                question.answers.map((answer) => (
                  <div
                    key={answer.id}
                    className="bg-[#F3F0FD] rounded-[5px] py-2.5 px-6 flex flex-row justify-between items-center"
                  >
                    <span className="text-sm font-medium text-[#111827]">
                      {answer.content}
                    </span>
                    <span className="text-xs font-semibold text-[#6E6588]">
                      {answer.interviewee}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div className="bg-[#F3F0FD] text-xs rounded-full text-[#6E6588] font-semibold px-2 py-0.5">
            [Type]
          </div>
          <div className="flex flex-row items-center gap-2.5">
            {hypotheses.priority > 0 && (
              <div className="flex flex-row items-center">
                <FlameIcon
                  size={20}
                  fill={hypotheses.priority > 0 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypotheses.priority > 0 ? "#DF6E5A" : "#F3F0FD"}
                />
                <FlameIcon
                  size={20}
                  fill={hypotheses.priority > 1 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypotheses.priority > 1 ? "#DF6E5A" : "#F3F0FD"}
                />
                <FlameIcon
                  size={20}
                  fill={hypotheses.priority > 2 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypotheses.priority > 2 ? "#DF6E5A" : "#F3F0FD"}
                />
              </div>
            )}
            <span className="text-[#6E6588] text-xs font-semibold ">
              {getPriorityLevel(hypotheses.priority)}
            </span>
          </div>
        </div>

        <div
          className={`rounded-[5px] border py-3 flex items-center justify-center ${hypotheses.conclusion_status === "validated" && "bg-[#E9F6EE] border-[#E9F6EE]"} ${hypotheses.conclusion_status === "invalidated" && "bg-[#FDF0F0] border-[#FDF0F0]"}`}
        >
          {getConclusionStatus(hypotheses.conclusion_status)}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[#697288] font-semibold text-xs">
            Conclusion:
          </span>
          <p className="text-[#111827] font-medium text-sm">
            {hypotheses.conclusion_content}
          </p>
        </div>
      </div>
    </div>
  );
}

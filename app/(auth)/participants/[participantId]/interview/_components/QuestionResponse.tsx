"use client";

import { useState } from "react";
import { LoaderIcon } from "lucide-react";

import { Question } from "./KanbanView";
import { Textarea } from "@/components/ui/textarea";
import { upsertInterviewResponse } from "@/services/hypothesis";

interface QuestionResponseProps {
  question: Question;
  participantId: string;
}

export default function QuestionResponse({
  question,
  participantId,
}: QuestionResponseProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(question.interviewResponse || "");

  const onUpdateResponse = async () => {
    if (response.trim().length === 0) return;

    setIsLoading(true);

    try {
      await upsertInterviewResponse(question.id, participantId, response);
    } catch (err) {
      console.log(err);
    }

    setIsLoading(false);
  };

  return (
    <div className="relative w-full bg-[#E6CFFF] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-col overflow-hidden px-6 py-6 gap-4">
      <span className="flex flex-row items-center gap-2.5 text-sm text-[#111827] font-medium">
        {question.title}
      </span>
      <Textarea
        value={response}
        className="bg-white"
        onBlur={onUpdateResponse}
        onChange={(e) => setResponse(e.target.value)}
      />
      {isLoading && (
        <LoaderIcon
          size={16}
          className="absolute bottom-1 right-1 animate-spin"
        />
      )}
    </div>
  );
}

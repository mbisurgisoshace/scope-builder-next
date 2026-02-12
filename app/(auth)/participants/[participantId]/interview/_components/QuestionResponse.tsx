"use client";

import { useRef, useState } from "react";
import { EllipsisIcon, LoaderIcon } from "lucide-react";

import { Question } from "./KanbanView";
import { Textarea } from "@/components/ui/textarea";
import { upsertInterviewResponse } from "@/services/hypothesis";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { Attachment } from "@/components/Notes";

interface QuestionResponseProps {
  question: Question;
  participantId: string;
}

export default function QuestionResponse({
  question,
  participantId,
}: QuestionResponseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const filename = file.name;
    const sizeKB = file.size / 1024;
    const isImage = file.type.startsWith("image/");
    const { url, mime } = await uploadToSupabase(file);

    const newAttachment: Attachment = {
      url,
      name: filename,
      type: isImage ? "image" : "file",
      size:
        sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${Math.round(sizeKB)} KB`,
    };

    e.target.value = "";

    console.log(newAttachment);

    try {
      await upsertInterviewResponse(question.id, participantId, response, [
        ...(question.attachments || []),
        newAttachment,
      ]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="relative w-full bg-[#E6CFFF] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-col overflow-hidden px-6 py-6 gap-4">
      <div className="absolute top-1 right-1">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6">
              <EllipsisIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={(e) => inputRef.current?.click()}>
              Add Attachments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={onUploadFile}
      />
    </div>
  );
}

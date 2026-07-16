"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { DropdownOptionsEditor } from "./DropdownOptionsEditor";
import type {
  DropdownOption,
  InterviewQuestion,
  ResponseType,
} from "./types";

const RESPONSE_TYPES: { value: ResponseType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "scale", label: "Scale" },
  { value: "dropdown", label: "Dropdown" },
];

interface QuestionEditorProps {
  question: InterviewQuestion;
  onChange: (patch: Partial<InterviewQuestion>) => void;
  /**
   * Persist the question. Pass a patch when committing in the same tick as the edit —
   * state hasn't re-rendered yet, so the patch is the only fresh copy of the change.
   */
  onCommit: (patch?: Partial<InterviewQuestion>) => void;
}

export function QuestionEditor({
  question,
  onChange,
  onCommit,
}: QuestionEditorProps) {
  const [editing, setEditing] = useState(false);

  // A written question reads as text; clicking it puts the input back.
  const authored = question.title.trim() !== "" && !editing;

  const handleOptionsChange = (
    options: DropdownOption[],
    { commit }: { commit: boolean },
  ) => {
    onChange({ options });
    if (commit) onCommit({ options });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Question title — bold text once written, otherwise an input. */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-[#697288]">Question:</span>
        {authored ? (
          <p
            role="button"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setEditing(true);
            }}
            className="cursor-text text-sm font-semibold text-[#1F2430]"
          >
            {question.title}
          </p>
        ) : (
          <Input
            autoFocus={editing}
            value={question.title}
            onChange={(e) => onChange({ title: e.target.value })}
            onBlur={() => {
              setEditing(false);
              onCommit();
            }}
            placeholder="Type your question"
            className="h-9 bg-white"
          />
        )}
      </div>

      {/* Response type selector — inline, violet accent. */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#697288]">Response type:</span>
        <Select
          value={question.responseType}
          onValueChange={(value) => {
            const responseType = value as ResponseType;
            onChange({ responseType });
            onCommit({ responseType });
          }}
        >
          <SelectTrigger
            size="sm"
            className="h-auto gap-1 border-0 bg-transparent px-0 py-0 text-sm font-semibold text-[#6A35FF] shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-[#6A35FF] [&_svg]:opacity-100"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESPONSE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {question.responseType === "dropdown" && (
        <DropdownOptionsEditor
          options={question.options}
          onChange={handleOptionsChange}
        />
      )}
      {/* `scale` has no extra configuration — the response is a fixed 1-5 rating. */}
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { responseTypeLabel } from "./responseTypes";
import type { InterviewQuestion } from "./types";

interface QuestionViewProps {
  question: InterviewQuestion;
  onEdit: () => void;
  onDelete: () => void;
  /** Supplied by the sortable wrapper; absent in read-only mode. */
  dragHandle?: ReactNode;
  readOnly?: boolean;
}

export function QuestionView({
  question,
  onEdit,
  onDelete,
  dragHandle,
  readOnly = false,
}: QuestionViewProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-2">
          {/* Pulled into the column's left padding so the label stays flush with the
              rest of the column whether or not the handle is there. */}
          {dragHandle && <div className="-ml-10 -mt-1 shrink-0">{dragHandle}</div>}
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-base text-[#4E5566]">Question:</span>
            <p className="text-base font-semibold text-[#1F2430]">
              {question.title}
            </p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Edit question"
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6E7689] hover:bg-[#F1F2F6] hover:text-[#4B4560]"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete question"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-md text-[#6E7689] hover:bg-[#F1F2F6] hover:text-[#B42318]"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <p className="text-base text-[#4E5566]">
        Response type:{" "}
        <span className="font-semibold text-[#6A35FF]">
          {responseTypeLabel(question.responseType)}
        </span>
      </p>

      {question.responseType === "dropdown" && question.options.length > 0 && (
        <ul className="flex flex-col gap-1">
          {question.options.map((option) => (
            <li
              key={option.id}
              className="flex items-center gap-2 text-base text-[#4E5566]"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#B7BAC5]" />
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

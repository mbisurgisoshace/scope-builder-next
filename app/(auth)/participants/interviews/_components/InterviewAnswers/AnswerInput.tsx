"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AnswerableQuestion } from "./types";

const SCALE_POINTS = [1, 2, 3, 4, 5];

interface AnswerInputProps {
  question: AnswerableQuestion;
  value: string;
  onChange: (value: string) => void;
  /**
   * Persist the answer. Pass the value when committing in the same tick as the edit —
   * state hasn't re-rendered yet, so the argument is the only fresh copy.
   */
  onCommit: (value?: string) => void;
}

export function AnswerInput({
  question,
  value,
  onChange,
  onCommit,
}: AnswerInputProps) {
  if (question.responseType === "scale") {
    // 0 when unanswered, so no point reads as selected.
    const numValue = value ? Number(value) : 0;
    return (
      <div className="flex gap-1.5">
        {SCALE_POINTS.map((n) => {
          const selected = numValue === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => {
                const next = selected ? "" : String(n);
                onChange(next);
                onCommit(next);
              }}
              className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors ${
                selected
                  ? "border-[#6A35FF] bg-[#F4F0FF] text-[#6A35FF]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.responseType === "dropdown") {
    return (
      <Select
        value={value || undefined}
        onValueChange={(next) => {
          onChange(next);
          onCommit(next);
        }}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select an answer" />
        </SelectTrigger>
        <SelectContent>
          {question.options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit()}
      placeholder="Type user's answer"
      className="bg-white"
    />
  );
}

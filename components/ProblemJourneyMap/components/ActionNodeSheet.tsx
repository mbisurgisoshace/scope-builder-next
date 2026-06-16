"use client";

import { useEffect, useRef, useState } from "react";
import { PencilIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export interface Problem {
  id: string;
  description: string;
}

interface ActionNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problems: Problem[];
  onAddProblem: (description: string) => void;
}

const TABS = [
  { value: "problem", label: "Problem" },
  { value: "solution", label: "Solution" },
  { value: "assumptions", label: "Assumptions & Hypothesis" },
  { value: "responses", label: "Responses" },
  { value: "conclusions", label: "Conclusions" },
] as const;

function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2 py-0.5">
          Problem
        </span>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-2">
        {problem.description}
      </p>
    </div>
  );
}

export function ActionNodeSheet({
  open,
  onOpenChange,
  problems,
  onAddProblem,
}: ActionNodeSheetProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setIsAdding(false);
      setDraft("");
    }
  }, [open]);

  useEffect(() => {
    if (isAdding) {
      textareaRef.current?.focus();
    }
  }, [isAdding]);

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAddProblem(trimmed);
    setDraft("");
    setIsAdding(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[540px] sm:max-w-[540px] flex flex-col p-2 gap-0 [&>button:last-of-type]:hidden"
      >
        <Tabs defaultValue="problem" className="w-full">
          <TabsList className="w-full bg-white border-1 ">
            {TABS.map(({ value, label }) => (
              <TabsTrigger key={value} value={value} className="text-xs">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Separator />

          <TabsContent value="problem">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Problems
              </span>
              <Button
                onClick={() => setIsAdding(true)}
                className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors px-3 py-1.5 rounded-full"
              >
                + Add new problem
              </Button>
            </div>

            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}

            {isAdding && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    What the problem?
                  </span>
                  <button
                    onClick={handleSave}
                    className="text-sm font-medium text-[#6A35FF] hover:text-purple-800 transition-colors"
                  >
                    ✓ Save
                  </button>
                </div>
                <textarea
                  ref={textareaRef}
                  className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none leading-snug bg-transparent"
                  rows={3}
                  placeholder="Describe your problem..."
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSave();
                  }}
                />
              </div>
            )}
          </TabsContent>

          {(
            ["solution", "assumptions", "responses", "conclusions"] as const
          ).map((value) => (
            <TabsContent
              key={value}
              value={value}
              className="mt-0 p-5 flex-1"
            />
          ))}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

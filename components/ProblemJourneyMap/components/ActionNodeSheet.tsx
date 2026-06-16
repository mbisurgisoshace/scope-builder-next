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

export interface Solution {
  id: string;
  description: string;
}

interface ActionNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problems: Problem[];
  onAddProblem: (description: string) => void;
  solutions: Solution[];
  onAddSolution: (description: string) => void;
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
    <div className="bg-[#F3F3F6] border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-[#D02D50] text-white rounded-full px-2 py-0.5">
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

function SolutionCard({ solution }: { solution: Solution }) {
  return (
    <div className="bg-[#E8FAE9] border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-[#70E38F] text-[#111827] rounded-full px-2 py-0.5">
          Solution
        </span>
        <button className="text-gray-300 hover:text-gray-500 transition-colors">
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-2">
        {solution.description}
      </p>
    </div>
  );
}

export function ActionNodeSheet({
  open,
  onOpenChange,
  problems,
  onAddProblem,
  solutions,
  onAddSolution,
}: ActionNodeSheetProps) {
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [problemDraft, setProblemDraft] = useState("");
  const problemTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [isAddingSolution, setIsAddingSolution] = useState(false);
  const [solutionDraft, setSolutionDraft] = useState("");
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) {
      setIsAddingProblem(false);
      setProblemDraft("");
      setIsAddingSolution(false);
      setSolutionDraft("");
    }
  }, [open]);

  useEffect(() => {
    if (isAddingProblem) problemTextareaRef.current?.focus();
  }, [isAddingProblem]);

  useEffect(() => {
    if (isAddingSolution) solutionTextareaRef.current?.focus();
  }, [isAddingSolution]);

  function handleSaveProblem() {
    const trimmed = problemDraft.trim();
    if (!trimmed) return;
    onAddProblem(trimmed);
    setProblemDraft("");
    setIsAddingProblem(false);
  }

  function handleSaveSolution() {
    const trimmed = solutionDraft.trim();
    if (!trimmed) return;
    onAddSolution(trimmed);
    setSolutionDraft("");
    setIsAddingSolution(false);
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
                onClick={() => setIsAddingProblem(true)}
                className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors px-3 py-1.5 rounded-full"
              >
                + Add new problem
              </Button>
            </div>

            {problems.map((problem) => (
              <ProblemCard key={problem.id} problem={problem} />
            ))}

            {isAddingProblem && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    What the problem?
                  </span>
                  <button
                    onClick={handleSaveProblem}
                    className="text-sm font-medium text-[#6A35FF] hover:text-purple-800 transition-colors"
                  >
                    ✓ Save
                  </button>
                </div>
                <textarea
                  ref={problemTextareaRef}
                  className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none leading-snug bg-transparent"
                  rows={3}
                  placeholder="Describe your problem..."
                  value={problemDraft}
                  onChange={(e) => setProblemDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSaveProblem();
                  }}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="solution">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-gray-700">
                Solutions
              </span>
              <Button
                onClick={() => setIsAddingSolution(true)}
                className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors px-3 py-1.5 rounded-full"
              >
                + Add new solution
              </Button>
            </div>

            {solutions.map((solution) => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}

            {isAddingSolution && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    What is the solution?
                  </span>
                  <button
                    onClick={handleSaveSolution}
                    className="text-sm font-medium text-[#6A35FF] hover:text-purple-800 transition-colors"
                  >
                    ✓ Save
                  </button>
                </div>
                <textarea
                  ref={solutionTextareaRef}
                  className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none leading-snug bg-transparent"
                  rows={3}
                  placeholder="Describe your solution..."
                  value={solutionDraft}
                  onChange={(e) => setSolutionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                      handleSaveSolution();
                  }}
                />
              </div>
            )}
          </TabsContent>

          {(["assumptions", "responses", "conclusions"] as const).map(
            (value) => (
              <TabsContent
                key={value}
                value={value}
                className="mt-0 p-5 flex-1"
              />
            ),
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, CircleHelpIcon, StarIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AnswerType = "plain_text" | "single_choice" | "multiple_choice";

export interface BankQuestion {
  id: string;
  category: string;
  text: string;
  answerType: AnswerType;
  options?: string[];
}

export interface ProblemQuestionAnswer {
  bankQuestionId: string;
  answer: string | string[];
  source: string;
  confidence: number;
}

export type PainOrGain = "pain" | "gain";

export interface Problem {
  id: string;
  description: string;
  type: string;
  painOrGain: PainOrGain;
  questions: ProblemQuestionAnswer[];
}

export interface SolutionQuestionAnswer {
  bankQuestionId: string;
  answer: string | string[];
}

export interface Solution {
  id: string;
  description: string;
  questions: SolutionQuestionAnswer[];
}

export type ConclusionStatus = "testing" | "validated" | "invalidated";

export interface NodeConclusion {
  id: string;
  status: ConclusionStatus;
  content: string;
}

// ─── Problem metadata options ─────────────────────────────────────────────────

const PROBLEM_TYPES = ["Functional", "Emotional", "Social"] as const;

const PAIN_OR_GAIN_OPTIONS: { value: PainOrGain; label: string }[] = [
  { value: "pain", label: "Pain" },
  { value: "gain", label: "Gain" },
];

const SOURCE_OPTIONS = [
  "Shared personally",
  "Interview",
  "Observed",
  "Assumption",
] as const;

// ─── Hardcoded bank ──────────────────────────────────────────────────────────

const BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "bq-1",
    category: "Market Size",
    text: "How many people on average are experiencing this problem?",
    answerType: "plain_text",
  },
  {
    id: "bq-2",
    category: "Market Size",
    text: "How are they solving it today?",
    answerType: "single_choice",
    options: [
      "Because customers dislike hearing about new ideas",
      "Because the goal is to listen and learn from customers, not to sell",
    ],
  },
  {
    id: "bq-3",
    category: "Market Size",
    text: "How significant is the problem for these people?",
    answerType: "plain_text",
  },
  {
    id: "bq-4",
    category: "Significance",
    text: "Would customers pay to solve this problem?",
    answerType: "single_choice",
    options: ["Yes", "No", "50/50"],
  },
  {
    id: "bq-5",
    category: "Significance",
    text: "What factors make this problem significant?",
    answerType: "multiple_choice",
    options: [
      "Because customers dislike hearing about new ideas",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
  },
  {
    id: "bq-6",
    category: "Significance",
    text: "What is the frequency of this problem?",
    answerType: "plain_text",
  },
];

const BANK_CATEGORIES = Array.from(
  new Set(BANK_QUESTIONS.map((q) => q.category)),
);

const SOLUTION_BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "sbq-1",
    category: "Market Size",
    text: "How many people on average are experiencing this problem?",
    answerType: "plain_text",
  },
  {
    id: "sbq-2",
    category: "Market Size",
    text: "How are they solving it today?",
    answerType: "single_choice",
    options: [
      "Because customers dislike hearing about new ideas",
      "Because the goal is to listen and learn from customers, not to sell",
    ],
  },
  {
    id: "sbq-3",
    category: "Market Size",
    text: "How significant is the problem for these people?",
    answerType: "plain_text",
  },
  {
    id: "sbq-4",
    category: "Significance",
    text: "Would customers pay to solve this problem?",
    answerType: "single_choice",
    options: ["Yes", "No", "50/50"],
  },
  {
    id: "sbq-5",
    category: "Significance",
    text: "What factors make this problem significant?",
    answerType: "multiple_choice",
    options: [
      "Because customers dislike hearing about new ideas",
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    ],
  },
  {
    id: "sbq-6",
    category: "Significance",
    text: "What is the frequency of this problem?",
    answerType: "plain_text",
  },
];

const SOLUTION_BANK_CATEGORIES = Array.from(
  new Set(SOLUTION_BANK_QUESTIONS.map((q) => q.category)),
);

// ─── Props ───────────────────────────────────────────────────────────────────

interface ActionNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string | null;
  problem: Problem | null;
  onSaveProblem: (
    description: string,
    type: string,
    painOrGain: PainOrGain,
    questions: ProblemQuestionAnswer[],
  ) => void;
  solutions: Solution[];
  onAddSolution: (
    description: string,
    questions: SolutionQuestionAnswer[],
  ) => void;
  onUpdateSolution: (
    solutionId: string,
    description: string,
    questions: SolutionQuestionAnswer[],
  ) => void;
}

const TABS = [
  { value: "problem", label: "Problem" },
  { value: "solution", label: "Solution" },
] as const;

// ─── Star rating ──────────────────────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i === value ? 0 : i)}
          className="text-[#6A35FF] focus:outline-none"
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
        >
          <StarIcon
            className={`w-4 h-4 ${
              i <= value
                ? "fill-[#6A35FF] text-[#6A35FF]"
                : "fill-none text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Answer input ─────────────────────────────────────────────────────────────

interface AnswerInputProps {
  question: BankQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
}

function AnswerInput({ question, value, onChange }: AnswerInputProps) {
  if (question.answerType === "plain_text") {
    return (
      <Input
        className="text-sm bg-white"
        placeholder="Answer..."
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.answerType === "single_choice") {
    const strValue = (value as string) ?? "";
    return (
      <RadioGroup
        value={strValue}
        onValueChange={(v) => onChange(v)}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 p-1.5"
      >
        {question.options?.map((opt) => (
          <div
            key={opt}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-[5px] ${
              strValue === opt ? "bg-[#F4F0FF]" : ""
            }`}
          >
            <RadioGroupItem
              value={opt}
              id={`${question.id}-${opt}`}
              className="text-[#6A35FF] data-[state=checked]:border-[#6A35FF]"
            />
            <Label
              htmlFor={`${question.id}-${opt}`}
              className={`text-sm cursor-pointer ${
                strValue === opt
                  ? "text-[#6A35FF] font-medium"
                  : "text-gray-700"
              }`}
            >
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // multiple_choice
  const arrValue = (value as string[]) ?? [];
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 p-1.5">
      {question.options?.map((opt) => {
        const checked = arrValue.includes(opt);
        return (
          <div
            key={opt}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-[5px] ${
              checked ? "bg-[#F4F0FF]" : ""
            }`}
          >
            <Checkbox
              id={`${question.id}-${opt}`}
              checked={checked}
              className="data-[state=checked]:bg-[#6A35FF] data-[state=checked]:border-[#6A35FF]"
              onCheckedChange={(c) => {
                if (c) {
                  onChange([...arrValue, opt]);
                } else {
                  onChange(arrValue.filter((v) => v !== opt));
                }
              }}
            />
            <Label
              htmlFor={`${question.id}-${opt}`}
              className={`text-sm cursor-pointer leading-snug ${
                checked ? "text-[#6A35FF] font-medium" : "text-gray-700"
              }`}
            >
              {opt}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

// ─── Active question ──────────────────────────────────────────────────────────

interface ActiveQuestionItemProps {
  question: BankQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  /** When provided, render the Source + confidence metadata row (problems only). */
  source?: string;
  confidence?: number;
  onSourceChange?: (source: string) => void;
  onConfidenceChange?: (confidence: number) => void;
}

function ActiveQuestionItem({
  question,
  value,
  onChange,
  source,
  confidence,
  onSourceChange,
  onConfidenceChange,
}: ActiveQuestionItemProps) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-gray-800 mb-1.5">
        {question.text}
      </p>
      <AnswerInput question={question} value={value} onChange={onChange} />

      {onSourceChange && onConfidenceChange && (
        <div className="flex items-end gap-6 mt-2">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">Source</span>
            <Select value={source ?? ""} onValueChange={onSourceChange}>
              <SelectTrigger className="h-8 text-xs bg-white w-[170px]">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium">
              Your confidence
            </span>
            <StarRating value={confidence ?? 0} onChange={onConfidenceChange} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bank of Questions ────────────────────────────────────────────────────────

interface BankOfQuestionsProps {
  activeQuestionIds: string[];
  onAdd: (questionId: string) => void;
  title?: string;
}

function BankOfQuestions({
  activeQuestionIds,
  onAdd,
  title = "Bank of questions",
}: BankOfQuestionsProps) {
  const activeSet = new Set(activeQuestionIds);

  const visibleCategories = BANK_CATEGORIES.filter((cat) =>
    BANK_QUESTIONS.some((q) => q.category === cat && !activeSet.has(q.id)),
  );

  if (visibleCategories.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CircleHelpIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>

      {visibleCategories.map((cat) => {
        const questions = BANK_QUESTIONS.filter(
          (q) => q.category === cat && !activeSet.has(q.id),
        );
        return (
          <div
            key={cat}
            className="border border-gray-100 rounded-xl p-3 mb-3 bg-white"
          >
            <p className="text-xs font-semibold text-gray-500 mb-2">{cat}</p>
            <div className="flex flex-col gap-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between bg-[#F3F3F6] border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-700 pr-2">{q.text}</span>
                  <button
                    onClick={() => onAdd(q.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bank of Solutions ────────────────────────────────────────────────────────

interface BankOfSolutionsProps {
  activeQuestionIds: string[];
  onAdd: (questionId: string) => void;
}

function BankOfSolutions({ activeQuestionIds, onAdd }: BankOfSolutionsProps) {
  const activeSet = new Set(activeQuestionIds);

  const visibleCategories = SOLUTION_BANK_CATEGORIES.filter((cat) =>
    SOLUTION_BANK_QUESTIONS.some(
      (q) => q.category === cat && !activeSet.has(q.id),
    ),
  );

  if (visibleCategories.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CircleHelpIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">
          Bank of questions
        </span>
      </div>

      {visibleCategories.map((cat) => {
        const questions = SOLUTION_BANK_QUESTIONS.filter(
          (q) => q.category === cat && !activeSet.has(q.id),
        );
        return (
          <div
            key={cat}
            className="border border-gray-100 rounded-xl p-3 mb-3 bg-white"
          >
            <p className="text-xs font-semibold text-gray-500 mb-2">{cat}</p>
            <div className="flex flex-col gap-2">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center justify-between bg-[#F3F3F6] border border-gray-100 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-gray-700 pr-2">{q.text}</span>
                  <button
                    onClick={() => onAdd(q.id)}
                    className="flex-shrink-0 w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Solution card ────────────────────────────────────────────────────────────

interface SolutionCardProps {
  solution: Solution;
  onEdit: () => void;
}

function SolutionCard({ solution, onEdit }: SolutionCardProps) {
  return (
    <div className="bg-[#E8FAE9] border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-[#70E38F] text-[#111827] rounded-full px-2 py-0.5">
          Solution
        </span>
        <button
          onClick={onEdit}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-2">
        {solution.description}
      </p>
      {solution.questions.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">
          {solution.questions.length} question
          {solution.questions.length !== 1 ? "s" : ""} answered
        </p>
      )}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function ActionNodeSheet({
  open,
  onOpenChange,
  nodeId,
  problem,
  onSaveProblem,
  solutions,
  onAddSolution,
  onUpdateSolution,
}: ActionNodeSheetProps) {
  // ── Problem editor state (single problem, inline) ──
  const [problemDraft, setProblemDraft] = useState("");
  const [problemType, setProblemType] = useState("");
  const [problemPainGain, setProblemPainGain] = useState<PainOrGain>("pain");
  const [activeQuestionIds, setActiveQuestionIds] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [questionSources, setQuestionSources] = useState<
    Record<string, string>
  >({});
  const [questionConfidence, setQuestionConfidence] = useState<
    Record<string, number>
  >({});

  // ── Solution editor state ──
  const [isAddingSolution, setIsAddingSolution] = useState(false);
  const [editingSolutionId, setEditingSolutionId] = useState<string | null>(
    null,
  );
  const [solutionDraft, setSolutionDraft] = useState("");
  const [activeSolutionQuestionIds, setActiveSolutionQuestionIds] = useState<
    string[]
  >([]);
  const [solutionQuestionAnswers, setSolutionQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditingSolution = isAddingSolution || editingSolutionId !== null;

  // Hydrate the problem editor whenever the sheet opens or the selected node
  // changes. Not keyed on `problem` so remote/round-trip updates don't clobber
  // in-progress edits — this editor is the writer.
  useEffect(() => {
    if (!open) return;
    setProblemDraft(problem?.description ?? "");
    setProblemType(problem?.type ?? "");
    setProblemPainGain(problem?.painOrGain ?? "pain");
    const ids = problem?.questions.map((q) => q.bankQuestionId) ?? [];
    setActiveQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    const sources: Record<string, string> = {};
    const conf: Record<string, number> = {};
    for (const q of problem?.questions ?? []) {
      answers[q.bankQuestionId] = q.answer;
      sources[q.bankQuestionId] = q.source ?? "";
      conf[q.bankQuestionId] = q.confidence ?? 0;
    }
    setQuestionAnswers(answers);
    setQuestionSources(sources);
    setQuestionConfidence(conf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId]);

  function resetSolutionEditor() {
    setIsAddingSolution(false);
    setEditingSolutionId(null);
    setSolutionDraft("");
    setActiveSolutionQuestionIds([]);
    setSolutionQuestionAnswers({});
  }

  useEffect(() => {
    if (!open) resetSolutionEditor();
  }, [open]);

  useEffect(() => {
    if (isEditingSolution) solutionTextareaRef.current?.focus();
  }, [isEditingSolution]);

  function handleEditSolution(solution: Solution) {
    setSolutionDraft(solution.description);
    setEditingSolutionId(solution.id);
    setIsAddingSolution(false);
    const ids = solution.questions.map((q) => q.bankQuestionId);
    setActiveSolutionQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    for (const q of solution.questions) answers[q.bankQuestionId] = q.answer;
    setSolutionQuestionAnswers(answers);
  }

  function handleAddBankQuestion(questionId: string) {
    if (activeQuestionIds.includes(questionId)) return;
    const bq = BANK_QUESTIONS.find((q) => q.id === questionId);
    const defaultAnswer: string | string[] =
      bq?.answerType === "multiple_choice" ? [] : "";
    setActiveQuestionIds((prev) => [...prev, questionId]);
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: defaultAnswer }));
    setQuestionSources((prev) => ({ ...prev, [questionId]: "" }));
    setQuestionConfidence((prev) => ({ ...prev, [questionId]: 0 }));
  }

  function handleAddSolutionBankQuestion(questionId: string) {
    if (activeSolutionQuestionIds.includes(questionId)) return;
    const bq = SOLUTION_BANK_QUESTIONS.find((q) => q.id === questionId);
    const defaultAnswer: string | string[] =
      bq?.answerType === "multiple_choice" ? [] : "";
    setActiveSolutionQuestionIds((prev) => [...prev, questionId]);
    setSolutionQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: defaultAnswer,
    }));
  }

  function collectProblemAnswers(): ProblemQuestionAnswer[] {
    return activeQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: questionAnswers[id] ?? "",
      source: questionSources[id] ?? "",
      confidence: questionConfidence[id] ?? 0,
    }));
  }

  function collectSolutionAnswers(): SolutionQuestionAnswer[] {
    return activeSolutionQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: solutionQuestionAnswers[id] ?? "",
    }));
  }

  function handleSaveProblem() {
    const trimmed = problemDraft.trim();
    if (!trimmed) return;
    onSaveProblem(
      trimmed,
      problemType,
      problemPainGain,
      collectProblemAnswers(),
    );
  }

  function handleSaveSolution() {
    const trimmed = solutionDraft.trim();
    if (!trimmed) return;
    const collectedAnswers = collectSolutionAnswers();
    if (editingSolutionId) {
      onUpdateSolution(editingSolutionId, trimmed, collectedAnswers);
    } else {
      onAddSolution(trimmed, collectedAnswers);
    }
    resetSolutionEditor();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[720px] sm:max-w-[720px] flex flex-col p-2 gap-0 [&>button:last-of-type]:hidden overflow-y-auto"
      >
        <Tabs defaultValue="problem" className="w-full">
          <TabsList className="w-80 bg-white border-1 rounded-lg">
            {TABS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="text-xs rounded-sm"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <Separator />

          {/* ── Problem tab ── */}
          <TabsContent value="problem" className="p-2">
            <div className="p-1">
              {/* What the problem? */}
              <div className="mb-5 bg-[#F3F3F6] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    What the problem?
                  </span>
                  <span className="text-xs font-semibold bg-[#F5E7D0] text-[#9C7B4D] rounded-full px-2.5 py-0.5">
                    Problem
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <textarea
                    className="flex-1 self-stretch bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#6A35FF] leading-snug"
                    rows={3}
                    placeholder="Describe your problem..."
                    value={problemDraft}
                    onChange={(e) => setProblemDraft(e.target.value)}
                  />
                  <div className="flex flex-col gap-3 w-[250px] shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Type of problem
                      </span>
                      <Select
                        value={problemType}
                        onValueChange={setProblemType}
                      >
                        <SelectTrigger className="h-9 text-sm w-[130px] bg-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {PROBLEM_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Is it pain or gain?
                      </span>
                      <Select
                        value={problemPainGain}
                        onValueChange={(v) =>
                          setProblemPainGain(v as PainOrGain)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm w-[130px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAIN_OR_GAIN_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Questions */}
              <div className="flex items-center gap-1.5 mb-3">
                <CircleHelpIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Market Questions
                </span>
              </div>

              {activeQuestionIds.map((qId) => {
                const bq = BANK_QUESTIONS.find((q) => q.id === qId);
                if (!bq) return null;
                return (
                  <ActiveQuestionItem
                    key={qId}
                    question={bq}
                    value={
                      questionAnswers[qId] ??
                      (bq.answerType === "multiple_choice" ? [] : "")
                    }
                    onChange={(val) =>
                      setQuestionAnswers((prev) => ({ ...prev, [qId]: val }))
                    }
                    source={questionSources[qId] ?? ""}
                    confidence={questionConfidence[qId] ?? 0}
                    onSourceChange={(val) =>
                      setQuestionSources((prev) => ({ ...prev, [qId]: val }))
                    }
                    onConfidenceChange={(val) =>
                      setQuestionConfidence((prev) => ({ ...prev, [qId]: val }))
                    }
                  />
                );
              })}

              <BankOfQuestions
                activeQuestionIds={activeQuestionIds}
                onAdd={handleAddBankQuestion}
                title="Bank of market questions"
              />

              <Button
                onClick={handleSaveProblem}
                className="mt-4 w-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-full"
              >
                ✓ Save problem
              </Button>
            </div>
          </TabsContent>

          {/* ── Solution tab (unchanged) ── */}
          <TabsContent value="solution" className="p-2">
            {!isEditingSolution && (
              <>
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
                  <SolutionCard
                    key={solution.id}
                    solution={solution}
                    onEdit={() => handleEditSolution(solution)}
                  />
                ))}
              </>
            )}

            {isEditingSolution && (
              <div className="bg-[#E8FAE9] rounded-xl p-4">
                {/* What the solution? */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-800">
                      What the solution?
                    </span>
                    <button
                      onClick={handleSaveSolution}
                      className="text-sm font-medium text-[#6A35FF] hover:text-purple-800 transition-colors"
                    >
                      ✓ Save
                    </button>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
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
                </div>

                {/* Active questions */}
                {activeSolutionQuestionIds.map((qId) => {
                  const bq = SOLUTION_BANK_QUESTIONS.find((q) => q.id === qId);
                  if (!bq) return null;
                  return (
                    <ActiveQuestionItem
                      key={qId}
                      question={bq}
                      value={
                        solutionQuestionAnswers[qId] ??
                        (bq.answerType === "multiple_choice" ? [] : "")
                      }
                      onChange={(val) =>
                        setSolutionQuestionAnswers((prev) => ({
                          ...prev,
                          [qId]: val,
                        }))
                      }
                    />
                  );
                })}

                <BankOfSolutions
                  activeQuestionIds={activeSolutionQuestionIds}
                  onAdd={handleAddSolutionBankQuestion}
                />

                <button
                  onClick={resetSolutionEditor}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, CircleHelpIcon, StarIcon, CheckIcon } from "lucide-react";
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

import {
  BANK_QUESTIONS,
  SOLUTION_BANK_QUESTIONS,
  type BankQuestion,
} from "../questionBank";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProblemQuestionAnswer {
  bankQuestionId: string;
  answer: string | string[];
  source: string;
  confidence: number;
  isHypothesis: boolean;
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
  source: string;
  confidence: number;
}

export type RelieverOrCreator = "reliever" | "creator";

export interface Solution {
  id: string;
  /** The problem this solution belongs to. Absent on legacy node-scoped solutions. */
  problemId?: string;
  description: string;
  type: string;
  relieverOrCreator: RelieverOrCreator;
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

// ─── Solution metadata options ────────────────────────────────────────────────

const SOLUTION_TYPES = ["Functional", "Emotional", "Social"] as const;

const RELIEVER_OR_CREATOR_OPTIONS: { value: RelieverOrCreator; label: string }[] =
  [
    { value: "reliever", label: "Reliever" },
    { value: "creator", label: "Creator" },
  ];

const SOURCE_OPTIONS = [
  "Shared personally",
  "Interview",
  "Observed",
  "Assumption",
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

interface ActionNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodeId: string | null;
  problemId: string | null;
  problem: Problem | null;
  onSaveProblem: (
    description: string,
    type: string,
    painOrGain: PainOrGain,
    questions: ProblemQuestionAnswer[],
  ) => void;
  solution: Solution | null;
  onSaveSolution: (
    description: string,
    type: string,
    relieverOrCreator: RelieverOrCreator,
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

  if (question.answerType === "yes_no") {
    const strValue = (value as string) ?? "";
    return (
      <div className="flex gap-2">
        {["Yes", "No"].map((opt) => {
          const selected = strValue === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected ? "" : opt)}
              className={`h-9 px-5 rounded-lg border text-sm font-medium transition-colors ${
                selected
                  ? "border-[#6A35FF] bg-[#F4F0FF] text-[#6A35FF]"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.answerType === "scale") {
    const numValue = value ? Number(value) : 0;
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = numValue === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(selected ? "" : String(n))}
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

// ─── Question row (question | [H] | Source | confidence) ──────────────────────

interface QuestionRowProps {
  index: number;
  question: BankQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  source: string;
  confidence: number;
  onSourceChange: (source: string) => void;
  onConfidenceChange: (confidence: number) => void;
  /** When provided, render the hypothesis toggle (problems only). */
  isHypothesis?: boolean;
  onToggleHypothesis?: (isHypothesis: boolean) => void;
}

function QuestionRow({
  index,
  question,
  value,
  onChange,
  source,
  confidence,
  onSourceChange,
  onConfidenceChange,
  isHypothesis,
  onToggleHypothesis,
}: QuestionRowProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-t border-gray-100 first:border-t-0">
      {/* Question + answer */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="text-sm font-semibold text-gray-800">
          <span className="text-[#6A35FF] mr-1.5">{index}.</span>
          {question.text}
        </p>
        <AnswerInput question={question} value={value} onChange={onChange} />
      </div>

      {/* Hypothesis toggle */}
      {onToggleHypothesis && (
        <button
          type="button"
          onClick={() => onToggleHypothesis(!isHypothesis)}
          aria-pressed={isHypothesis}
          title={isHypothesis ? "Marked as hypothesis" : "Mark as hypothesis"}
          className={`shrink-0 w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
            isHypothesis
              ? "border-[#6A35FF] text-[#6A35FF] bg-[#F4F0FF]"
              : "border-gray-300 text-gray-400 hover:border-[#6A35FF] hover:text-[#6A35FF]"
          }`}
        >
          H
        </button>
      )}

      {/* Source */}
      <div className="w-[180px] shrink-0 flex flex-col gap-1.5">
        <span className="text-xs text-gray-500 font-medium">Source:</span>
        <Select value={source ?? ""} onValueChange={onSourceChange}>
          <SelectTrigger className="h-9 text-sm bg-white">
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

      {/* Confidence */}
      <div className="w-[130px] shrink-0 flex flex-col gap-1.5">
        <span className="text-xs text-gray-500 font-medium">
          Your confidence:
        </span>
        <div className="h-9 flex items-center">
          <StarRating value={confidence ?? 0} onChange={onConfidenceChange} />
        </div>
      </div>
    </div>
  );
}

// ─── Bank of Questions ────────────────────────────────────────────────────────

interface BankOfQuestionsProps {
  questions: BankQuestion[];
  activeQuestionIds: string[];
  onAdd: (questionId: string) => void;
  title?: string;
}

function BankOfQuestions({
  questions: bankQuestions,
  activeQuestionIds,
  onAdd,
  title = "Bank of questions",
}: BankOfQuestionsProps) {
  const activeSet = new Set(activeQuestionIds);
  const categories = Array.from(new Set(bankQuestions.map((q) => q.category)));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-3">
        <CircleHelpIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>

      {categories.map((cat) => {
        const questions = bankQuestions.filter((q) => q.category === cat);
        return (
          <div key={cat} className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">{cat}</p>
            <div className="bg-[#F3F3F6] rounded-xl px-4">
              {questions.map((q, idx) => {
                const added = activeSet.has(q.id);
                return (
                  <div
                    key={q.id}
                    className={`flex items-center justify-between gap-3 py-3 ${
                      idx > 0 ? "border-t border-gray-200" : ""
                    }`}
                  >
                    <span className="text-sm text-gray-700 pr-2">{q.text}</span>
                    {added ? (
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6A35FF] flex items-center justify-center text-white">
                        <CheckIcon className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <button
                        onClick={() => onAdd(q.id)}
                        className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function ActionNodeSheet({
  open,
  onOpenChange,
  nodeId,
  problemId,
  problem,
  onSaveProblem,
  solution,
  onSaveSolution,
}: ActionNodeSheetProps) {
  const [activeTab, setActiveTab] = useState<"problem" | "solution">(
    "problem",
  );

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
  const [questionHypothesis, setQuestionHypothesis] = useState<
    Record<string, boolean>
  >({});

  // ── Solution editor state (single solution, inline) ──
  const [solutionDraft, setSolutionDraft] = useState("");
  const [solutionType, setSolutionType] = useState("");
  const [solutionRelieverCreator, setSolutionRelieverCreator] =
    useState<RelieverOrCreator>("reliever");
  const [activeSolutionQuestionIds, setActiveSolutionQuestionIds] = useState<
    string[]
  >([]);
  const [solutionQuestionAnswers, setSolutionQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [solutionQuestionSources, setSolutionQuestionSources] = useState<
    Record<string, string>
  >({});
  const [solutionQuestionConfidence, setSolutionQuestionConfidence] = useState<
    Record<string, number>
  >({});

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
    const hyp: Record<string, boolean> = {};
    for (const q of problem?.questions ?? []) {
      answers[q.bankQuestionId] = q.answer;
      sources[q.bankQuestionId] = q.source ?? "";
      conf[q.bankQuestionId] = q.confidence ?? 0;
      hyp[q.bankQuestionId] = q.isHypothesis ?? false;
    }
    setQuestionAnswers(answers);
    setQuestionSources(sources);
    setQuestionConfidence(conf);
    setQuestionHypothesis(hyp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, problemId]);

  // Hydrate the solution editor on the same terms as the problem editor above.
  useEffect(() => {
    if (!open) return;
    setSolutionDraft(solution?.description ?? "");
    setSolutionType(solution?.type ?? "");
    setSolutionRelieverCreator(solution?.relieverOrCreator ?? "reliever");
    const ids = solution?.questions.map((q) => q.bankQuestionId) ?? [];
    setActiveSolutionQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    const sources: Record<string, string> = {};
    const conf: Record<string, number> = {};
    for (const q of solution?.questions ?? []) {
      answers[q.bankQuestionId] = q.answer;
      sources[q.bankQuestionId] = q.source ?? "";
      conf[q.bankQuestionId] = q.confidence ?? 0;
    }
    setSolutionQuestionAnswers(answers);
    setSolutionQuestionSources(sources);
    setSolutionQuestionConfidence(conf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, problemId]);

  function handleAddBankQuestion(questionId: string) {
    if (activeQuestionIds.includes(questionId)) return;
    const bq = BANK_QUESTIONS.find((q) => q.id === questionId);
    const defaultAnswer: string | string[] =
      bq?.answerType === "multiple_choice" ? [] : "";
    setActiveQuestionIds((prev) => [...prev, questionId]);
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: defaultAnswer }));
    setQuestionSources((prev) => ({ ...prev, [questionId]: "" }));
    setQuestionConfidence((prev) => ({ ...prev, [questionId]: 0 }));
    setQuestionHypothesis((prev) => ({ ...prev, [questionId]: false }));
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
    setSolutionQuestionSources((prev) => ({ ...prev, [questionId]: "" }));
    setSolutionQuestionConfidence((prev) => ({ ...prev, [questionId]: 0 }));
  }

  function collectProblemAnswers(): ProblemQuestionAnswer[] {
    return activeQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: questionAnswers[id] ?? "",
      source: questionSources[id] ?? "",
      confidence: questionConfidence[id] ?? 0,
      isHypothesis: questionHypothesis[id] ?? false,
    }));
  }

  function collectSolutionAnswers(): SolutionQuestionAnswer[] {
    return activeSolutionQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: solutionQuestionAnswers[id] ?? "",
      source: solutionQuestionSources[id] ?? "",
      confidence: solutionQuestionConfidence[id] ?? 0,
    }));
  }

  function handleSaveProblem() {
    const trimmed = problemDraft.trim();
    if (!trimmed) {
      toast.error("Add a description before saving the problem.");
      return;
    }
    onSaveProblem(
      trimmed,
      problemType,
      problemPainGain,
      collectProblemAnswers(),
    );
    toast.success(problem?.description?.trim() ? "Problem updated" : "Problem saved");
  }

  function handleSaveSolution() {
    const trimmed = solutionDraft.trim();
    if (!trimmed) {
      toast.error("Add a description before saving the solution.");
      return;
    }
    onSaveSolution(
      trimmed,
      solutionType,
      solutionRelieverCreator,
      collectSolutionAnswers(),
    );
    toast.success(solution?.description?.trim() ? "Solution updated" : "Solution saved");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[820px] sm:max-w-[820px] flex flex-col p-2 gap-0 [&>button:last-of-type]:hidden"
      >
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "problem" | "solution")}
          className="w-full flex flex-col flex-1 min-h-0"
        >
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

          <div className="flex-1 min-h-0 overflow-y-auto">
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

              {activeQuestionIds.map((qId, i) => {
                const bq = BANK_QUESTIONS.find((q) => q.id === qId);
                if (!bq) return null;
                return (
                  <QuestionRow
                    key={qId}
                    index={i + 1}
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
                    isHypothesis={questionHypothesis[qId] ?? false}
                    onSourceChange={(val) =>
                      setQuestionSources((prev) => ({ ...prev, [qId]: val }))
                    }
                    onConfidenceChange={(val) =>
                      setQuestionConfidence((prev) => ({ ...prev, [qId]: val }))
                    }
                    onToggleHypothesis={(val) =>
                      setQuestionHypothesis((prev) => ({ ...prev, [qId]: val }))
                    }
                  />
                );
              })}

              <BankOfQuestions
                questions={BANK_QUESTIONS}
                activeQuestionIds={activeQuestionIds}
                onAdd={handleAddBankQuestion}
                title="Bank of market questions"
              />
            </div>
          </TabsContent>

          {/* ── Solution tab ── */}
          <TabsContent value="solution" className="p-2">
            <div className="p-1">
              {/* What the solution? */}
              <div className="mb-5 bg-[#F3F3F6] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-800">
                    What the solution?
                  </span>
                  <span className="text-xs font-semibold bg-[#70E38F] text-[#111827] rounded-full px-2.5 py-0.5">
                    Solution
                  </span>
                </div>
                <div className="flex gap-4 items-center">
                  <textarea
                    className="flex-1 self-stretch bg-white border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-[#6A35FF] leading-snug"
                    rows={3}
                    placeholder="Describe your solution..."
                    value={solutionDraft}
                    onChange={(e) => setSolutionDraft(e.target.value)}
                  />
                  <div className="flex flex-col gap-3 w-[250px] shrink-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Type of solution
                      </span>
                      <Select
                        value={solutionType}
                        onValueChange={setSolutionType}
                      >
                        <SelectTrigger className="h-9 text-sm w-[130px] bg-white">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          {SOLUTION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                        Is it reliever or creator?
                      </span>
                      <Select
                        value={solutionRelieverCreator}
                        onValueChange={(v) =>
                          setSolutionRelieverCreator(v as RelieverOrCreator)
                        }
                      >
                        <SelectTrigger className="h-9 text-sm w-[130px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RELIEVER_OR_CREATOR_OPTIONS.map((o) => (
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

              {activeSolutionQuestionIds.map((qId, i) => {
                const bq = SOLUTION_BANK_QUESTIONS.find((q) => q.id === qId);
                if (!bq) return null;
                return (
                  <QuestionRow
                    key={qId}
                    index={i + 1}
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
                    source={solutionQuestionSources[qId] ?? ""}
                    confidence={solutionQuestionConfidence[qId] ?? 0}
                    onSourceChange={(val) =>
                      setSolutionQuestionSources((prev) => ({
                        ...prev,
                        [qId]: val,
                      }))
                    }
                    onConfidenceChange={(val) =>
                      setSolutionQuestionConfidence((prev) => ({
                        ...prev,
                        [qId]: val,
                      }))
                    }
                  />
                );
              })}

              <BankOfQuestions
                questions={SOLUTION_BANK_QUESTIONS}
                activeQuestionIds={activeSolutionQuestionIds}
                onAdd={handleAddSolutionBankQuestion}
                title="Bank of market questions"
              />
            </div>
          </TabsContent>
          </div>

          <div className="shrink-0 border-t p-2">
            {activeTab === "problem" ? (
              <Button
                onClick={handleSaveProblem}
                className="w-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-full"
              >
                ✓ Save problem
              </Button>
            ) : (
              <Button
                onClick={handleSaveSolution}
                className="w-full text-sm font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-full"
              >
                ✓ Save solution
              </Button>
            )}
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

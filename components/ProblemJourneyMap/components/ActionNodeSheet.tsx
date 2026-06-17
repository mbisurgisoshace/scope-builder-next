"use client";

import { useEffect, useRef, useState } from "react";
import { PencilIcon, PlusIcon, CircleHelpIcon } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
}

export interface Problem {
  id: string;
  description: string;
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

// ─── Hardcoded responses data ─────────────────────────────────────────────────

const MOCK_QUESTION_RESPONSES = [
  {
    id: "rq-1",
    text: "When you read an article before taking a quiz, how do you usually read it?",
    responses: [
      {
        id: "rr-1",
        name: "Alice Doe",
        text: "From beginning to end carefully",
      },
      { id: "rr-2", name: "Linda Moore", text: "Lorem ipsum" },
      { id: "rr-3", name: "Kristian Brown", text: "Lorem ipsum" },
    ],
  },
  {
    id: "rq-2",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et?",
    responses: [
      {
        id: "rr-4",
        name: "Alice Doe",
        text: "From beginning to end carefully",
      },
      { id: "rr-5", name: "Linda Moore", text: "Lorem ipsum" },
      {
        id: "rr-6",
        name: "Kristian Brown",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et",
      },
    ],
  },
];

// ─── Props ───────────────────────────────────────────────────────────────────

interface ActionNodeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  problems: Problem[];
  onAddProblem: (
    description: string,
    questions: ProblemQuestionAnswer[],
  ) => void;
  onUpdateProblem: (
    problemId: string,
    description: string,
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
  conclusions: NodeConclusion[];
  onUpsertConclusion: (
    id: string,
    status: ConclusionStatus,
    content: string,
  ) => void;
}

// ─── Conclusions ─────────────────────────────────────────────────────────────

const HARDCODED_HYPOTHESES = [
  {
    id: "h-1",
    title: "Hypothesis #1",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "h-2",
    title: "Hypothesis #2",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
  {
    id: "h-3",
    title: "Hypothesis #3",
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  },
];

interface HypothesisCardProps {
  hypothesis: { id: string; title: string; text: string };
  saved: NodeConclusion | undefined;
  onSave: (status: ConclusionStatus, content: string) => void;
}

function HypothesisCard({ hypothesis, saved, onSave }: HypothesisCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localStatus, setLocalStatus] = useState<ConclusionStatus>(
    saved?.status ?? "testing",
  );
  const [localContent, setLocalContent] = useState(saved?.content ?? "");

  const viewStatus = isEditing ? null : (saved?.status ?? "testing");

  const cardBg =
    viewStatus === "validated"
      ? "bg-green-50"
      : viewStatus === "invalidated"
        ? "bg-red-50"
        : "bg-gray-50";

  function handleSave() {
    if (localStatus === "testing") return;
    onSave(localStatus, localContent);
    setIsEditing(false);
  }

  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-3 ${cardBg}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">
          {hypothesis.title}
        </span>
        {isEditing ? (
          <button
            onClick={handleSave}
            disabled={localStatus === "testing"}
            className="flex items-center gap-1 text-xs text-[#6A35FF] font-medium disabled:opacity-40"
          >
            <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l3 3 5-5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Save
          </button>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <PencilIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-sm font-semibold text-gray-900">{hypothesis.text}</p>

      {isEditing ? (
        <>
          <Separator />
          <div className="flex rounded-md border border-gray-200 overflow-hidden p-1">
            <button
              onClick={() => setLocalStatus("validated")}
              className={`flex flex-1 items-center justify-center rounded-[5px] gap-1.5 py-2 text-xs font-medium transition-colors ${
                localStatus === "validated"
                  ? "bg-[#E8FAE9] text-[#247C30]"
                  : "text-[#111827] hover:bg-gray-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M4.5 7l2 2 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Validated
            </button>

            <button
              onClick={() => setLocalStatus("invalidated")}
              className={`flex flex-1 items-center justify-center rounded-[5px] gap-1.5 py-2 text-xs font-medium transition-colors ${
                localStatus === "invalidated"
                  ? "bg-[#FFE9F2] text-[#D02D50]"
                  : "text-[#111827] hover:bg-gray-100"
              }`}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 5l4 4M9 5l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Not validated
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-gray-500 font-medium">
              What do you think about results?
            </span>
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="My conclusion..."
              rows={3}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-[#6A35FF] resize-none"
            />
          </div>
        </>
      ) : (
        <>
          {viewStatus === "validated" ? (
            <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M4.5 7l2 2 3-3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Validated
            </div>
          ) : viewStatus === "invalidated" ? (
            <div className="flex items-center gap-1.5 text-red-500 text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M5 5l4 4M9 5l-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Not validated
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400 text-sm font-medium">
              <svg className="w-4 h-4" viewBox="0 0 14 14" fill="none">
                <circle
                  cx="7"
                  cy="7"
                  r="6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 4v3.5l2 2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Testing
            </div>
          )}
          {saved?.content && (
            <p className="text-sm text-gray-600">{saved.content}</p>
          )}
        </>
      )}
    </div>
  );
}

const TABS = [
  { value: "problem", label: "Problem" },
  { value: "solution", label: "Solution" },
  { value: "assumptions", label: "Assumptions & Hypothesis" },
  { value: "responses", label: "Responses" },
  { value: "conclusions", label: "Conclusions" },
] as const;

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
}

function ActiveQuestionItem({
  question,
  value,
  onChange,
}: ActiveQuestionItemProps) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-gray-800 mb-1.5">
        {question.text}
      </p>
      <AnswerInput question={question} value={value} onChange={onChange} />
    </div>
  );
}

// ─── Responses tab ───────────────────────────────────────────────────────────

function ResponsesTabContent() {
  return (
    <div className="overflow-y-auto space-y-8 h-full">
      {MOCK_QUESTION_RESPONSES.map((question) => (
        <div key={question.id} className="space-y-3">
          <p className="text-sm font-bold text-gray-900">{question.text}</p>
          <div className="space-y-2">
            {question.responses.map((response) => (
              <div
                key={response.id}
                className="flex items-center justify-between gap-4 rounded-xl bg-gray-100 px-4 py-3"
              >
                <span className="text-sm text-gray-700 line-clamp-2 flex-1">
                  {response.text}
                </span>
                <div className="flex items-center gap-2 shrink-0 text-sm text-gray-500">
                  <span>{response.name}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-400"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bank of Questions ────────────────────────────────────────────────────────

interface BankOfQuestionsProps {
  activeQuestionIds: string[];
  onAdd: (questionId: string) => void;
}

function BankOfQuestions({ activeQuestionIds, onAdd }: BankOfQuestionsProps) {
  const activeSet = new Set(activeQuestionIds);

  const visibleCategories = BANK_CATEGORIES.filter((cat) =>
    BANK_QUESTIONS.some((q) => q.category === cat && !activeSet.has(q.id)),
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

// ─── Problem card ─────────────────────────────────────────────────────────────

interface ProblemCardProps {
  problem: Problem;
  onEdit: () => void;
}

function ProblemCard({ problem, onEdit }: ProblemCardProps) {
  return (
    <div className="bg-[#F3F3F6] border border-gray-100 rounded-xl p-4 mb-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold bg-[#D02D50] text-white rounded-full px-2 py-0.5">
          Problem
        </span>
        <button
          onClick={onEdit}
          className="text-gray-300 hover:text-gray-500 transition-colors"
        >
          <PencilIcon className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-sm font-semibold text-gray-800 mt-2">
        {problem.description}
      </p>
      {problem.questions.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">
          {problem.questions.length} question
          {problem.questions.length !== 1 ? "s" : ""} answered
        </p>
      )}
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
  problems,
  onAddProblem,
  onUpdateProblem,
  solutions,
  onAddSolution,
  onUpdateSolution,
  conclusions,
  onUpsertConclusion,
}: ActionNodeSheetProps) {
  // ── Problem editor state ──
  const [isAddingProblem, setIsAddingProblem] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemDraft, setProblemDraft] = useState("");
  const [activeQuestionIds, setActiveQuestionIds] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const problemTextareaRef = useRef<HTMLTextAreaElement>(null);

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

  const isEditingProblem = isAddingProblem || editingProblemId !== null;
  const isEditingSolution = isAddingSolution || editingSolutionId !== null;

  function resetProblemEditor() {
    setIsAddingProblem(false);
    setEditingProblemId(null);
    setProblemDraft("");
    setActiveQuestionIds([]);
    setQuestionAnswers({});
  }

  function resetSolutionEditor() {
    setIsAddingSolution(false);
    setEditingSolutionId(null);
    setSolutionDraft("");
    setActiveSolutionQuestionIds([]);
    setSolutionQuestionAnswers({});
  }

  useEffect(() => {
    if (!open) {
      resetProblemEditor();
      resetSolutionEditor();
    }
  }, [open]);

  useEffect(() => {
    if (isEditingProblem) problemTextareaRef.current?.focus();
  }, [isEditingProblem]);

  useEffect(() => {
    if (isEditingSolution) solutionTextareaRef.current?.focus();
  }, [isEditingSolution]);

  function handleEditProblem(problem: Problem) {
    setProblemDraft(problem.description);
    setEditingProblemId(problem.id);
    setIsAddingProblem(false);
    const ids = problem.questions.map((q) => q.bankQuestionId);
    setActiveQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    for (const q of problem.questions) answers[q.bankQuestionId] = q.answer;
    setQuestionAnswers(answers);
  }

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

  function collectAnswers(): ProblemQuestionAnswer[] {
    return activeQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: questionAnswers[id] ?? "",
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
    const collectedAnswers = collectAnswers();
    if (editingProblemId) {
      onUpdateProblem(editingProblemId, trimmed, collectedAnswers);
    } else {
      onAddProblem(trimmed, collectedAnswers);
    }
    resetProblemEditor();
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
        className="w-[540px] sm:max-w-[540px] flex flex-col p-2 gap-0 [&>button:last-of-type]:hidden overflow-y-auto"
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

          <TabsContent value="problem" className="p-2">
            {!isEditingProblem && (
              <>
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
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    onEdit={() => handleEditProblem(problem)}
                  />
                ))}
              </>
            )}

            {isEditingProblem && (
              <div className="bg-[#F3F3F6] rounded-xl p-4">
                {/* What the problem? */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
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
                  <div className="bg-white rounded-xl border border-gray-200 p-3">
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
                </div>

                {/* Active questions */}
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
                    />
                  );
                })}

                <BankOfQuestions
                  activeQuestionIds={activeQuestionIds}
                  onAdd={handleAddBankQuestion}
                />

                <button
                  onClick={resetProblemEditor}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </TabsContent>

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

          <TabsContent value="assumptions" className="mt-0 p-5 flex-1" />
          <TabsContent
            value="responses"
            className="mt-0 p-5 flex-1 overflow-hidden flex flex-col"
          >
            <ResponsesTabContent />
          </TabsContent>
          <TabsContent
            value="conclusions"
            className="mt-0 p-5 flex-1 overflow-y-auto flex flex-col gap-4"
          >
            <p className="text-sm font-semibold text-gray-700">
              My conclusions
            </p>
            {HARDCODED_HYPOTHESES.map((h) => (
              <HypothesisCard
                key={h.id}
                hypothesis={h}
                saved={conclusions.find((c) => c.id === h.id)}
                onSave={(status, content) =>
                  onUpsertConclusion(h.id, status, content)
                }
              />
            ))}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { BANK_QUESTIONS } from "@/components/ProblemJourneyMap/questionBank";
import type {
  DropdownOption,
  Hypothesis,
  ProblemBlock,
  ResponseType,
} from "@/components/ProblemJourneyMap/components/InterviewPrep/types";
import type {
  AnswerableProblem,
  AnswerableQuestion,
} from "@/app/(auth)/participants/interviews/_components/InterviewAnswers/types";

// Re-exported as type aliases (not an `export type {}` list) — a "use server"
// file only allows async-function value exports, and Next's checker doesn't
// erase re-export lists before enforcing that. Alias declarations are erased.
export type InterviewPrepBlock = ProblemBlock;
export type InterviewAnswersProblem = AnswerableProblem;
export type InterviewAnswersQuestion = AnswerableQuestion;

export type InterviewQuestionInput = {
  nodeId: string;
  problemId: string;
  bankQuestionId: string;
  title?: string;
  responseType?: ResponseType;
  options?: DropdownOption[];
};

export type InterviewAnswerInput = {
  questionId: string;
  participantId: string;
  value: string;
};

async function requireOrg() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  return orgId;
}

// Storage is declared as LiveList<LiveObject<any>> in liveblocks.config.ts, so the
// JourneyNodeStorage shape is advisory only. Everything below is read defensively.
type StoredQuestion = {
  bankQuestionId?: string;
  answer?: string | string[];
  source?: string;
  confidence?: number;
  isHypothesis?: boolean;
};

type StoredProblem = {
  id?: string;
  description?: string;
  type?: string;
  painOrGain?: "pain" | "gain";
  questions?: StoredQuestion[];
};

type StoredNode = {
  id?: string;
  type?: string;
  problems?: StoredProblem[];
};

type StoredEdge = { source?: string; target?: string };

/**
 * Action nodes in the order they appear along the journey: walk the edges out from the
 * trigger, then append anything the walk never reached so a disconnected node is still
 * shown rather than silently dropped.
 */
function orderActionNodes(nodes: StoredNode[], edges: StoredEdge[]): StoredNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n] as const));
  const children = new Map<string, string[]>();

  for (const edge of edges) {
    if (!edge.source || !edge.target) continue;
    const list = children.get(edge.source) ?? [];
    list.push(edge.target);
    children.set(edge.source, list);
  }

  const ordered: StoredNode[] = [];
  const seen = new Set<string>();

  const visit = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    const node = byId.get(id);
    if (node) ordered.push(node);
    for (const child of children.get(id) ?? []) visit(child);
  };

  for (const node of nodes) {
    if (node.type === "trigger" && node.id) visit(node.id);
  }
  for (const node of nodes) {
    if (node.id) visit(node.id);
  }

  return ordered.filter((n) => n.type === "action");
}

function toDropdownOptions(raw: unknown): DropdownOption[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((opt) => {
    if (!opt || typeof opt !== "object") return [];
    const { id, label } = opt as { id?: unknown; label?: unknown };
    if (typeof id !== "string") return [];
    return [{ id, label: typeof label === "string" ? label : "" }];
  });
}

// Carries the ProblemInterviewQuestion row id, which ProblemBlock drops — the answer
// rows are keyed by it, so the answering flow can't do without it.
type LoadedHypothesis = Hypothesis & { questionId: string | null };
type LoadedBlock = Omit<ProblemBlock, "hypotheses"> & {
  hypotheses: LoadedHypothesis[];
};

/**
 * Not exported, and it must stay that way: every exported async function in a
 * "use server" file is a public endpoint, so an exported helper taking `orgId` would
 * let any client read another org's journey map. Callers pass an orgId they got from
 * `requireOrg()` themselves.
 */
async function loadProblemBlocks(orgId: string): Promise<LoadedBlock[]> {
  const roomId = `problem-journey-${orgId}`;

  const [rawStorage, saved] = await Promise.all([
    // The "json" overload returns plain objects; the default one returns nested
    // { liveblocksType, data } wrappers that would need unwrapping at every level.
    liveblocks.getStorageDocument(roomId, "json"),
    prisma.problemInterviewQuestion.findMany({ where: { org_id: orgId } }),
  ]);

  // Storage is declared as LiveList<LiveObject<any>>, so this arrives as readonly any[].
  const storage = rawStorage as unknown as {
    journeyNodes?: StoredNode[];
    journeyEdges?: StoredEdge[];
  };

  const savedByKey = new Map(
    saved.map((row) => [
      `${row.node_id}:${row.problem_id}:${row.bank_question_id}`,
      row,
    ]),
  );

  const actionNodes = orderActionNodes(
    storage.journeyNodes ?? [],
    storage.journeyEdges ?? [],
  );

  const blocks: LoadedBlock[] = [];

  for (const node of actionNodes) {
    // A node holds at most one problem, and an empty description means the user never
    // defined one — the same guard the canvas node itself uses.
    const problem = node.problems?.[0];
    if (!node.id || !problem?.id || !problem.description?.trim()) continue;

    const hypotheses = (problem.questions ?? [])
      .filter((q) => q.isHypothesis && q.bankQuestionId)
      .flatMap((q) => {
        const bankQuestion = BANK_QUESTIONS.find((b) => b.id === q.bankQuestionId);
        if (!bankQuestion) return [];

        const bankQuestionId = q.bankQuestionId!;
        const row = savedByKey.get(`${node.id}:${problem.id}:${bankQuestionId}`);

        return [
          {
            id: `${problem.id}:${bankQuestionId}`,
            bankQuestionId,
            questionId: row?.id ?? null,
            prompt: bankQuestion.text,
            answer: Array.isArray(q.answer) ? q.answer.join(", ") : (q.answer ?? ""),
            source: q.source ?? "",
            confidence: q.confidence ?? 0,
            question: {
              title: row?.title ?? "",
              responseType: (row?.response_type ?? "text") as ResponseType,
              options: toDropdownOptions(row?.options),
            },
          },
        ];
      })
      // Numbered last so a question dropped by the bank lookup can't leave a gap.
      .map((h, i) => ({ ...h, index: i + 1 }));

    if (hypotheses.length === 0) continue;

    blocks.push({
      id: problem.id,
      nodeId: node.id,
      label: "Problem",
      description: problem.description,
      tags: [
        problem.type ?? "",
        problem.painOrGain === "gain" ? "Gain" : "Pain",
      ].filter(Boolean),
      hypotheses,
    });
  }

  return blocks;
}

export async function getInterviewPrepData(): Promise<ProblemBlock[]> {
  return loadProblemBlocks(await requireOrg());
}

/**
 * The problems an interviewer works through for one participant: only questions that
 * were actually authored on the Interview Prep tab, paired with this participant's
 * answers so far.
 */
export async function getInterviewAnswersData(
  participantId: string,
): Promise<AnswerableProblem[]> {
  const orgId = await requireOrg();

  // participantId comes from the client, so it can't be trusted to be ours.
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
    select: { id: true },
  });
  if (!participant) return [];

  const blocks = await loadProblemBlocks(orgId);

  const answerable = blocks.flatMap((block) => {
    const authored = block.hypotheses.filter(
      (h) => h.questionId !== null && h.question.title.trim() !== "",
    );
    return authored.length > 0 ? [{ block, authored }] : [];
  });

  const questionIds = answerable.flatMap(({ authored }) =>
    authored.map((h) => h.questionId!),
  );

  const answers = questionIds.length
    ? await prisma.problemInterviewAnswer.findMany({
        where: { participant_id: participantId, question_id: { in: questionIds } },
      })
    : [];

  const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a.value]));

  return answerable.map(({ block, authored }) => ({
    id: block.id,
    label: block.label,
    description: block.description,
    tags: block.tags,
    // Numbered after filtering, so dropping an unauthored question can't leave the
    // list reading "1. 3. 4." — same reasoning as the prep numbering above.
    questions: authored.map((h, i) => ({
      questionId: h.questionId!,
      index: i + 1,
      title: h.question.title,
      responseType: h.question.responseType,
      options: h.question.options,
      answer: answerByQuestionId.get(h.questionId!) ?? "",
    })),
  }));
}

export async function upsertProblemInterviewAnswer(
  input: InterviewAnswerInput,
): Promise<void> {
  const orgId = await requireOrg();

  const { questionId, participantId, value } = input;

  // Both ids arrive from the client; without these checks either one could address
  // another org's rows.
  const [question, participant] = await Promise.all([
    prisma.problemInterviewQuestion.findFirst({
      where: { id: questionId, org_id: orgId },
      select: { id: true },
    }),
    prisma.participant.findFirst({
      where: { id: participantId, org_id: orgId },
      select: { id: true },
    }),
  ]);
  if (!question || !participant) return;

  await prisma.problemInterviewAnswer.upsert({
    where: {
      question_id_participant_id: {
        question_id: questionId,
        participant_id: participantId,
      },
    },
    create: {
      org_id: orgId,
      question_id: questionId,
      participant_id: participantId,
      value,
    },
    update: { value },
  });

  // No revalidatePath: this fires on every blur, and revalidating would thrash the
  // tree while the interviewer is still typing.
}

export async function upsertProblemInterviewQuestion(
  input: InterviewQuestionInput,
) {
  const orgId = await requireOrg();

  const { nodeId, problemId, bankQuestionId, title, responseType, options } = input;

  // DropdownOption is a closed shape, so it needs a widening cast to satisfy Prisma's
  // index-signature-based Json input type.
  const jsonOptions = options as Prisma.InputJsonValue[] | undefined;

  await prisma.problemInterviewQuestion.upsert({
    where: {
      org_id_node_id_problem_id_bank_question_id: {
        org_id: orgId,
        node_id: nodeId,
        problem_id: problemId,
        bank_question_id: bankQuestionId,
      },
    },
    create: {
      org_id: orgId,
      node_id: nodeId,
      problem_id: problemId,
      bank_question_id: bankQuestionId,
      title: title ?? "",
      response_type: responseType ?? "text",
      options: jsonOptions ?? [],
    },
    update: {
      ...(title !== undefined ? { title } : {}),
      ...(responseType !== undefined ? { response_type: responseType } : {}),
      ...(jsonOptions !== undefined ? { options: jsonOptions } : {}),
    },
  });
}

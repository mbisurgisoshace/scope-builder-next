"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { exampleRoomId } from "@/lib/examples";
import { BANK_QUESTIONS } from "@/components/ProblemJourneyMap/questionBank";
import type {
  DropdownOption,
  InterviewQuestion,
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
export type InterviewPrepQuestion = InterviewQuestion;
export type InterviewAnswersProblem = AnswerableProblem;
export type InterviewAnswersQuestion = AnswerableQuestion;

export type InterviewQuestionCreateInput = {
  nodeId: string;
  problemId: string;
  bankQuestionId: string;
  title?: string;
  responseType?: ResponseType;
  options?: DropdownOption[];
};

export type InterviewQuestionUpdateInput = {
  id: string;
  title?: string;
  responseType?: ResponseType;
  options?: DropdownOption[];
};

export type InterviewHypothesisOrderInput = {
  nodeId: string;
  problemId: string;
  /** The problem's hypotheses, in their new order. */
  bankQuestionIds: string[];
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
  /** The action text the user typed on the card. */
  content?: string;
  problems?: StoredProblem[];
  /** Logical delete marker written by the canvas. Set = the node is gone as far
   * as every reader is concerned, even though its data is still in storage. */
  deletedAt?: string | null;
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

/** Scopes every DB read below. Both tables carry `org_id` and `example_number`. */
type LoadScope = { org_id: string } | { example_number: number };

/**
 * Not exported, and it must stay that way: every exported async function in a
 * "use server" file is a public endpoint, so an exported helper taking a room id +
 * `where` would let any client read another org's journey map. Callers first
 * resolve the room id / filter from their own `requireOrg()` (real data) or from a
 * fixed `example_number` (global example data).
 */
async function loadProblemBlocksFrom(
  roomId: string,
  scope: LoadScope,
): Promise<ProblemBlock[]> {
  const [rawStorage, saved, hypothesisOrder] = await Promise.all([
    // The "json" overload returns plain objects; the default one returns nested
    // { liveblocksType, data } wrappers that would need unwrapping at every level.
    liveblocks.getStorageDocument(roomId, "json"),
    prisma.problemInterviewQuestion.findMany({
      where: scope,
      // Ordered here so each hypothesis's bucket below comes out in authoring order.
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    }),
    prisma.problemHypothesisOrder.findMany({ where: scope }),
  ]);

  // Storage is declared as LiveList<LiveObject<any>>, so this arrives as readonly any[].
  const storage = rawStorage as unknown as {
    journeyNodes?: StoredNode[];
    journeyEdges?: StoredEdge[];
  };

  // One hypothesis can hold several questions, so this groups rather than indexes.
  // `saved` already arrives ordered, so each bucket keeps that order.
  const savedByKey = new Map<string, typeof saved>();
  for (const row of saved) {
    const key = `${row.node_id}:${row.problem_id}:${row.bank_question_id}`;
    const bucket = savedByKey.get(key);
    if (bucket) bucket.push(row);
    else savedByKey.set(key, [row]);
  }

  const orderByKey = new Map(
    hypothesisOrder.map((row) => [
      `${row.node_id}:${row.problem_id}:${row.bank_question_id}`,
      row.sort_order,
    ]),
  );

  // Logically deleted cards drop out here, which covers prep and both answering
  // flows at once. Their `problem_interview_questions` rows are left in place —
  // nothing is physically removed — they simply stop being surfaced.
  const actionNodes = orderActionNodes(
    (storage.journeyNodes ?? []).filter((n) => !n.deletedAt),
    storage.journeyEdges ?? [],
  );

  const blocks: ProblemBlock[] = [];

  for (const node of actionNodes) {
    if (!node.id) continue;

    // A node can hold several problems; each becomes its own block. An empty
    // description means the user never defined one — the same guard the canvas uses.
    for (const problem of node.problems ?? []) {
      if (!problem?.id || !problem.description?.trim()) continue;

      const hypotheses = (problem.questions ?? [])
        .filter((q) => q.isHypothesis && q.bankQuestionId)
        .flatMap((q) => {
          const bankQuestion = BANK_QUESTIONS.find((b) => b.id === q.bankQuestionId);
          if (!bankQuestion) return [];

          const bankQuestionId = q.bankQuestionId!;
          const rows = savedByKey.get(`${node.id}:${problem.id}:${bankQuestionId}`) ?? [];

          return [
            {
              id: `${problem.id}:${bankQuestionId}`,
              bankQuestionId,
              prompt: bankQuestion.text,
              answer: Array.isArray(q.answer) ? q.answer.join(", ") : (q.answer ?? ""),
              source: q.source ?? "",
              confidence: q.confidence ?? 0,
              questions: rows.map((row) => ({
                id: row.id,
                title: row.title,
                responseType: row.response_type as ResponseType,
                options: toDropdownOptions(row.options),
              })),
            },
          ];
        })
        // The prep tab's own ordering, which the canvas knows nothing about. Sort is
        // stable, so a hypothesis with no stored order — added on the canvas since the
        // last reorder — keeps its storage-array position and falls to the end.
        .sort(
          (a, b) =>
            (orderByKey.get(`${node.id}:${problem.id}:${a.bankQuestionId}`) ??
              Number.MAX_SAFE_INTEGER) -
            (orderByKey.get(`${node.id}:${problem.id}:${b.bankQuestionId}`) ??
              Number.MAX_SAFE_INTEGER),
        )
        // Numbered last so it reflects the final order, and so a question dropped by
        // the bank lookup can't leave a gap.
        .map((h, i) => ({ ...h, index: i + 1 }));

      if (hypotheses.length === 0) continue;

      blocks.push({
        id: problem.id,
        nodeId: node.id,
        action: node.content ?? "",
        label: "Problem",
        description: problem.description,
        tags: [
          problem.type ?? "",
          problem.painOrGain === "gain" ? "Gain" : "Pain",
        ].filter(Boolean),
        hypotheses,
      });
    }
  }

  return blocks;
}

export async function getInterviewPrepData(): Promise<ProblemBlock[]> {
  const orgId = await requireOrg();
  return loadProblemBlocksFrom(`problem-journey-${orgId}`, { org_id: orgId });
}

// Global read-only variant for the /examples/user-journey page: reads the
// example journey-map room and example-scoped questions. No org guard — example
// data is shared across every org.
export async function getExampleInterviewPrepData(
  exampleNumber: number,
): Promise<ProblemBlock[]> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return loadProblemBlocksFrom(exampleRoomId(exampleNumber), {
    example_number: exampleNumber,
  });
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

  const blocks = await loadProblemBlocksFrom(`problem-journey-${orgId}`, {
    org_id: orgId,
  });

  return buildAnswerableProblems(blocks, participantId);
}

// Global read-only variant for the /examples/interviews page: participant and
// blocks are example-scoped rather than org-scoped.
export async function getExampleInterviewAnswersData(
  exampleNumber: number,
  participantId: string,
): Promise<AnswerableProblem[]> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, example_number: exampleNumber },
    select: { id: true },
  });
  if (!participant) return [];

  const blocks = await loadProblemBlocksFrom(exampleRoomId(exampleNumber), {
    example_number: exampleNumber,
  });

  return buildAnswerableProblems(blocks, participantId);
}

/**
 * Pair the authored questions of each block with one participant's answers so far.
 * Shared by the real and example answering flows; the caller has already scoped the
 * blocks + participant, and the answers are looked up by the (already-scoped)
 * question ids, so this is filter-agnostic.
 */
async function buildAnswerableProblems(
  blocks: ProblemBlock[],
  participantId: string,
): Promise<AnswerableProblem[]> {
  const answerable = blocks.flatMap((block) => {
    // Flattened across hypotheses: a hypothesis can hold several questions, and the
    // interviewer works through one flat list per problem.
    const authored = block.hypotheses.flatMap((h) =>
      h.questions.filter((q) => q.title.trim() !== ""),
    );
    return authored.length > 0 ? [{ block, authored }] : [];
  });

  const questionIds = answerable.flatMap(({ authored }) =>
    authored.map((q) => q.id),
  );

  const answers = questionIds.length
    ? await prisma.problemInterviewAnswer.findMany({
        where: { participant_id: participantId, question_id: { in: questionIds } },
      })
    : [];

  const answerByQuestionId = new Map(answers.map((a) => [a.question_id, a.value]));

  return answerable.map(({ block, authored }) => ({
    id: block.id,
    action: block.action,
    label: block.label,
    description: block.description,
    tags: block.tags,
    // Numbered after filtering, so dropping an unauthored question can't leave the
    // list reading "1. 3. 4." — same reasoning as the prep numbering above.
    questions: authored.map((q, i) => ({
      questionId: q.id,
      index: i + 1,
      title: q.title,
      responseType: q.responseType,
      options: q.options,
      answer: answerByQuestionId.get(q.id) ?? "",
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

/**
 * Append a question to one hypothesis. Returns the created row in its client shape so
 * the caller picks up the new id without refetching the whole tab.
 */
export async function createProblemInterviewQuestion(
  input: InterviewQuestionCreateInput,
): Promise<InterviewQuestion> {
  const orgId = await requireOrg();

  const { nodeId, problemId, bankQuestionId, title, responseType, options } = input;

  // DropdownOption is a closed shape, so it needs a widening cast to satisfy Prisma's
  // index-signature-based Json input type.
  const jsonOptions = options as Prisma.InputJsonValue[] | undefined;

  // Appended after whatever this hypothesis already holds.
  const { _max } = await prisma.problemInterviewQuestion.aggregate({
    where: {
      org_id: orgId,
      node_id: nodeId,
      problem_id: problemId,
      bank_question_id: bankQuestionId,
    },
    _max: { sort_order: true },
  });

  const created = await prisma.problemInterviewQuestion.create({
    data: {
      org_id: orgId,
      node_id: nodeId,
      problem_id: problemId,
      bank_question_id: bankQuestionId,
      title: title ?? "",
      response_type: responseType ?? "text",
      options: jsonOptions ?? [],
      sort_order: (_max.sort_order ?? -1) + 1,
    },
  });

  return {
    id: created.id,
    title: created.title,
    responseType: created.response_type as ResponseType,
    options: toDropdownOptions(created.options),
  };
}

export async function updateProblemInterviewQuestion(
  input: InterviewQuestionUpdateInput,
): Promise<void> {
  const orgId = await requireOrg();

  const { id, title, responseType, options } = input;
  const jsonOptions = options as Prisma.InputJsonValue[] | undefined;

  // The id comes from the client, so `org_id` has to be part of the match or it would
  // address another org's row. updateMany makes a non-matching id a no-op, not a throw.
  await prisma.problemInterviewQuestion.updateMany({
    where: { id, org_id: orgId },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(responseType !== undefined ? { response_type: responseType } : {}),
      ...(jsonOptions !== undefined ? { options: jsonOptions } : {}),
    },
  });
}

/** Deleting a question cascades to every participant's answer to it. */
export async function deleteProblemInterviewQuestion(id: string): Promise<void> {
  const orgId = await requireOrg();

  await prisma.problemInterviewQuestion.deleteMany({ where: { id, org_id: orgId } });
}

/**
 * Reorder the questions of one hypothesis. `ids` is the full list in its new order;
 * `org_id` is matched alongside each id because both arrive from the client.
 */
export async function reorderProblemInterviewQuestions(
  ids: string[],
): Promise<void> {
  const orgId = await requireOrg();

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.problemInterviewQuestion.updateMany({
        where: { id, org_id: orgId },
        data: { sort_order: index },
      }),
    ),
  );
}

/**
 * Reorder one problem's hypotheses. `bankQuestionIds` is the problem's full list in its
 * new order — the whole problem is rewritten in one shot rather than patched, so the
 * table can never drift into a half-ordered state and a repeated call is a no-op.
 */
export async function reorderProblemHypotheses(
  input: InterviewHypothesisOrderInput,
): Promise<void> {
  const orgId = await requireOrg();

  const { nodeId, problemId, bankQuestionIds } = input;

  await prisma.$transaction([
    prisma.problemHypothesisOrder.deleteMany({
      where: { org_id: orgId, node_id: nodeId, problem_id: problemId },
    }),
    prisma.problemHypothesisOrder.createMany({
      data: bankQuestionIds.map((bankQuestionId, index) => ({
        org_id: orgId,
        node_id: nodeId,
        problem_id: problemId,
        bank_question_id: bankQuestionId,
        sort_order: index,
      })),
    }),
  ]);
}

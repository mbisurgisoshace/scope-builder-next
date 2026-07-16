"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import { BANK_QUESTIONS } from "@/components/ProblemJourneyMap/questionBank";
import type {
  DropdownOption,
  ProblemBlock,
  ResponseType,
} from "@/components/ProblemJourneyMap/components/InterviewPrep/types";

// Re-exported as type aliases (not an `export type {}` list) — a "use server"
// file only allows async-function value exports, and Next's checker doesn't
// erase re-export lists before enforcing that. Alias declarations are erased.
export type InterviewPrepBlock = ProblemBlock;

export type InterviewQuestionInput = {
  nodeId: string;
  problemId: string;
  bankQuestionId: string;
  title?: string;
  responseType?: ResponseType;
  options?: DropdownOption[];
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

export async function getInterviewPrepData(): Promise<ProblemBlock[]> {
  const orgId = await requireOrg();
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

  const blocks: ProblemBlock[] = [];

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

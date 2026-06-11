import type { NodeTypes } from '@xyflow/react';
import { QuestionNode } from './QuestionNode';
import { QuestionAnswerNode } from './QuestionAnswerNode';

// Defined outside any component to maintain stable references (avoids RF re-mounting all nodes on render)
export const nodeTypes: NodeTypes = {
  question: QuestionNode,
  question_answer: QuestionAnswerNode,
};

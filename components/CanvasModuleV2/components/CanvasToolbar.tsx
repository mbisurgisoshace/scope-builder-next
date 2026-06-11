'use client';

import { MessageSquareIcon, MessageSquareTextIcon } from 'lucide-react';
import type { ShapeType } from '@/components/CanvasModule/types';

interface ToolbarOptions {
  card?: boolean;
  text?: boolean;
  table?: boolean;
  answer?: boolean;
  ellipse?: boolean;
  feature?: boolean;
  question?: boolean;
  rectangle?: boolean;
  interview?: boolean;
}

interface CanvasToolbarProps {
  toolbarOptions?: ToolbarOptions;
  onAddShape: (type: ShapeType) => void;
}

export function CanvasToolbar({ toolbarOptions, onAddShape }: CanvasToolbarProps) {
  return (
    <div className="p-2 bg-white rounded-2xl shadow flex flex-col gap-3 items-center">
      {toolbarOptions?.question && (
        <button
          title="Add Question"
          onClick={() => onAddShape('question')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <MessageSquareIcon className="w-5 h-5" />
        </button>
      )}
      {toolbarOptions?.answer && (
        <button
          title="Add Q&A"
          onClick={() => onAddShape('question_answer')}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <MessageSquareTextIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

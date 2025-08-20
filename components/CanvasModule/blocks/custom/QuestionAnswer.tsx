"use client";
import dynamic from "next/dynamic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  UserIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type QuestionAnswerProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const QuestionAnswer: React.FC<QuestionAnswerProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const commit = (patch: Partial<IShape>) => {
    onCommitInterview?.(shape.id, patch);
  };

  // --- DraftJS editor state ---
  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [editingBody, setEditingBody] = useState(true);

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        setEditorState(EditorState.createWithContent(convertFromRaw(raw)));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } catch {
      // ignore bad JSON
    }
  }, [shape.draftRaw, editingBody]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      commit({ draftRaw: JSON.stringify(raw) });
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, editingBody]);

  const startBodyEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBody(true);
  };
  const stopBodyEdit = () => setEditingBody(false);

  // Plain-text preview when not editing
  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    const text = content.hasText() ? content.getPlainText("\n") : "";
    return text.length ? text : "Write interview notes here…";
  }, [editorState]);

  return (
    <ShapeFrame
      {...props}
      resizable={true}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="h-full flex flex-row rounded-xl shadow border-1 border-[#E9E6F0] bg-white">
        <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4 border-r ">
          <h3 className="text-[11px] font-medium text-[#8B93A1]">Question</h3>
          <h2 className="font-extrabold text-[14px] text-[#111827]">
            <span className="text-[#8B93A1] mr-1">1.</span>
            How much time does your team spend on project research?
          </h2>
          {/* Body */}
          <div className="flex-1 overflow-auto">
            <h3 className="text-[11px] font-medium text-[#8B93A1]">Summary</h3>
            <div
              className="mt-5 rounded-[8px] "
              onMouseDown={(e) => e.stopPropagation()}
            >
              <RteEditor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                toolbar={{
                  options: ["inline", "list", "link", "history"],
                  inline: {
                    options: ["bold", "italic", "underline", "strikethrough"],
                  },
                  list: { options: ["unordered", "ordered"] },
                }}
                toolbarClassName="border-b px-2"
                editorClassName="px-2 py-2 min-h-[120px]"
                wrapperClassName=""
              />
            </div>
          </div>
        </div>
        <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4">
          <h3 className="text-[11px] font-medium text-[#8B93A1]">Answers</h3>
          <div className="flex items-center">
            <div className="h-[40px] w-[40px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
              <UserIcon className="h-[26px] w-[26px] text-[#6376F2]" />
            </div>

            {/* Interviewer */}
            <div className="flex flex-col ml-5">
              <span className="text-[#111827] text-[14px] font-medium">
                Anastasia Wellington
              </span>
              <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                UX/UI designer
              </span>
            </div>
          </div>
          {/* Body */}
          <div className="flex-1 overflow-auto">
            <div
              className="mt-5 rounded-[8px] "
              onMouseDown={(e) => e.stopPropagation()}
            >
              <RteEditor
                editorState={editorState}
                onEditorStateChange={setEditorState}
                toolbar={{
                  options: ["inline", "list", "link", "history"],
                  inline: {
                    options: ["bold", "italic", "underline", "strikethrough"],
                  },
                  list: { options: ["unordered", "ordered"] },
                }}
                toolbarClassName="border-b px-2"
                editorClassName="px-2 py-2 min-h-[120px]"
                wrapperClassName=""
              />
            </div>
          </div>

          <div className="flex flex-row justify-between items-center">
            <div className="flex items-center justify-center rounded-full h-[30px] w-[30px] border border-[#E9E6F0]">
              <ChevronLeftIcon className="h-4 w-4 text-[#8B92A1]" />
            </div>

            <div className="text-[11px] font-medium text-[#8B93A1]">
              <span className="mr-[1px]">Answer</span>
              <span className="text-black font-bold text-[12px]"> 1</span>
              <span className="font-semibold text-[12px]"> / </span>
              <span className="font-bold text-[12px]">8</span>
            </div>

            <div className="flex items-center justify-center rounded-full h-[30px] w-[30px] border border-[#E9E6F0]">
              <ChevronRightIcon className="h-4 w-4 text-[#8B92A1]" />
            </div>
          </div>
        </div>
      </div>
    </ShapeFrame>
  );
};

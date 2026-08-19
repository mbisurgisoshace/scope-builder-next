"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { QuestionForm } from "./QuestionForm";
import { QuestionView } from "./QuestionView";
import type { InterviewQuestion, InterviewQuestionDraft } from "./types";

interface QuestionListProps {
  questions: InterviewQuestion[];
  onCreate: (value: InterviewQuestionDraft) => Promise<void>;
  onUpdate: (id: string, value: InterviewQuestionDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  readOnly?: boolean;
}

export function QuestionList({
  questions,
  onCreate,
  onUpdate,
  onDelete,
  readOnly = false,
}: QuestionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // Local keys only — a draft becomes a real question (with a row id) on save.
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<InterviewQuestion | null>(
    null,
  );

  // A hypothesis with nothing saved opens straight into a blank form, so the common
  // case — write the question you just decided on — takes no extra click. There is
  // nothing to cancel back to, hence no Cancel on this one. Deliberately independent
  // of `draftKeys`: adding a second draft must not unmount this one from under
  // whatever the user has already typed into it.
  const showAutoDraft = !readOnly && questions.length === 0;

  const addDraft = () =>
    setDraftKeys((prev) => [...prev, crypto.randomUUID()]);

  const removeDraft = (key: string) =>
    setDraftKeys((prev) => prev.filter((k) => k !== key));

  const handleDraftSave = async (
    key: string | null,
    value: InterviewQuestionDraft,
  ) => {
    await onCreate(value);
    if (key) removeDraft(key);
  };

  const handleEditSave = async (
    id: string,
    value: InterviewQuestionDraft,
  ) => {
    await onUpdate(id, value);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  if (readOnly && questions.length === 0) {
    return <p className="text-base text-[#6E7689]">No question yet</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {questions.map((question) =>
        editingId === question.id ? (
          <QuestionForm
            key={question.id}
            initial={{
              title: question.title,
              responseType: question.responseType,
              options: question.options,
            }}
            onSave={(value) => handleEditSave(question.id, value)}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <QuestionView
            key={question.id}
            question={question}
            readOnly={readOnly}
            onEdit={() => setEditingId(question.id)}
            onDelete={() => setPendingDelete(question)}
          />
        ),
      )}

      {showAutoDraft && <QuestionForm onSave={(v) => handleDraftSave(null, v)} />}

      {draftKeys.map((key) => (
        <QuestionForm
          key={key}
          onSave={(value) => handleDraftSave(key, value)}
          onCancel={() => removeDraft(key)}
        />
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={addDraft}
          className="inline-flex w-fit items-center gap-1 text-base font-semibold text-[#6A35FF] hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add custom question
        </button>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question, along with every answer participants have already given
              to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

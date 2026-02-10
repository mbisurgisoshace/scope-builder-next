import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { EllipsisIcon, MessageCircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "./ui/sheet";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { createNote, deleteNote, getNotes, updateNote } from "@/services/notes";

type Note = {
  id: number;
  org_id: string;
  author: string;
  user_id: string;
  content: string;
  created_at: string;
  share_with_startup: boolean;
};

export default function Notes() {
  const { userId, orgId, orgRole } = useAuth();

  const [text, setText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [shareWithStartup, setShareWithStartup] = useState(false);

  useEffect(() => {
    async function fetchNotes() {
      setIsLoading(true);

      const notesData = await getNotes();
      setNotes(
        notesData.map((note) => ({
          id: note.id,
          org_id: note.org_id,
          content: note.content,
          user_id: note.user_id,
          author: note.author_name,
          share_with_startup: note.share_with_startup,
          created_at: format(note.created_at, "MMM d, yyyy h:mm:ss a"),
        })),
      );

      setIsLoading(false);
    }

    fetchNotes();
  }, [orgId, orgRole]);

  const addNote = async () => {
    if (text.trim().length === 0) return;

    try {
      const newNote = await createNote(text, shareWithStartup);

      setText("");
      setShareWithStartup(false);
      setNotes((prevNotes) => [
        ...prevNotes,
        {
          id: newNote.id,
          org_id: newNote.org_id,
          content: newNote.content,
          author: newNote.author_name,
          user_id: newNote.user_id,
          share_with_startup: newNote.share_with_startup,
          created_at: format(newNote.created_at, "MMM d, yyyy h:mm:ss a"),
        },
      ]);
    } catch (err) {
      console.error("Error adding note:", err);
    }
  };

  const onDeleteNote = async (noteId: number) => {
    try {
      await deleteNote(noteId);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const onUpdateNote = async (
    noteId: number,
    content: string,
    shareWithStartup: boolean,
  ) => {
    try {
      await updateNote(noteId, content, shareWithStartup);
      setNotes((prevNotes) =>
        prevNotes.map((note) =>
          note.id === noteId
            ? { ...note, content, share_with_startup: shareWithStartup }
            : note,
        ),
      );
    } catch (err) {
      console.error("Error updating note:", err);
    }
  };

  const canPostNote = orgRole === "org:admin" || orgRole === "org:mentor";

  return (
    <Sheet
      onOpenChange={() => {
        setText("");
        setShareWithStartup(false);
      }}
    >
      <SheetTrigger asChild>
        <Button size={"icon"} className="cursor-pointer">
          <MessageCircleIcon size={14} />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[450px] min-w-[450px] max-w-none">
        <SheetHeader>
          <SheetTitle>Notes</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col justify-between h-full">
          <div className="flex flex-1 w-full">
            {isLoading ? (
              <EllipsisIcon
                size={40}
                className="text-[#6A35FF] animate-pulse self-center ml-auto mr-auto"
              />
            ) : (
              <div className="flex flex-col gap-4 p-4 overflow-y-auto w-full">
                {notes
                  .filter((note) => {
                    let canUserSeeNote = true;

                    if (note.share_with_startup) canUserSeeNote = true;

                    if (!note.share_with_startup && note.user_id !== userId)
                      canUserSeeNote = false;

                    return canUserSeeNote;
                  })
                  .map((note) => (
                    <ChatNote
                      key={note.id}
                      content={note.content}
                      timestamp={note.created_at}
                      sender={{
                        name: note.author,
                        initials: note.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase(),
                      }}
                      isAuthor={note.user_id === userId}
                      isPublic={note.share_with_startup}
                      onDeleteNote={() => onDeleteNote(note.id)}
                      onUpdateNote={(content, shareWithStartup) =>
                        onUpdateNote(note.id, content, shareWithStartup)
                      }
                    />
                  ))}
              </div>
            )}
          </div>
          {canPostNote && (
            <div className="flex flex-col gap-3 p-3">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="flex flex-row gap-2 items-center">
                <Checkbox
                  id="share"
                  checked={shareWithStartup}
                  onCheckedChange={() => setShareWithStartup(!shareWithStartup)}
                />
                <Label htmlFor="share">Share with startup</Label>
              </div>
              <Button onClick={addNote}>Add Note</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ChatNoteProps {
  content: string;
  timestamp: string;
  isPublic: boolean;
  isAuthor: boolean;
  sender: {
    name: string;
    avatar?: string;
    initials: string;
  };
  onDeleteNote: () => Promise<void>;
  onUpdateNote: (content: string, shareWithStartup: boolean) => Promise<void>;
}

export function ChatNote({
  sender,
  content,
  isAuthor,
  isPublic,
  timestamp,
  onDeleteNote,
  onUpdateNote,
}: ChatNoteProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(content);
  const [shareWithStartup, setShareWithStartup] = useState(isPublic);

  const onUpdate = async () => {
    await onUpdateNote(text, shareWithStartup);
    setOpen(false);
  };

  const onDelete = async () => {
    await onDeleteNote();
    setOpen(false);
  };

  return (
    <div
      className={cn("flex items-end gap-2 max-w-[85%] relative group", {
        "ml-auto flex-row-reverse": isAuthor,
      })}
    >
      {isAuthor && (
        <div className="absolute top-0 size-7">
          <Sheet
            open={open}
            onOpenChange={() => {
              setOpen(!open);
              setText(content);
              setShareWithStartup(isPublic);
            }}
          >
            <SheetTrigger className="invisible group-hover:visible" asChild>
              <Button variant={"ghost"} size={"icon"} className="size-7">
                <EllipsisIcon size={14} />
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[450px] min-w-[450px] max-w-none">
              <SheetHeader>
                <SheetTitle>Update/Remove Note</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 p-3">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <div className="flex flex-row gap-2 items-center">
                  <Checkbox
                    id="share"
                    checked={shareWithStartup}
                    onCheckedChange={() =>
                      setShareWithStartup(!shareWithStartup)
                    }
                  />
                  <Label htmlFor="share">Share with startup</Label>
                </div>

                <div className="flex flex-row items-center justify-end gap-1.5">
                  <Button onClick={onUpdate}>Update</Button>
                  <Button onClick={onDelete} variant={"destructive"}>
                    Delete
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
      <Avatar className="h-8 w-8 shrink-0">
        {sender.avatar && (
          <AvatarImage
            src={sender.avatar || "/placeholder.svg"}
            alt={sender.name}
          />
        )}
        <AvatarFallback className="text-xs">{sender.initials}</AvatarFallback>
      </Avatar>

      <div
        className={cn("flex flex-col gap-1", {
          "items-end": isAuthor,
          "items-start": !isAuthor,
        })}
      >
        <span className="text-xs text-muted-foreground px-1">
          {sender.name}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-prose",
            isAuthor
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          {content}
        </div>
        <span className="text-[11px] text-muted-foreground px-1 flex flex-row gap-1.5 items-center">
          {timestamp}
          {isPublic && (
            <span className="font-semibold text-[#6A35FF]">public</span>
          )}
        </span>
      </div>
    </div>
  );
}

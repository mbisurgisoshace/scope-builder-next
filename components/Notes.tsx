import { useEffect, useState } from "react";
import { EllipsisIcon, MessageCircleIcon } from "lucide-react";

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
import { createNote, getNotes } from "@/services/notes";
import { format } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";

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
  const { userId, orgId } = useAuth();

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
  }, []);

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
                {notes.map((note) => (
                  <ChatNote
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
                    isCurrentUser={note.user_id === userId}
                    key={note.id}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 p-3">
            <Textarea value={text} onChange={(e) => setText(e.target.value)} />
            <div className="flex flex-row gap-2 items-center">
              <Checkbox
                id="share"
                checked={shareWithStartup}
                onCheckedChange={() => setShareWithStartup(!shareWithStartup)}
              />
              <Label htmlFor="share">Share with other startups</Label>
            </div>
            <Button onClick={addNote}>Add Note</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface ChatNoteProps {
  content: string;
  timestamp: string;
  sender: {
    name: string;
    avatar?: string;
    initials: string;
  };
  isCurrentUser: boolean;
}

export function ChatNote({
  content,
  timestamp,
  sender,
  isCurrentUser,
}: ChatNoteProps) {
  return (
    <div
      className={cn("flex items-end gap-2 max-w-[85%]", {
        "ml-auto flex-row-reverse": isCurrentUser,
      })}
    >
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
          "items-end": isCurrentUser,
          "items-start": !isCurrentUser,
        })}
      >
        <span className="text-xs text-muted-foreground px-1">
          {sender.name}
        </span>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed max-w-prose",
            isCurrentUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md",
          )}
        >
          {content}
        </div>
        <span className="text-[11px] text-muted-foreground px-1">
          {timestamp}
        </span>
      </div>
    </div>
  );
}

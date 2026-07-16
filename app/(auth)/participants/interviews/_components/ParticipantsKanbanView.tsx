"use client";

import { Participant } from "@/lib/generated/prisma";
import { getParticipants } from "@/services/participants";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Plus } from "lucide-react";
import AddParticipant from "@/app/(auth)/participants/_components/AddParticipant";
import EditParticipantForm from "@/app/(auth)/participants/_components/EditParticipantForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InterviewAnswersView } from "./InterviewAnswers/InterviewAnswersView";

const PROGRESS_COLUMNS = [
  { key: "need_to_schedule", label: "Interviewee" },
  { key: "scheduled", label: "Scheduled" },
  { key: "complete", label: "Conducted" },
  { key: "documented", label: "Documented" },
];

const PROGRESS_COLORS: Record<string, string> = {
  need_to_schedule: "#F5F5F8",
  scheduled: "#FFF3E6",
  complete: "#F4F0FF",
  documented: "#F0FDF4",
};

// TODO: replace with real relationship field from Participant once added to schema
const RELATIONSHIP_COLUMNS = [
  { key: "family_friends_colleagues", label: "Family, Friends, Colleagues" },
  { key: "friend_of_friend", label: "Friend of Family/Friend/Colleague" },
  { key: "cold_connections", label: "Cold connections" },
  { key: "networking_event", label: "Networking Event" },
];

const RELATIONSHIP_COLORS: Record<string, string> = {
  family_friends_colleagues: "#F5F5F8",
  friend_of_friend: "#FFF3E6",
  cold_connections: "#F4F0FF",
  networking_event: "#F0FDF4",
};

function assignRelationship(participant: Participant): string {
  const buckets = RELATIONSHIP_COLUMNS.map((c) => c.key);
  return buckets[participant.id.charCodeAt(0) % buckets.length];
}

function ParticipantCard({
  participant,
  hideRelationship = false,
  onCardClick,
  onEditClick,
}: {
  participant: Participant;
  hideRelationship?: boolean;
  onCardClick?: () => void;
  onEditClick?: () => void;
}) {
  return (
    <div
      onClick={onCardClick}
      className="bg-white rounded-lg w-[250px] border border-[#C9CAD4] p-3 hover:shadow-md transition-shadow cursor-pointer space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[16px] text-[#111827]">
          {participant.name}
        </p>
        {onEditClick && (
          <button
            // The card's own onClick sits on the wrapping div, so without this an
            // edit click would open the interview view too.
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            aria-label={`Edit ${participant.name}`}
            className="shrink-0 text-[#70747D] hover:text-[#111827]"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {!hideRelationship && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Relationship:</span>
          <Badge className="bg-[#EEEFF5] text-[#111827]">Family</Badge>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Stakeholder:</span>
        <span className="text-xs font-semibold text-[#70747D]">
          {participant.role}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Title:</span>
        <span className="text-xs font-semibold text-[#70747D]">
          {participant.job_title}
        </span>
      </div>
      {!participant.scheduled_date && (
        <p className="text-[12px] font-medium text-[#70747D]">Not scheduled</p>
      )}
      {participant.scheduled_date && (
        <p className="text-[12px] font-medium text-[#70747D]">
          {participant.status === "complete" &&
            `Interviewed: ${format(new Date(participant.scheduled_date), "MMM d, k:mm")}`}
          {participant.status === "scheduled" &&
            `Scheduled for: ${format(new Date(participant.scheduled_date), "MMM d, k:mm")}`}
        </p>
      )}
    </div>
  );
}

function KanbanBoard({
  columns,
  getColumnCards,
  getColumnColor,
  hideRelationship = false,
  onAddClick,
  onCardClick,
  onEditClick,
}: {
  columns: { key: string; label: string }[];
  getColumnCards: (key: string) => Participant[];
  getColumnColor: (key: string) => string;
  hideRelationship?: boolean;
  onAddClick?: () => void;
  onCardClick?: (participant: Participant) => void;
  onEditClick?: (participant: Participant) => void;
}) {
  return (
    <div className="flex flex-row gap-4 overflow-x-auto h-full">
      {columns.map(({ key, label }, index) => {
        const cards = getColumnCards(key);
        const isFirst = index === 0;
        return (
          <div
            key={key}
            className="flex flex-col min-w-[300px] bg-[#FFFFFF] rounded-xl border-2 border-[#FFFFFF] overflow-hidden h-full"
          >
            <div
              style={{ backgroundColor: getColumnColor(key) }}
              className="flex items-center justify-between px-3 h-10 border-b border-gray-200"
            >
              <span className="text-xs font-semibold text-[#111827]">
                {label}
              </span>
              {isFirst && onAddClick && (
                <button
                  onClick={onAddClick}
                  className="w-6 h-6 rounded-full bg-[#111827] text-white flex items-center justify-center hover:bg-[#374151] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1 min-h-0">
              {cards.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  hideRelationship={hideRelationship}
                  onCardClick={() => onCardClick?.(participant)}
                  onEditClick={
                    onEditClick ? () => onEditClick(participant) : undefined
                  }
                />
              ))}
              {cards.length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-4">
                  No participants
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ParticipantsKanbanView({
  tags,
  jobTitles,
}: {
  tags: string[];
  jobTitles: string[];
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant | null>(
    null,
  );
  const [interviewParticipant, setInterviewParticipant] =
    useState<Participant | null>(null);
  // Controlled so swapping to the interview view and back doesn't remount the tabs
  // and silently drop the user from Relationship back to Progress.
  const [boardTab, setBoardTab] = useState("progress");

  const refetch = () =>
    getParticipants().then((next) => {
      setParticipants(next);
      // The interview view holds a snapshot, so re-point it at the fresh row after an
      // edit made from its own header — and drop it if the participant is gone.
      setInterviewParticipant((current) =>
        current ? (next.find((p) => p.id === current.id) ?? null) : null,
      );
    });

  useEffect(() => {
    refetch();
  }, []);

  const groupedByStatus = PROGRESS_COLUMNS.reduce<
    Record<string, Participant[]>
  >((acc, { key }) => {
    acc[key] = participants.filter((p) => p.status === key);
    return acc;
  }, {});

  const groupedByRelationship = RELATIONSHIP_COLUMNS.reduce<
    Record<string, Participant[]>
  >((acc, { key }) => {
    acc[key] = participants.filter((p) => assignRelationship(p) === key);
    return acc;
  }, {});

  return (
    <>
      <AddParticipant
        tags={tags}
        jobTitles={jobTitles}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onSuccess={refetch}
      />
      <Sheet
        open={editParticipant !== null}
        onOpenChange={(open) => {
          if (!open) setEditParticipant(null);
        }}
      >
        <SheetContent>
          <SheetHeader className="border-b">
            <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
              {editParticipant?.name}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
            {editParticipant && (
              <EditParticipantForm
                participant={editParticipant}
                tags={tags}
                jobTitles={jobTitles}
                onSuccess={() => {
                  refetch();
                  setEditParticipant(null);
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
      {interviewParticipant ? (
        <InterviewAnswersView
          participant={interviewParticipant}
          onBack={() => setInterviewParticipant(null)}
          onEditProfile={() => setEditParticipant(interviewParticipant)}
          onSaved={() => {
            setInterviewParticipant(null);
            refetch();
            // The milestone header's payer count is server-rendered, so without this
            // it would still show the old number next to the freshly moved card.
            router.refresh();
          }}
        />
      ) : (
        <Tabs
          value={boardTab}
          onValueChange={setBoardTab}
          className="flex flex-col h-full"
        >
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="relationship">Relationship</TabsTrigger>
          </TabsList>
          <TabsContent
            value="progress"
            className="flex-1 min-h-0 overflow-hidden mt-4"
          >
            <KanbanBoard
              columns={PROGRESS_COLUMNS}
              getColumnCards={(key) => groupedByStatus[key] ?? []}
              getColumnColor={(key) => PROGRESS_COLORS[key] ?? "#F5F5F8"}
              onAddClick={() => setSheetOpen(true)}
              onCardClick={setInterviewParticipant}
              onEditClick={setEditParticipant}
            />
          </TabsContent>
          <TabsContent
            value="relationship"
            className="flex-1 min-h-0 overflow-hidden mt-4"
          >
            <KanbanBoard
              columns={RELATIONSHIP_COLUMNS}
              getColumnCards={(key) => groupedByRelationship[key] ?? []}
              getColumnColor={(key) => RELATIONSHIP_COLORS[key] ?? "#F5F5F8"}
              hideRelationship
              onAddClick={() => setSheetOpen(true)}
              onCardClick={setInterviewParticipant}
              onEditClick={setEditParticipant}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}

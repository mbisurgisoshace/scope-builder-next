"use client";

import { Participant } from "@/lib/generated/prisma";
import { getParticipants } from "@/services/participants";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type ParticipantStatus = Participant["status"];

const STATUS_COLUMNS: { status: ParticipantStatus; label: string }[] = [
  { status: "need_to_schedule", label: "Interviewee" },
  { status: "scheduled", label: "Scheduled" },
  { status: "complete", label: "Conducted" },
  { status: "incomplete", label: "Incomplete" },
  { status: "interviewed", label: "Interviewed" },
];

const STATUS_COLORS: Record<string, string> = {
  need_to_schedule: "#F5F5F8",
  scheduled: "#FFF3E6",
  complete: "#F4F0FF",
  incomplete: "#FEE2E2",
  interviewed: "#F3E8FF",
};

// TODO: replace with real relationship field from Participant once added to schema
const RELATIONSHIP_COLUMNS = [
  { key: "family_friends_colleagues", label: "Family, Friends, Colleagues" },
  { key: "friend_of_friend", label: "Friend of Family/Friend/Colleague" },
  { key: "cold_connections", label: "Cold connections" },
  { key: "networking_event", label: "Networking Event" },
];

function assignRelationship(participant: Participant): string {
  const buckets = RELATIONSHIP_COLUMNS.map((c) => c.key);
  return buckets[participant.id.charCodeAt(0) % buckets.length];
}

function ParticipantCard({
  participant,
  hideRelationship = false,
}: {
  participant: Participant;
  hideRelationship?: boolean;
}) {
  return (
    <div className="bg-white rounded-lg w-[250px] border border-[#C9CAD4] p-3 hover:shadow-md transition-shadow cursor-pointer space-y-2">
      <p className="font-semibold text-[16px] text-[#111827]">
        {participant.name}
      </p>
      {!hideRelationship && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">Relationship:</span>
          <Badge className="bg-[#EEEFF5] text-[#111827]">Family</Badge>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Stakeholder:</span>
        <span className="text-xs font-semibold text-[#70747D]">Payer</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Title:</span>
        <span className="text-xs font-semibold text-[#70747D]">CIO</span>
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
}: {
  columns: { key: string; label: string }[];
  getColumnCards: (key: string) => Participant[];
  getColumnColor: (key: string) => string;
  hideRelationship?: boolean;
}) {
  return (
    <div className="flex flex-row gap-4 overflow-x-auto h-full">
      {columns.map(({ key, label }) => {
        const cards = getColumnCards(key);
        return (
          <div
            key={key}
            className="flex flex-col min-w-[300px] bg-[#FFFFFF] rounded-xl border-2 border-[#FFFFFF] overflow-hidden h-full"
          >
            <div
              style={{ backgroundColor: getColumnColor(key) }}
              className="flex items-center justify-between px-3 py-3 border-b border-gray-200"
            >
              <span className="text-xs font-semibold text-[#111827]">
                {label}
              </span>
            </div>
            <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1 min-h-0">
              {cards.map((participant) => (
                <ParticipantCard
                  key={participant.id}
                  participant={participant}
                  hideRelationship={hideRelationship}
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

export default function ParticipantsKanbanView() {
  const [participants, setParticipants] = useState<Participant[]>([]);

  useEffect(() => {
    getParticipants().then(setParticipants);
  }, []);

  const groupedByStatus = STATUS_COLUMNS.reduce<Record<string, Participant[]>>(
    (acc, { status }) => {
      acc[status!] = participants.filter((p) => p.status === status);
      return acc;
    },
    {},
  );

  const visibleStatusColumns = STATUS_COLUMNS.filter(
    ({ status }) =>
      groupedByStatus[status!]?.length > 0 || status === "need_to_schedule",
  ).map((c) => ({ key: c.status as string, label: c.label }));

  const groupedByRelationship = RELATIONSHIP_COLUMNS.reduce<
    Record<string, Participant[]>
  >((acc, { key }) => {
    acc[key] = participants.filter((p) => assignRelationship(p) === key);
    return acc;
  }, {});

  return (
    <Tabs defaultValue="progress" className="flex flex-col h-full">
      <TabsList>
        <TabsTrigger value="progress">Progress</TabsTrigger>
        <TabsTrigger value="relationship">Relationship</TabsTrigger>
      </TabsList>
      <TabsContent value="progress" className="flex-1 min-h-0 overflow-hidden mt-4">
        <KanbanBoard
          columns={visibleStatusColumns}
          getColumnCards={(key) => groupedByStatus[key] ?? []}
          getColumnColor={(key) => STATUS_COLORS[key] ?? "#F5F5F8"}
        />
      </TabsContent>
      <TabsContent value="relationship" className="flex-1 min-h-0 overflow-hidden mt-4">
        <KanbanBoard
          columns={RELATIONSHIP_COLUMNS}
          getColumnCards={(key) => groupedByRelationship[key] ?? []}
          getColumnColor={() => "#F5F5F8"}
          hideRelationship
        />
      </TabsContent>
    </Tabs>
  );
}

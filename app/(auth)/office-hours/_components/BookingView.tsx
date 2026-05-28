"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO, isSameDay } from "date-fns";
import {
  OfficeHourSlot,
  OfficeHourSubSlot,
  OfficeHourBooking,
} from "@/lib/generated/prisma";
import { generateWeeks, formatTimeDisplay } from "@/lib/officeHoursUtils";
import { bookSlot, cancelBooking } from "@/services/officeHours";

type SubSlotWithBooking = OfficeHourSubSlot & {
  booking: OfficeHourBooking | null;
};
type SlotWithSubSlots = OfficeHourSlot & { subSlots: SubSlotWithBooking[] };

type TimeBlock = {
  start_time: string;
  end_time: string;
  entries: {
    subSlotId: string;
    mentorName: string;
    booking: Pick<OfficeHourBooking, "id" | "user_id"> | null;
  }[];
};

interface BookingViewProps {
  initialSlots: SlotWithSubSlots[];
  currentUserId: string;
}

const WEEKS_PER_PAGE = 3;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function BookingView({
  initialSlots,
  currentUserId,
}: BookingViewProps) {
  const [slots, setSlots] = useState<SlotWithSubSlots[]>(initialSlots);
  const [pageIndex, setPageIndex] = useState(0);
  const [, startTransition] = useTransition();

  const programStart = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_START_DATE ?? "2026-01-01"
  );
  const programEnd = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_END_DATE ?? "2026-12-31"
  );

  const weeks = generateWeeks(programStart, programEnd);
  const totalPages = Math.ceil(weeks.length / WEEKS_PER_PAGE);
  const visibleWeeks = weeks.slice(
    pageIndex * WEEKS_PER_PAGE,
    pageIndex * WEEKS_PER_PAGE + WEEKS_PER_PAGE
  );

  function getDayTimeBlocks(date: Date): TimeBlock[] {
    const daySlots = slots.filter((s) => isSameDay(new Date(s.date), date));
    const blockMap = new Map<string, TimeBlock>();
    for (const slot of daySlots) {
      for (const sub of slot.subSlots) {
        const key = `${sub.start_time}-${sub.end_time}`;
        if (!blockMap.has(key)) {
          blockMap.set(key, {
            start_time: sub.start_time,
            end_time: sub.end_time,
            entries: [],
          });
        }
        blockMap.get(key)!.entries.push({
          subSlotId: sub.id,
          mentorName: slot.mentor_name,
          booking: sub.booking
            ? { id: sub.booking.id, user_id: sub.booking.user_id }
            : null,
        });
      }
    }
    return Array.from(blockMap.values()).sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );
  }

  function handleBook(subSlotId: string) {
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId
            ? {
                ...sub,
                booking: {
                  id: "temp",
                  slot_id: sub.slot_id,
                  sub_slot_id: subSlotId,
                  user_id: currentUserId,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              }
            : sub
        ),
      }))
    );

    startTransition(async () => {
      try {
        const booking = await bookSlot(subSlotId);
        setSlots((prev) =>
          prev.map((slot) => ({
            ...slot,
            subSlots: slot.subSlots.map((sub) =>
              sub.id === subSlotId ? { ...sub, booking } : sub
            ),
          }))
        );
      } catch {
        setSlots((prev) =>
          prev.map((slot) => ({
            ...slot,
            subSlots: slot.subSlots.map((sub) =>
              sub.id === subSlotId ? { ...sub, booking: null } : sub
            ),
          }))
        );
      }
    });
  }

  function handleCancel(subSlotId: string) {
    const originalBooking = slots
      .flatMap((s) => s.subSlots)
      .find((sub) => sub.id === subSlotId)?.booking ?? null;

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId ? { ...sub, booking: null } : sub
        ),
      }))
    );

    startTransition(async () => {
      try {
        await cancelBooking(subSlotId);
      } catch {
        setSlots((prev) =>
          prev.map((slot) => ({
            ...slot,
            subSlots: slot.subSlots.map((sub) =>
              sub.id === subSlotId ? { ...sub, booking: originalBooking } : sub
            ),
          }))
        );
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center mb-6">
        <button
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          disabled={pageIndex === 0}
          className="absolute left-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          aria-label="Previous weeks"
        >
          <ChevronLeft size={16} />
        </button>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Manrope" }}
        >
          Office Hours
        </h1>
        <button
          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
          disabled={pageIndex >= totalPages - 1}
          className="absolute right-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          aria-label="Next weeks"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
        {visibleWeeks.map((week) => (
          <div
            key={week.weekStart.toISOString()}
            className="bg-white border border-gray-100 rounded-2xl overflow-hidden"
          >
            <div className="bg-[#F4F0FF] px-4 py-3">
              <p className="text-sm font-bold text-gray-800">{week.label}</p>
            </div>

            <div className="px-4 py-2 overflow-y-auto">
              {week.days.map((day) => {
                const blocks = getDayTimeBlocks(day.date);
                return (
                  <div
                    key={day.date.toISOString()}
                    className="py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-28 shrink-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {day.dayName}
                        </p>
                        <p className="text-xs text-gray-400">{day.dayDate}</p>
                      </div>

                      <div className="flex-1 space-y-2">
                        {blocks.length === 0 ? (
                          <p className="text-xs text-gray-300">—</p>
                        ) : (
                          blocks.map((block) => (
                            <div
                              key={`${block.start_time}-${block.end_time}`}
                              className="flex items-center gap-3 flex-wrap"
                            >
                              <span className="text-xs text-gray-500 w-36 shrink-0">
                                {formatTimeDisplay(block.start_time)} –{" "}
                                {formatTimeDisplay(block.end_time)}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {block.entries.map((entry) => {
                                  const isBookedByMe =
                                    entry.booking?.user_id === currentUserId;
                                  const isBookedByOther =
                                    !!entry.booking && !isBookedByMe;
                                  return (
                                    <button
                                      key={entry.subSlotId}
                                      disabled={isBookedByOther}
                                      title={entry.mentorName}
                                      onClick={() =>
                                        isBookedByMe
                                          ? handleCancel(entry.subSlotId)
                                          : handleBook(entry.subSlotId)
                                      }
                                      className={`w-9 h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors ${
                                        isBookedByOther
                                          ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                                          : isBookedByMe
                                          ? "bg-[#6A35FF] text-white border-[#6A35FF] hover:bg-[#5520e0]"
                                          : "bg-white text-gray-600 border-gray-300 hover:border-[#6A35FF] hover:text-[#6A35FF]"
                                      }`}
                                    >
                                      {getInitials(entry.mentorName)}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

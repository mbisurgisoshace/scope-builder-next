"use client";

import Link from "next/link";
import { BookOpen, ExternalLink, PlayCircle } from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";

import { getYouTubeVideoId } from "@/lib/youtube";
import type { GetStartedCardWithData } from "@/services/getStarted";
import { ReviewedToggle } from "./ReviewedToggle";

interface GetStartedCardProps {
  card: GetStartedCardWithData;
  /** Whole-card reviewed state (used by `text` cards). */
  cardReviewed: boolean;
  /** Per-item reviewed state keyed by item id (used by `links` / `videos`). */
  itemReviewed: Record<number, boolean>;
  onToggleCard: (cardId: number, next: boolean) => void;
  onToggleItem: (itemId: number, next: boolean) => void;
}

export function GetStartedCard({
  card,
  cardReviewed,
  itemReviewed,
  onToggleCard,
  onToggleItem,
}: GetStartedCardProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CardIcon type={card.type} />
        <h3 className="text-base font-semibold text-[#1F2430]">{card.title}</h3>
      </div>

      {card.type === "text" && (
        <>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[#697288]">
            {card.body}
          </p>
          <div className="mt-4">
            <ReviewedToggle
              reviewed={cardReviewed}
              onToggle={(next) => onToggleCard(card.id, next)}
            />
          </div>
        </>
      )}

      {card.type === "links" && (
        <ul className="flex flex-col divide-y divide-[#EEF0F4]">
          {card.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0"
            >
              <Link
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#2E3545] hover:text-[#6A35FF]"
              >
                <span className="truncate">{item.title}</span>
                <ExternalLink className="size-3.5 shrink-0 text-[#9AA1B2]" />
              </Link>
              <ReviewedToggle
                reviewed={!!itemReviewed[item.id]}
                onToggle={(next) => onToggleItem(item.id, next)}
              />
            </li>
          ))}
        </ul>
      )}

      {card.type === "videos" && (
        <ul className="flex flex-col gap-5">
          {card.items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-xl bg-black">
                <YouTubeEmbed
                  params="controls=1"
                  videoid={getYouTubeVideoId(item.url)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-sm font-medium text-[#2E3545]">
                  {item.title}
                </span>
                <ReviewedToggle
                  reviewed={!!itemReviewed[item.id]}
                  onToggle={(next) => onToggleItem(item.id, next)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CardIcon({ type }: { type: string }) {
  const Icon = type === "videos" ? PlayCircle : type === "links" ? ExternalLink : BookOpen;
  return (
    <span className="flex size-6 items-center justify-center rounded-md bg-[#F1ECFF] text-[#6A35FF]">
      <Icon className="size-3.5" />
    </span>
  );
}

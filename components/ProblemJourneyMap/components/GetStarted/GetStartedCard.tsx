"use client";

import Link from "next/link";
import {
  BookOpen,
  ExternalLink,
  ImageIcon,
  ListChecks,
  PlayCircle,
} from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";

import { cn } from "@/lib/utils";
import { getYouTubeVideoId } from "@/lib/youtube";
import { detectVideoSource, getVimeoVideoId } from "@/lib/video";
import type { GetStartedCardWithData } from "@/services/getStarted";
import { ReviewedToggle } from "./ReviewedToggle";

interface GetStartedCardProps {
  card: GetStartedCardWithData;
  /** Whole-card reviewed state (used by every type except `steps`). */
  cardReviewed: boolean;
  /** Per-item reviewed state keyed by item id (used by `steps`). */
  itemReviewed: Record<number, boolean>;
  onToggleCard: (cardId: number, next: boolean) => void;
  onToggleItem: (itemId: number, next: boolean) => void;
  /** Reviewed toggles are shown but disabled (Examples pages). */
  readOnly?: boolean;
}

export function GetStartedCard({
  card,
  cardReviewed,
  itemReviewed,
  onToggleCard,
  onToggleItem,
  readOnly = false,
}: GetStartedCardProps) {
  /**
   * A steps card can carry an authored intro (text and/or a video) above its
   * checklist; when it does the first row keeps its padding and gets a divider.
   */
  const hasStepsIntro = !!(card.body || card.url);

  /**
   * Shared tail for the authored card types: the optional body text plus the one
   * whole-card Reviewed checkmark. `steps` is the only card with per-item marks.
   */
  const body = (
    <>
      {card.body && (
        <p className="whitespace-pre-line text-sm leading-relaxed text-[#697288]">
          {card.body}
        </p>
      )}
      <div className="mt-4">
        <ReviewedToggle
          reviewed={cardReviewed}
          onToggle={(next) => onToggleCard(card.id, next)}
          readOnly={readOnly}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CardIcon type={card.type} />
        <h3 className="text-base font-semibold text-[#1F2430]">{card.title}</h3>
      </div>

      {card.type === "paragraph" && body}

      {card.type === "image" && (
        <>
          {card.url && (
            // Plain <img>, not next/image: admins paste arbitrary urls and
            // next.config.ts only whitelists clerk + supabase hosts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.url}
              alt={card.title}
              className="mb-4 w-full rounded-xl object-cover"
            />
          )}
          {body}
        </>
      )}

      {card.type === "video" && (
        <>
          <div className="mb-4 overflow-hidden rounded-xl bg-black">
            <VideoPlayer url={card.url ?? ""} title={card.title} />
          </div>
          {body}
        </>
      )}

      {card.type === "steps" && (
        <>
          {/* Optional intro authored in /admin-panel — text, then a video, then
              the checklist. The sub-steps themselves come from the seed. */}
          {card.body && (
            <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-[#697288]">
              {card.body}
            </p>
          )}

          {card.url && (
            <div className="mb-4 overflow-hidden rounded-xl bg-black">
              <VideoPlayer url={card.url} title={card.title} />
            </div>
          )}

          <ul
            className={cn(
              "flex flex-col divide-y divide-[#EEF0F4]",
              hasStepsIntro && "border-t border-[#EEF0F4]",
            )}
          >
            {card.items.map((item) => (
              <li
                key={item.id}
                className={cn(
                  "flex items-center justify-between gap-3 py-3",
                  !hasStepsIntro && "first:pt-0",
                )}
              >
                {/* Text-only today; an item that gains a url renders as a link
                    so the card can carry reading/video material later. */}
                {item.url ? (
                  <Link
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-[#2E3545] hover:text-[#6A35FF]"
                  >
                    <span className="truncate">{item.title}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-[#9AA1B2]" />
                  </Link>
                ) : (
                  <span className="min-w-0 truncate text-sm font-medium text-[#2E3545]">
                    {item.title}
                  </span>
                )}
                <ReviewedToggle
                  reviewed={!!itemReviewed[item.id]}
                  onToggle={(next) => onToggleItem(item.id, next)}
                  readOnly={readOnly}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/** Picks the player from the url shape — see lib/video.ts. */
function VideoPlayer({ url, title }: { url: string; title: string }) {
  const source = detectVideoSource(url);

  if (source === "youtube") {
    return (
      <YouTubeEmbed params="controls=1" videoid={getYouTubeVideoId(url)} />
    );
  }

  if (source === "vimeo") {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${getVimeoVideoId(url)}`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full"
      />
    );
  }

  return <video src={url} controls className="aspect-video w-full" />;
}

function CardIcon({ type }: { type: string }) {
  const Icon =
    type === "video"
      ? PlayCircle
      : type === "image"
        ? ImageIcon
        : type === "steps"
          ? ListChecks
          : BookOpen;
  return (
    <span className="flex size-6 items-center justify-center rounded-md bg-[#F1ECFF] text-[#6A35FF]">
      <Icon className="size-3.5" />
    </span>
  );
}

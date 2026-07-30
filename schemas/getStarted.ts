import z from "zod";

import { MILESTONE_COUNT } from "@/lib/milestones";

/**
 * Card types an admin can author. "steps" is deliberately absent — those cards
 * are seeded from lib/milestones.ts and their per-item reviews are milestone
 * progress (see prisma/seedSteps.ts).
 */
export const GET_STARTED_CARD_TYPES = ["paragraph", "image", "video"] as const;

export type GetStartedCardType = (typeof GET_STARTED_CARD_TYPES)[number];

/** Types that require a `url`; "paragraph" is text-only. */
export const MEDIA_CARD_TYPES: GetStartedCardType[] = ["image", "video"];

export const GET_STARTED_CARD_TYPE_LABELS: Record<GetStartedCardType, string> =
  {
    paragraph: "Paragraph",
    image: "Image",
    video: "Video",
  };

export const getStartedCardFormSchema = z
  .object({
    milestone: z
      .number()
      .min(1, "Milestone is required.")
      .max(
        MILESTONE_COUNT,
        `Milestone must be between 1 and ${MILESTONE_COUNT}.`,
      ),
    type: z.enum(GET_STARTED_CARD_TYPES),
    title: z.string().min(1, "Title is required."),
    body: z.string().optional(),
    url: z.string().optional(),
    order: z.number().min(0, "Order must be a positive number."),
  })
  .superRefine((values, ctx) => {
    if (!MEDIA_CARD_TYPES.includes(values.type)) return;

    const url = values.url?.trim();

    if (!url) {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: `URL is required for ${GET_STARTED_CARD_TYPE_LABELS[values.type]} cards.`,
      });
      return;
    }

    try {
      new URL(url);
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Must be a valid URL.",
      });
    }
  });

export type GetStartedCardFormValues = z.infer<typeof getStartedCardFormSchema>;

/**
 * The seeded "steps" card is only partly editable: admins can set the intro text
 * and an optional video shown between the title and the sub-step checklist, but
 * not the milestone, title, order, or the sub-steps themselves — those come from
 * lib/milestones.ts via prisma/seedSteps.ts.
 */
export const stepsCardFormSchema = z
  .object({
    body: z.string().optional(),
    url: z.string().optional(),
  })
  .superRefine((values, ctx) => {
    const url = values.url?.trim();

    if (!url) return; // the video is optional

    try {
      new URL(url);
    } catch {
      ctx.addIssue({
        code: "custom",
        path: ["url"],
        message: "Must be a valid URL.",
      });
    }
  });

export type StepsCardFormValues = z.infer<typeof stepsCardFormSchema>;

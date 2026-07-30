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

export const GET_STARTED_CARD_TYPE_LABELS: Record<GetStartedCardType, string> = {
  paragraph: "Paragraph",
  image: "Image",
  video: "Video",
};

export const getStartedCardFormSchema = z
  .object({
    milestone: z
      .number()
      .min(1, "Milestone is required.")
      .max(MILESTONE_COUNT, `Milestone must be between 1 and ${MILESTONE_COUNT}.`),
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

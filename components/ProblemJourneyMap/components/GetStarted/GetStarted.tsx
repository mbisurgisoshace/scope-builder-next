"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Loader } from "@/components/ui/loader";
import {
  getGetStartedCards,
  setCardReviewed,
  setItemReviewed,
  type GetStartedCardWithData,
} from "@/services/getStarted";
import { getExampleGetStartedCards } from "@/services/examples";
import {
  getMilestoneSubmission,
  submitMilestone,
} from "@/services/milestoneAccess";
import { subStepKey } from "@/lib/milestones";
import { useMilestoneSelection } from "../../MilestoneSelectionContext";
import { useSubStepProgress } from "../../SubStepProgressContext";
import { GetStartedCard } from "./GetStartedCard";
import { MasonryGrid } from "./MasonryGrid";

// Mirrors the shared transition used in MilestoneHeader.tsx so milestone
// changes feel consistent across the header and its content.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

interface GetStartedProps {
  readOnly?: boolean;
  exampleNumber?: number;
}

export function GetStarted({ readOnly = false, exampleNumber }: GetStartedProps) {
  const { selectedMilestone } = useMilestoneSelection();
  const milestone = selectedMilestone + 1;
  const { setSubStepReviewed, mergeSubStepProgress } = useSubStepProgress();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? INSTANT : TRANSITION;

  const [cards, setCards] = useState<GetStartedCardWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardReviewed, setCardReviewedState] = useState<Record<number, boolean>>({});
  const [itemReviewed, setItemReviewedState] = useState<Record<number, boolean>>({});
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);

    // Submission is per-org and has no example-set mirror, so the Examples
    // pages just show the button disabled and unsubmitted.
    if (exampleNumber != null) {
      setSubmittedAt(null);
    } else {
      getMilestoneSubmission(milestone).then((result) => {
        if (active) setSubmittedAt(result);
      });
    }

    const load =
      exampleNumber != null
        ? getExampleGetStartedCards(milestone, exampleNumber)
        : getGetStartedCards(milestone);

    load.then((result) => {
      if (!active) return;

      const cardMap: Record<number, boolean> = {};
      const itemMap: Record<number, boolean> = {};
      // Sub-step items of this milestone's steps card, so the header agrees with
      // what was just loaded even if it was mounted before this fetch.
      const subStepMap: Record<string, boolean> = {};
      for (const card of result) {
        for (const review of card.reviews) {
          if (review.card_id != null) cardMap[review.card_id] = review.reviewed;
        }
        for (const item of card.items) {
          for (const review of item.reviews) {
            itemMap[review.item_id!] = review.reviewed;
          }
          if (item.sub_step != null) {
            subStepMap[subStepKey(card.milestone, item.sub_step)] =
              item.reviews.some((review) => review.reviewed);
          }
        }
      }

      setCards(result);
      setCardReviewedState(cardMap);
      setItemReviewedState(itemMap);
      mergeSubStepProgress(subStepMap);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [milestone, exampleNumber, mergeSubStepProgress]);

  const toggleCard = (cardId: number, next: boolean) => {
    if (readOnly) return;
    setCardReviewedState((prev) => ({ ...prev, [cardId]: next })); // optimistic
    setCardReviewed(cardId, next).catch(() =>
      setCardReviewedState((prev) => ({ ...prev, [cardId]: !next })),
    );
  };

  const toggleItem = (itemId: number, next: boolean) => {
    if (readOnly) return;
    setItemReviewedState((prev) => ({ ...prev, [itemId]: next })); // optimistic

    // Items on the steps card carry a sub_step: reviewing one marks the matching
    // sub-step Done in the milestone header.
    const item = cards
      .flatMap((card) => card.items.map((cardItem) => ({ card, item: cardItem })))
      .find((entry) => entry.item.id === itemId);
    const key =
      item && item.item.sub_step != null
        ? subStepKey(item.card.milestone, item.item.sub_step)
        : null;
    if (key) setSubStepReviewed(key, next);

    setItemReviewed(itemId, next).catch(() => {
      setItemReviewedState((prev) => ({ ...prev, [itemId]: !next }));
      if (key) setSubStepReviewed(key, !next);
    });
  };

  const submit = () => {
    if (readOnly || submittedAt) return;
    setSubmittedAt(new Date()); // optimistic; the server timestamp wins below
    submitMilestone(milestone)
      .then(setSubmittedAt)
      .catch(() => setSubmittedAt(null));
  };

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="flex h-full w-full items-center justify-center"
        >
          <Loader />
        </motion.div>
      ) : cards.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="flex h-full w-full items-center justify-center p-8"
        >
          <p className="text-base text-[#4E5566]">
            No Get Started content for this milestone yet.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={`cards-${milestone}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="h-full overflow-y-auto p-6"
        >
          <MasonryGrid>
            {cards.map((card) => (
              <GetStartedCard
                key={card.id}
                card={card}
                cardReviewed={!!cardReviewed[card.id]}
                itemReviewed={itemReviewed}
                onToggleCard={toggleCard}
                onToggleItem={toggleItem}
                milestoneSubmittedAt={submittedAt}
                onSubmitMilestone={submit}
                readOnly={readOnly}
              />
            ))}
          </MasonryGrid>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

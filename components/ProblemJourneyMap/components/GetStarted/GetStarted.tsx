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
import { useMilestoneSelection } from "../../MilestoneSelectionContext";
import { GetStartedCard } from "./GetStartedCard";

// Mirrors the shared transition used in MilestoneHeader.tsx so milestone
// changes feel consistent across the header and its content.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

export function GetStarted() {
  const { selectedMilestone } = useMilestoneSelection();
  const milestone = selectedMilestone + 1;
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? INSTANT : TRANSITION;

  const [cards, setCards] = useState<GetStartedCardWithData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardReviewed, setCardReviewedState] = useState<Record<number, boolean>>({});
  const [itemReviewed, setItemReviewedState] = useState<Record<number, boolean>>({});

  useEffect(() => {
    let active = true;
    setLoading(true);

    getGetStartedCards(milestone).then((result) => {
      if (!active) return;

      const cardMap: Record<number, boolean> = {};
      const itemMap: Record<number, boolean> = {};
      for (const card of result) {
        for (const review of card.reviews) {
          if (review.card_id != null) cardMap[review.card_id] = review.reviewed;
        }
        for (const item of card.items) {
          for (const review of item.reviews) {
            itemMap[review.item_id!] = review.reviewed;
          }
        }
      }

      setCards(result);
      setCardReviewedState(cardMap);
      setItemReviewedState(itemMap);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [milestone]);

  const toggleCard = (cardId: number, next: boolean) => {
    setCardReviewedState((prev) => ({ ...prev, [cardId]: next })); // optimistic
    setCardReviewed(cardId, next).catch(() =>
      setCardReviewedState((prev) => ({ ...prev, [cardId]: !next })),
    );
  };

  const toggleItem = (itemId: number, next: boolean) => {
    setItemReviewedState((prev) => ({ ...prev, [itemId]: next })); // optimistic
    setItemReviewed(itemId, next).catch(() =>
      setItemReviewedState((prev) => ({ ...prev, [itemId]: !next })),
    );
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
          <p className="text-sm text-[#697288]">
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
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((card) => (
              <GetStartedCard
                key={card.id}
                card={card}
                cardReviewed={!!cardReviewed[card.id]}
                itemReviewed={itemReviewed}
                onToggleCard={toggleCard}
                onToggleItem={toggleItem}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Loader } from "@/components/ui/loader";
import {
  getMilestoneSubmission,
  submitMilestone,
} from "@/services/milestoneAccess";
import { useMilestoneSelection } from "../../MilestoneSelectionContext";
import { useGetStartedCards } from "../../GetStartedCardsContext";
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
  const { selectedMilestone: milestone } = useMilestoneSelection();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? INSTANT : TRANSITION;

  // Cached page-wide and shared with MilestoneStepsDialog, which renders this
  // milestone's steps card from the journey tab bar. Leaving and returning to
  // this tab doesn't re-query.
  const { cards, loading, cardReviewed, itemReviewed, toggleCard, toggleItem } =
    useGetStartedCards(milestone);

  const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;

    // Submission is per-org and has no example-set mirror, so the Examples
    // pages just show the button disabled and unsubmitted.
    if (exampleNumber != null) {
      setSubmittedAt(null);
    } else {
      getMilestoneSubmission(milestone).then((result) => {
        if (active) setSubmittedAt(result);
      });
    }

    return () => {
      active = false;
    };
  }, [milestone, exampleNumber]);

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

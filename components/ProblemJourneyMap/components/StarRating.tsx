"use client";

import { StarIcon } from "lucide-react";

interface StarRatingProps {
  value: number;
  /** Omit for a display-only rating. */
  onChange?: (value: number) => void;
  readOnly?: boolean;
  /** `sm` for tight rows where the rating sits inline with label text. */
  size?: "sm" | "md";
}

/** 5-star confidence rating. Shared by the problem sheet (editable) and the
 * interview-prep hypothesis rows (display-only). */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
}: StarRatingProps) {
  const interactive = Boolean(onChange) && !readOnly;
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i === value ? 0 : i)}
          className="shrink-0 text-[#6A35FF] focus:outline-none disabled:cursor-default"
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
        >
          <StarIcon
            className={`${starSize} ${
              i <= value
                ? "fill-[#6A35FF] text-[#6A35FF]"
                : "fill-none text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

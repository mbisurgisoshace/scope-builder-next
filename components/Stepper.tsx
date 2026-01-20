import React from "react";
import clsx from "clsx";

export function StepClip({
  variant,
  active,
  children,
}: {
  variant: "first" | "middle";
  active?: boolean;
  children?: React.ReactNode;
}) {
  const base = clsx(
    "h-12 px-6 flex items-center justify-center text-sm font-medium",
    variant === "first" ? "rounded-xl" : "",
    active
      ? "bg-violet-600 text-white border-violet-600"
      : "bg-white text-gray-700",
  );

  // Middle: left notch + right arrow
  // Coordinates are percentages; tweak until it matches your screenshot.
  const middleClip =
    "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 6% 50%)";

  const startClip =
    "polygon(0% 0%, 92% 0%, 100% 50%, 92% 100%, 0% 100%, 0% 50%)";

  // First: normal rounded pill (no clip)
  return (
    <div
      className={base}
      style={
        variant === "middle"
          ? { clipPath: middleClip }
          : { clipPath: startClip }
      }
    >
      {children}
    </div>
  );
}

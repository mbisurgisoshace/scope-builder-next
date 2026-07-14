// PLACEHOLDER — the mockup shows a real beachhead (adoption bell curve) image.
// This is a lightweight recreation to be swapped for the final asset later.

const LEGEND = [
  { label: "Innovators", color: "#2FBFA0" },
  { label: "Early adopters", color: "#9F7CFF" },
  { label: "Early majority", color: "#F2B441" },
  { label: "Late majority", color: "#E86A5B" },
  { label: "Laggards", color: "#5B6472" },
];

export function BeachheadChart({ className }: { className?: string }) {
  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 90"
        className="w-full"
        role="img"
        aria-label="Adoption bell curve"
      >
        <path
          d="M0 88 C 55 88, 70 8, 100 8 C 130 8, 145 88, 200 88 Z"
          fill="#E6DEFF"
          stroke="#C9BCFF"
          strokeWidth="1"
        />
        {[66, 100, 134].map((x) => (
          <line
            key={x}
            x1={x}
            y1="12"
            x2={x}
            y2="88"
            stroke="#C9BCFF"
            strokeWidth="1"
          />
        ))}
      </svg>

      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        {LEGEND.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-[10px] text-[#697288]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

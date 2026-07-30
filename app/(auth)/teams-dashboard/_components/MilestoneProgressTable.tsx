"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MILESTONE_LABELS,
  MILESTONE_NUMBERS,
  subStepsForMilestone,
  type MilestoneAccessState,
} from "@/lib/milestones";

export interface MilestoneProgressRow {
  orgId: string;
  orgName: string;
  /** Sub-step key ("1.1", "2.3"…) → reviewed. Absent key means not reviewed. */
  subSteps: Record<string, boolean>;
  /** All 5 slots, indexed by milestone - 1. */
  milestones: MilestoneAccessState[];
}

/** Sub-step columns are narrow enough to fit 21 of them; the milestone columns get
 * a little more room and a tint so each group reads as a block. */
const SUB_STEP_WIDTH = 52;
const MILESTONE_WIDTH = 64;
const NAME_WIDTH = 220;

/** Pins the startup name while the other 26 columns scroll under it. Needs an
 * opaque background of its own or the cells show through. */
const STICKY_NAME_CELL = "sticky left-0 z-20 bg-white";
const STICKY_NAME_HEAD = "sticky left-0 z-30 bg-muted";
const MILESTONE_TINT = "bg-muted/40";

/** Matches the sign-off column only — `milestone-group-N` is the header above the
 * whole group and must not pick up the tint. */
const isMilestoneColumn = (id: string) => /^milestone-\d+$/.test(id);

function ProgressCheck({ done }: { done: boolean }) {
  return (
    <span
      className="flex justify-center"
      title={done ? "Reviewed" : "Not reviewed"}
    >
      {done ? (
        <CheckIcon className="size-4 text-[#58C184]" />
      ) : (
        <CircleIcon className="size-4 text-gray-300" />
      )}
    </span>
  );
}

// Nothing here closes over a callback, so the columns are a module-level constant
// rather than a `getColumns(...)` factory.
const columns: ColumnDef<MilestoneProgressRow>[] = [
  {
    accessorKey: "orgName",
    header: "Startup",
    size: NAME_WIDTH,
    minSize: NAME_WIDTH,
  },
  // One group per milestone: its sub-steps, then the milestone sign-off itself.
  // The grouped header is what keeps 26 columns readable — `getHeaderGroups()`
  // renders the extra row for free.
  ...MILESTONE_NUMBERS.map<ColumnDef<MilestoneProgressRow>>((milestone) => ({
    id: `milestone-group-${milestone}`,
    header: () => (
      <span className="whitespace-nowrap">
        M{milestone} · {MILESTONE_LABELS[milestone - 1]}
      </span>
    ),
    columns: [
      ...subStepsForMilestone(milestone).map<ColumnDef<MilestoneProgressRow>>(
        (subStep) => ({
          id: `substep-${subStep.key}`,
          header: () => <span title={subStep.label}>{subStep.key}</span>,
          size: SUB_STEP_WIDTH,
          cell: ({ row }) => (
            <ProgressCheck done={Boolean(row.original.subSteps[subStep.key])} />
          ),
        }),
      ),
      {
        id: `milestone-${milestone}`,
        header: () => <span className="whitespace-nowrap">M #{milestone}</span>,
        size: MILESTONE_WIDTH,
        cell: ({ row }) => (
          <ProgressCheck
            done={row.original.milestones[milestone - 1]?.reviewedAt != null}
          />
        ),
      },
    ],
  })),
];

export default function MilestoneProgressTable({
  data,
}: {
  data: MilestoneProgressRow[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    // `Table` renders its own `overflow-x-auto` container, which is therefore the
    // nearest scroll ancestor. Constraining it to the full height makes it the single
    // scroller for both axes, so the sticky header and sticky name column both anchor
    // to something that actually scrolls.
    <div className="h-full rounded-md border [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-auto">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isName = header.column.id === "orgName";
                const isMilestone = isMilestoneColumn(header.column.id);

                return (
                  <TableHead
                    key={header.id}
                    // Grouped headers span their sub-steps.
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                    className={`p-2 text-center text-xs font-semibold ${
                      isName ? `text-left ${STICKY_NAME_HEAD}` : ""
                    } ${isMilestone ? MILESTONE_TINT : ""}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isName = cell.column.id === "orgName";
                  const isMilestone = isMilestoneColumn(cell.column.id);

                  return (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-2 text-sm font-medium text-[#111827] ${
                        isName ? STICKY_NAME_CELL : ""
                      } ${isMilestone ? MILESTONE_TINT : ""}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={leafColumnCount} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

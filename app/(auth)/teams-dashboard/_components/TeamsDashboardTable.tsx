"use client";

import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { StarIcon } from "lucide-react";

const columns: ColumnDef<any>[] = [
  {
    id: "favorite",
    header: ({ table }) => (
      <div>
        <StarIcon size={20} />
      </div>
    ),
    cell: ({ row }) => (
      <div>
        <StarIcon size={20} />
      </div>
    ),
  },
  {
    id: "team",
    header: "Team",
    cell: ({ row }) => (
      <div>
        <span className="text-xs font-semibold">{row.original.team}</span>
      </div>
    ),
  },
  {
    id: "interviews",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Interviews:</span>
        <span>scheduled / conducted</span>
      </div>
    ),
    cell: ({ row }) => {
      const totalInterviews = row.original.interviews.length;
      const conductedInterviews = row.original.interviews.filter(
        (interview: any) => interview.status === "conducted",
      ).length;

      return (
        <div className="flex flex-row items-center gap-2">
          <span className="text-gray-500 font-semibold">
            {conductedInterviews} / {totalInterviews}
          </span>
          <Progress
            className="w-[60%]"
            progressClassname="bg-purple-500"
            value={(conductedInterviews / totalInterviews) * 100}
          />
        </div>
      );
    },
  },
  {
    id: "hypothesis_stated",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Hypothesis</span>
        <span>stated</span>
      </div>
    ),
    cell: ({ row }) => {
      const statedHypotheses = row.original.hypothesis.filter(
        (hypothesis: any) => hypothesis.status === "stated",
      ).length;

      return (
        <div>
          <span className="text-gray-500 font-semibold">
            {statedHypotheses}
          </span>
        </div>
      );
    },
  },
  {
    id: "hypothesis",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Hypothesis</span>
        <span>validated / invalidated / testing</span>
      </div>
    ),
    cell: ({ row }) => {
      const totalHypothesesWithoutStated = row.original.hypothesis.filter(
        (hypothesis: any) => hypothesis.status !== "stated",
      ).length;
      const validatedHypotheses = row.original.hypothesis.filter(
        (hypothesis: any) => hypothesis.status === "validated",
      ).length;
      const invalidatedHypotheses = row.original.hypothesis.filter(
        (hypothesis: any) => hypothesis.status === "invalidated",
      ).length;
      const testingHypotheses = row.original.hypothesis.filter(
        (hypothesis: any) => hypothesis.status === "testing",
      ).length;

      return (
        <div className="flex flex-row items-center gap-2">
          <span className="font-semibold text-[#697288]">
            <span className="text-[#58C184] underline">
              {" "}
              {validatedHypotheses}
            </span>{" "}
            /{" "}
            <span className="text-[#C66B8F] underline">
              {invalidatedHypotheses}
            </span>{" "}
            / <span className="text-[#697288]">{testingHypotheses}</span>
          </span>

          <Progress
            className="w-[60%]"
            progressClassname="bg-[#6A35FF]"
            total={totalHypothesesWithoutStated}
            segments={[
              { value: validatedHypotheses, colorClass: "bg-[#58C184]" },
              { value: invalidatedHypotheses, colorClass: "bg-[#C66B8F]" },
              { value: testingHypotheses, colorClass: "bg-[#DDD9E9]" },
            ]}
          />
        </div>
      );
    },
  },
];

const testData = [
  {
    team: "Team A",
    interviews: [
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
    ],
    hypothesis: [
      { status: "stated" },
      { status: "validated" },
      { status: "validated" },
      { status: "invalidated" },
      { status: "testing" },
    ],
  },
  {
    team: "Team B",
    interviews: [
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
    ],
    hypothesis: [
      { status: "stated" },
      { status: "validated" },
      { status: "validated" },
      { status: "invalidated" },
      { status: "testing" },
    ],
  },
  {
    team: "Team C",
    interviews: [
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
    ],
    hypothesis: [
      { status: "stated" },
      { status: "validated" },
      { status: "validated" },
      { status: "invalidated" },
      { status: "testing" },
    ],
  },
  {
    team: "Team D",
    interviews: [
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-02", status: "conducted" },
    ],
    hypothesis: [
      { status: "stated" },
      { status: "validated" },
      { status: "validated" },
      { status: "invalidated" },
      { status: "testing" },
    ],
  },
  {
    team: "Team E",
    interviews: [
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-01", status: "scheduled" },
      { date: "2024-01-02", status: "conducted" },
    ],
    hypothesis: [
      { status: "stated" },
      { status: "stated" },
      { status: "validated" },
      { status: "invalidated" },
      { status: "testing" },
    ],
  },
];

export default function TeamsDashboardTable({ data }: { data: any[] }) {
  const table = useReactTable({
    data: testData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10 p-2">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    className="p-2 text-xs font-semibold"
                    key={header.id}
                    colSpan={header.colSpan}
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
          {table.getRowModel().rows.map((row) => (
            <TableRow
              id={row.id}
              key={row.id}
              className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

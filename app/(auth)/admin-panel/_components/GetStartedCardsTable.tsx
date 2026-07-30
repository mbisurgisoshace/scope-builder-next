"use client";

import z from "zod";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EllipsisVerticalIcon } from "lucide-react";

import { GetStartedCard } from "@/lib/generated/prisma";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MILESTONE_LABELS, MILESTONE_NUMBERS } from "@/lib/milestones";
import {
  getStartedCardFormSchema,
  GET_STARTED_CARD_TYPES,
  GET_STARTED_CARD_TYPE_LABELS,
  type GetStartedCardType,
} from "@/schemas/getStarted";
import {
  createGetStartedCard,
  updateGetStartedCard,
} from "@/services/getStarted";

type FormValues = z.infer<typeof getStartedCardFormSchema>;

const columns: ColumnDef<GetStartedCard>[] = [
  { accessorKey: "id", header: "Id" },
  {
    accessorKey: "milestone",
    header: "Milestone",
    cell: ({ row }) => {
      const milestone = row.original.milestone;
      return `${milestone}. ${MILESTONE_LABELS[milestone - 1] ?? ""}`;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.type;
      if (type === "steps") return "Steps (seeded)";
      return (
        GET_STARTED_CARD_TYPE_LABELS[type as GetStartedCardType] ?? type
      );
    },
  },
  { accessorKey: "title", header: "Title" },
  {
    accessorKey: "url",
    header: "URL",
    cell: ({ row }) => (
      <span className="block max-w-[220px] truncate text-[#697288]">
        {row.original.url ?? "—"}
      </span>
    ),
  },
  { accessorKey: "order", header: "Order" },
];

const EMPTY_FORM: FormValues = {
  milestone: 1,
  type: "paragraph",
  title: "",
  body: "",
  url: "",
  order: 1,
};

export default function GetStartedCardsTable({
  data,
}: {
  data: GetStartedCard[];
}) {
  const [open, setOpen] = useState(false);
  const [openEditCard, setOpenEditCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<GetStartedCard | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  /** Next free order slot within a milestone — cards are ordered per milestone. */
  const nextOrder = (milestone: number) =>
    data
      .filter((card) => card.milestone === milestone)
      .reduce((acc, card) => (card.order > acc ? card.order : acc), 0) + 1;

  const form = useForm<FormValues>({
    resolver: zodResolver(getStartedCardFormSchema),
    defaultValues: { ...EMPTY_FORM, order: nextOrder(1) },
  });

  // "paragraph" cards are text-only; image/video need a url.
  const type = form.watch("type");
  const needsUrl = type === "image" || type === "video";

  async function onSubmit(values: FormValues) {
    await createGetStartedCard(values);
    setOpen(false);
    form.reset({ ...EMPTY_FORM, order: nextOrder(values.milestone) });
  }

  async function onSubmitUpdate(values: FormValues) {
    if (selectedCard) {
      await updateGetStartedCard(selectedCard.id, values);
      setSelectedCard(null);
      setOpenEditCard(false);
    }
  }

  const fields = (
    <>
      <FormField
        control={form.control}
        name="milestone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Milestone</FormLabel>
            <Select
              value={field.value?.toString()}
              onValueChange={(value) => {
                const milestone = parseInt(value);
                field.onChange(milestone);
                form.setValue("order", nextOrder(milestone));
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a milestone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {MILESTONE_NUMBERS.map((milestone) => (
                  <SelectItem key={milestone} value={milestone.toString()}>
                    {milestone}. {MILESTONE_LABELS[milestone - 1]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Type</FormLabel>
            <Select
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                form.setValue("url", "");
              }}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {GET_STARTED_CARD_TYPES.map((cardType) => (
                  <SelectItem key={cardType} value={cardType}>
                    {GET_STARTED_CARD_TYPE_LABELS[cardType]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="title"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {needsUrl && (
        <FormField
          name="url"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{type === "image" ? "Image URL" : "Video URL"}</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
              {type === "video" && (
                <FormDescription>
                  YouTube, Vimeo or a direct video file link — the player is
                  picked automatically from the URL.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <FormField
        name="body"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Text</FormLabel>
            <FormControl>
              <Textarea rows={6} {...field} value={field.value ?? ""} />
            </FormControl>
            <FormDescription>
              Shown on the card. Optional for image and video cards.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        name="order"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Order</FormLabel>
            <FormControl>
              <Input
                type="number"
                {...field}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </FormControl>
            <FormDescription>
              Position within the milestone — lower shows first.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );

  return (
    <div>
      <h3 className="w-full flex justify-between items-center font-semibold text-2xl text-[#111827] mb-5">
        Instructions Cards
        <Sheet
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            form.reset();
          }}
        >
          <SheetTrigger asChild>
            <Button
              className="cursor-pointer "
              onClick={() => form.reset({ ...EMPTY_FORM, order: nextOrder(1) })}
            >
              Add Card
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Card</SheetTitle>
            </SheetHeader>
            <div className="h-full flex flex-col gap-8 overflow-auto">
              <Form {...form}>
                <form
                  className="space-y-8 p-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {fields}
                  <div className="flex ">
                    <Button type="submit" className="cursor-pointer ml-auto">
                      Create
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </h3>

      <div className="overflow-hidden rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
                <TableHead />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                // The "steps" card is generated by prisma/seedSteps.ts and its
                // per-item reviews are milestone progress — never editable here.
                const isSeeded = row.original.type === "steps";

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size={"icon"}
                            className="h-8 w-8 p-0"
                          >
                            <EllipsisVerticalIcon size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          {isSeeded ? (
                            <DropdownMenuItem disabled>
                              Managed by seed
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                                setOpenEditCard(true);
                                setSelectedCard(row.original);
                                form.reset({
                                  milestone: row.original.milestone,
                                  type: row.original
                                    .type as GetStartedCardType,
                                  title: row.original.title,
                                  body: row.original.body || "",
                                  url: row.original.url || "",
                                  order: row.original.order,
                                });
                              }}
                            >
                              Edit Card
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet
        open={openEditCard}
        onOpenChange={(open) => {
          setOpenEditCard(open);
          if (!open) setSelectedCard(null);
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit Card</SheetTitle>
          </SheetHeader>
          <div className="h-full flex flex-col gap-8 overflow-auto">
            <Form {...form}>
              <form
                className="space-y-8 p-4"
                onSubmit={form.handleSubmit(onSubmitUpdate)}
              >
                {fields}
                <div className="flex ">
                  <Button type="submit" className="cursor-pointer ml-auto">
                    Update
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

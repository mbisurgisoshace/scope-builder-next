"use client";

import { CalendarIcon } from "lucide-react";
import { Participant } from "@/lib/generated/prisma";
import {
  createParticipantTag,
  updateParticipant,
} from "@/services/participants";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { participantFormSchema } from "@/schemas/participant";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { getSegments } from "@/services/segments";
import { MultiSelect } from "@/components/ui/multiselect";

const ROLE_OPTIONS = [
  { value: "End-User", label: "End-User" },
  { value: "Buyer-Decision-Maker", label: "Buyer/Decision Maker" },
  { value: "Payer", label: "Payer" },
  { value: "Influencer", label: "Influencer" },
  { value: "Recommender", label: "Recommender" },
  { value: "Saboteur", label: "Saboteur" },
];

interface EditParticipantFormProps {
  participant: Participant;
  tags: string[];
  onSuccess?: () => void;
}

export default function EditParticipantForm({
  participant,
  tags,
  onSuccess,
}: EditParticipantFormProps) {
  const [marketSegments, setMarketSegments] = useState<any[]>([]);

  const getMarketSegments = async () => {
    const segments = await getSegments();
    setMarketSegments(segments);
  };

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: participant.name,
      role: participant.role || "",
      contact_info: participant.contact_info || "",
      rationale: participant.rationale || "",
      market_segment: participant.market_segment || "",
      blocking_issues: participant.blocking_issues || "",
      hypothesis_to_validate: participant.hypothesis_to_validate || "",
      learnings: participant.learnings || "",
      status: participant.status || "need_to_schedule",
      scheduled_date: participant.scheduled_date || undefined,
      notes: participant.notes || "",
      tags: participant.tags || "",
      job_title: participant.job_title || "",
    },
  });

  async function onSubmit(values: z.infer<typeof participantFormSchema>) {
    await updateParticipant(participant.id, values);
    onSuccess?.();
  }

  async function onCreateTagOption(opt: string) {
    await createParticipantTag(opt);
  }

  return (
    <div className="h-full flex flex-col gap-8 overflow-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 p-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={ROLE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a role"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="need_to_schedule">
                      Need to Schedule
                    </SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="not_available">Not Available</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="market_segment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market Segment</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a market segment" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {marketSegments.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        No segments available
                      </div>
                    ) : (
                      marketSegments.map((segment) => (
                        <SelectGroup key={segment.title}>
                          <SelectLabel>{segment.title}</SelectLabel>
                          {segment.data
                            .filter(
                              (s: any) => s.cardTitle?.trim().length > 0,
                            )
                            .map((s: any) => (
                              <SelectItem key={s.id} value={s.cardTitle}>
                                {s.cardTitle}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Info</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={tags.map((tag) => ({ value: tag, label: tag }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or create a tag"
                    onCreateOption={(opt) => onCreateTagOption(opt.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex">
            <Button
              type="submit"
              className="bg-[#162A4F] cursor-pointer ml-auto"
            >
              Update
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

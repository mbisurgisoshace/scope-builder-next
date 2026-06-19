"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  bookingLinkFormSchema,
  BookingLinkFormValues,
} from "@/schemas/officeHours";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface BookingLinkPopoverProps {
  subSlotId: string;
  mentorName: string;
  mode: "book" | "manage";
  currentLink?: string | null;
  disabled?: boolean;
  onBook: (subSlotId: string, meetingLink: string) => Promise<void>;
  onUpdateLink: (subSlotId: string, meetingLink: string) => Promise<void>;
  onCancel: (subSlotId: string) => Promise<void>;
}

export default function BookingLinkPopover({
  subSlotId,
  mentorName,
  mode,
  currentLink,
  disabled,
  onBook,
  onUpdateLink,
  onCancel,
}: BookingLinkPopoverProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BookingLinkFormValues>({
    resolver: zodResolver(bookingLinkFormSchema),
    mode: "onChange",
    defaultValues: { meetingLink: currentLink ?? "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ meetingLink: currentLink ?? "" });
      setError(null);
    }
  }, [open, currentLink, form]);

  const avatarClassName = `w-9 h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors ${
    disabled
      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
      : mode === "manage"
        ? "bg-[#6A35FF] text-white border-[#6A35FF] hover:bg-[#5520e0]"
        : "bg-white text-gray-600 border-gray-300 hover:border-[#6A35FF] hover:text-[#6A35FF]"
  }`;

  if (disabled) {
    return (
      <button disabled title={mentorName} className={avatarClassName}>
        {getInitials(mentorName)}
      </button>
    );
  }

  async function onSubmit(values: BookingLinkFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === "manage") {
        await onUpdateLink(subSlotId, values.meetingLink);
      } else {
        await onBook(subSlotId, values.meetingLink);
      }
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelBooking() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onCancel(subSlotId);
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button title={mentorName} className={avatarClassName}>
          {getInitials(mentorName)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="center">
        <div>
          <p className="font-bold text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-500">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              Submit a meeting link to the instructor
            </p>
            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Paste link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              {mode === "manage" && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={!form.formState.isValid || isSubmitting}
              >
                {mode === "manage" ? "Update" : "Sign Up"}
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}

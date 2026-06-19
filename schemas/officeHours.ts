import z from "zod";

export const bookingLinkFormSchema = z.object({
  meetingLink: z.string().url("Enter a valid URL."),
});

export type BookingLinkFormValues = z.infer<typeof bookingLinkFormSchema>;

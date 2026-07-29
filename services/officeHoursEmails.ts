import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { sendEmail, type MailjetRecipient } from "@/lib/mailjet";
import {
  buildOfficeHourIcs,
  getOfficeHoursTimeZone,
  officeHourEventTitle,
  officeHourEventUid,
  slotInstant,
  type IcsMethod,
} from "@/lib/officeHoursCalendar";
import {
  bookingCancelledEmail,
  bookingConfirmationEmail,
  bookingUpdatedEmail,
  type OfficeHourEmailParams,
  type RenderedEmail,
} from "@/lib/emails/officeHourBookingEmail";

/**
 * Everything the emails need, captured up front. `cancelBooking` hard-deletes the
 * row, so cancellation has to work from a snapshot taken before the delete.
 */
export interface BookingEmailSnapshot {
  bookingId: string;
  sequence: number;
  attendeeName: string;
  attendeeEmail: string | null;
  orgId: string | null;
  meetingLink: string | null;
  mentorUserId: string;
  mentorName: string;
  slotDate: Date;
  startTime: string;
  endTime: string;
}

/**
 * Clerk org membership roles that count as "the startup team" for invites.
 * Mirrors how the Startups page counts founders (Startups.tsx).
 */
const STARTUP_MEMBER_ROLES = new Set(["org:founder", "org:member"]);

/** Loads the snapshot for a booking, or null if it no longer exists. */
export async function getBookingEmailSnapshot(
  bookingId: string,
): Promise<BookingEmailSnapshot | null> {
  const booking = await prisma.officeHourBooking.findUnique({
    where: { id: bookingId },
    include: { subSlot: { include: { slot: true } } },
  });

  if (!booking) return null;

  return {
    bookingId: booking.id,
    sequence: booking.ics_sequence,
    attendeeName: booking.user_name ?? "Participant",
    attendeeEmail: booking.user_email,
    orgId: booking.org_id,
    meetingLink: booking.meeting_link,
    mentorUserId: booking.subSlot.slot.user_id,
    mentorName: booking.subSlot.slot.mentor_name,
    slotDate: booking.subSlot.slot.date,
    startTime: booking.subSlot.start_time,
    endTime: booking.subSlot.end_time,
  };
}

/** The host's email is never persisted — only their Clerk id lives on the slot. */
async function getMentorEmail(mentorUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(mentorUserId);
    return (
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null
    );
  } catch (err) {
    console.error(
      `[office-hours-email] could not resolve mentor email for ${mentorUserId}`,
      err,
    );
    return null;
  }
}

interface StartupContext {
  name: string | null;
  /** The whole team, so the session lands on everyone's calendar. */
  recipients: MailjetRecipient[];
}

const EMPTY_STARTUP: StartupContext = { name: null, recipients: [] };

async function getStartupContext(orgId: string): Promise<StartupContext> {
  try {
    const client = await clerkClient();
    const [organization, memberships] = await Promise.all([
      client.organizations.getOrganization({ organizationId: orgId }),
      client.organizations.getOrganizationMembershipList({
        organizationId: orgId,
        limit: 100,
      }),
    ]);

    const userIds = memberships.data
      .filter((m) => STARTUP_MEMBER_ROLES.has(m.role))
      .map((m) => m.publicUserData?.userId)
      .filter((id): id is string => !!id);

    if (userIds.length === 0) {
      return { name: organization.name ?? null, recipients: [] };
    }

    // publicUserData.identifier isn't guaranteed to be an email, so resolve the
    // real addresses.
    const users = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    const recipients = users.data.flatMap<MailjetRecipient>((user) => {
      const email =
        user.primaryEmailAddress?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress;
      if (!email) return [];
      const name =
        [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined;
      return [{ Email: email, Name: name }];
    });

    return { name: organization.name ?? null, recipients };
  } catch (err) {
    console.error(
      `[office-hours-email] could not resolve startup ${orgId}`,
      err
    );
    return EMPTY_STARTUP;
  }
}

/** First occurrence wins, so the attendee keeps their own display name. */
function dedupeRecipients(recipients: MailjetRecipient[]): MailjetRecipient[] {
  const seen = new Set<string>();
  return recipients.filter((r) => {
    const key = r.Email.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function deliver(options: {
  snapshot: BookingEmailSnapshot;
  method: IcsMethod;
  sequence: number;
  render: (params: OfficeHourEmailParams) => RenderedEmail;
}): Promise<void> {
  const { snapshot, method, sequence, render } = options;

  const timeZone = getOfficeHoursTimeZone();
  const start = slotInstant(snapshot.slotDate, snapshot.startTime, timeZone);
  const end = slotInstant(snapshot.slotDate, snapshot.endTime, timeZone);

  const [mentorEmail, startup] = await Promise.all([
    getMentorEmail(snapshot.mentorUserId),
    snapshot.orgId
      ? getStartupContext(snapshot.orgId)
      : Promise.resolve(EMPTY_STARTUP),
  ]);

  const eventTitle = officeHourEventTitle(startup.name);

  const candidates: MailjetRecipient[] = [];
  if (snapshot.attendeeEmail) {
    candidates.push({
      Email: snapshot.attendeeEmail,
      Name: snapshot.attendeeName,
    });
  }
  if (mentorEmail) {
    candidates.push({ Email: mentorEmail, Name: snapshot.mentorName });
  }
  // The booker is usually a member too — dedupe handles the overlap.
  candidates.push(...startup.recipients);

  const notifyEmail = process.env.OFFICE_HOURS_NOTIFY_EMAIL?.trim();
  if (notifyEmail) {
    candidates.push({ Email: notifyEmail });
  }

  const recipients = dedupeRecipients(candidates);

  if (recipients.length === 0) {
    console.warn(
      `[office-hours-email] no recipients for booking ${snapshot.bookingId}`,
    );
    return;
  }

  const emailParams: OfficeHourEmailParams = {
    eventTitle,
    mentorName: snapshot.mentorName,
    attendeeName: snapshot.attendeeName,
    start,
    end,
    timeZone,
    meetingLink: snapshot.meetingLink,
  };
  const { subject, html, text } = render(emailParams);

  // ORGANIZER must be a real address; fall back to the configured sender so the
  // invite stays valid even when the mentor's Clerk lookup fails.
  const organizerEmail =
    mentorEmail || process.env.MAILJET_FROM_EMAIL || "no-reply@appollo.app";

  const ics = buildOfficeHourIcs({
    method,
    uid: officeHourEventUid(snapshot.bookingId),
    sequence,
    start,
    end,
    summary: eventTitle,
    description: snapshot.meetingLink
      ? `Office hours with ${snapshot.mentorName}.\nMeeting link: ${snapshot.meetingLink}`
      : `Office hours with ${snapshot.mentorName}.`,
    location: snapshot.meetingLink,
    url: snapshot.meetingLink,
    organizer: { name: snapshot.mentorName, email: organizerEmail },
    attendees: recipients.map((r) => ({ name: r.Name, email: r.Email })),
  });

  await sendEmail({
    to: recipients,
    subject,
    textPart: text,
    htmlPart: html,
    attachments: [
      {
        ContentType: `text/calendar; charset=UTF-8; method=${method}`,
        Filename: "invite.ics",
        Base64Content: Buffer.from(ics, "utf8").toString("base64"),
      },
    ],
  });
}

/** Fire-and-forget wrapper — email must never break a booking flow. */
async function safely(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error(`[office-hours-email] ${label} failed`, err);
  }
}

export async function sendBookingInvite(bookingId: string): Promise<void> {
  await safely(`invite for ${bookingId}`, async () => {
    const snapshot = await getBookingEmailSnapshot(bookingId);
    if (!snapshot) return;
    await deliver({
      snapshot,
      method: "REQUEST",
      sequence: snapshot.sequence,
      render: bookingConfirmationEmail,
    });
  });
}

export async function sendBookingUpdate(bookingId: string): Promise<void> {
  await safely(`update for ${bookingId}`, async () => {
    const snapshot = await getBookingEmailSnapshot(bookingId);

    if (!snapshot) return;
    await deliver({
      snapshot,
      method: "REQUEST",
      sequence: snapshot.sequence,
      render: bookingUpdatedEmail,
    });
  });
}

export async function sendBookingCancellation(
  snapshot: BookingEmailSnapshot,
): Promise<void> {
  await safely(`cancellation for ${snapshot.bookingId}`, async () => {
    await deliver({
      snapshot,
      method: "CANCEL",
      // The row is gone, so bump the stored sequence here.
      sequence: snapshot.sequence + 1,
      render: bookingCancelledEmail,
    });
  });
}

// lib/email.ts — Resend email utility for Klassroom
// All sends are best-effort; callers should fire-and-forget without awaiting.

import { Resend } from "resend";
import type { User } from "@/models/User";
import type { Assignment } from "@/models/Assignment";
import type { Classroom } from "@/models/Classroom";
import type { Challenge } from "@/models/Challenge";

const resend = new Resend(process.env.RESEND_API_KEY);

// Requires klassroom.cv to be verified in Resend (resend.com/domains).
const FROM = "Klassroom <notifications@klassroom.cv>";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function baseTemplate(body: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f1;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#fff;border-radius:16px;border:1px solid #e5e3de;padding:36px 36px 32px">
        <tr><td>
          <p style="margin:0 0 28px;font-size:15px;font-weight:700;letter-spacing:0.04em;color:#00897b">Klassroom</p>
          ${body}
          <hr style="margin:28px 0;border:none;border-top:1px solid #e5e3de">
          <p style="margin:0;font-size:11px;color:#aaa">You're receiving this because you opted in to email notifications.
          Log in to <a href="https://klassroom.cv" style="color:#00897b">klassroom.cv</a> to manage your preferences.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Email senders ─────────────────────────────────────────────────────────────

/** Notify a list of students that a new assignment has been posted. */
export async function sendNewAssignmentEmails(
  students: Pick<User, "email" | "name" | "emailOptIn">[],
  classroom: Pick<Classroom, "name">,
  assignment: Pick<Assignment, "title" | "description" | "dueDate">
) {
  const opted = students.filter((s) => s.emailOptIn);
  if (opted.length === 0) return;

  await Promise.allSettled(
    opted.map((student) =>
      resend.emails.send({
        from: FROM,
        to: student.email,
        subject: `New assignment: ${assignment.title} — ${classroom.name}`,
        html: baseTemplate(`
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1916">New assignment posted</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b6963">${classroom.name}</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#1a1916">${assignment.title}</p>
          ${assignment.description ? `<p style="margin:6px 0 0;font-size:14px;color:#6b6963">${assignment.description}</p>` : ""}
          <p style="margin:16px 0 0;font-size:13px;color:#6b6963">Due <strong style="color:#1a1916">${formatDate(assignment.dueDate)}</strong></p>
          <a href="https://klassroom.cv/dashboard/student"
             style="display:inline-block;margin-top:24px;padding:11px 22px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
            Open Klassroom
          </a>
        `),
      })
    )
  );
}

/** Notify a student that their submission has been graded. */
export async function sendGradedEmail(
  student: Pick<User, "email" | "name" | "emailOptIn">,
  classroom: Pick<Classroom, "name">,
  assignment: Pick<Assignment, "title">,
  grade: string,
  feedback?: string
) {
  if (!student.emailOptIn) return;

  await resend.emails.send({
    from: FROM,
    to: student.email,
    subject: `Your submission was graded — ${assignment.title}`,
    html: baseTemplate(`
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1916">Submission graded</h1>
      <p style="margin:0 0 20px;font-size:14px;color:#6b6963">${classroom.name} · ${assignment.title}</p>
      <p style="margin:0;font-size:13px;color:#6b6963;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Grade</p>
      <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#00897b">${grade}</p>
      ${feedback ? `
        <p style="margin:16px 0 4px;font-size:13px;color:#6b6963;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">Feedback</p>
        <p style="margin:0;font-size:14px;color:#1a1916;line-height:1.6">${feedback}</p>
      ` : ""}
      <a href="https://klassroom.cv/dashboard/student"
         style="display:inline-block;margin-top:24px;padding:11px 22px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
        View in Klassroom
      </a>
    `),
  }).catch(() => { /* non-fatal */ });
}

/** A student receiving an announcement email, labeled with the class(es) it covers. */
export interface AnnouncementRecipient extends Pick<User, "email" | "name" | "emailOptIn"> {
  classroomName: string; // e.g. "Javascript May Cohort" or "React April Cohort & Javascript May Cohort"
}

/** Notify students that a new announcement has been posted.
 * Recipients must already be deduplicated across classrooms — each entry gets one email. */
export async function sendAnnouncementEmails(
  recipients: AnnouncementRecipient[],
  authorName: string,
  message: string
) {
  const opted = recipients.filter((r) => r.emailOptIn);
  if (opted.length === 0) return;

  // Resend's batch endpoint takes up to 100 emails per request, which also keeps
  // large broadcasts under the per-request rate limit.
  for (let i = 0; i < opted.length; i += 100) {
    await resend.batch.send(
      opted.slice(i, i + 100).map((r) => ({
        from: FROM,
        to: r.email,
        subject: `Announcement from ${r.classroomName}`,
        html: baseTemplate(`
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1916">New announcement</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b6963">${r.classroomName} · from ${authorName}</p>
          <p style="margin:0;font-size:15px;color:#1a1916;line-height:1.65;border-left:3px solid #00897b;padding-left:14px">${message}</p>
          <a href="https://klassroom.cv/dashboard/student/announcements"
             style="display:inline-block;margin-top:24px;padding:11px 22px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
            Read in Klassroom
          </a>
        `),
      }))
    ).catch(() => { /* non-fatal */ });
  }
}

/** Alert enrolled students that a live challenge has just been posted. */
export async function sendChallengeEmail(
  students: Pick<User, "email" | "name" | "emailOptIn">[],
  classroom: Pick<Classroom, "name">,
  challenge: Pick<Challenge, "title" | "description" | "windowMinutes" | "prize">
) {
  const opted = students.filter((s) => s.emailOptIn);
  if (opted.length === 0) return;

  await Promise.allSettled(
    opted.map((student) =>
      resend.emails.send({
        from: FROM,
        to: student.email,
        subject: `⚡ Challenge posted: ${challenge.title} — ${classroom.name}`,
        html: baseTemplate(`
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1916">⚡ New challenge!</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b6963">${classroom.name}</p>
          <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#1a1916">${challenge.title}</p>
          ${challenge.description ? `<p style="margin:6px 0 0;font-size:14px;color:#6b6963;line-height:1.6">${challenge.description}</p>` : ""}
          <div style="margin:16px 0;padding:12px 16px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0">
            <p style="margin:0;font-size:13px;font-weight:600;color:#15803d">⏱ You have ${challenge.windowMinutes} minute${challenge.windowMinutes !== 1 ? "s" : ""} to submit</p>
            ${challenge.prize ? `<p style="margin:6px 0 0;font-size:13px;color:#15803d">🏆 Prize: ${challenge.prize}</p>` : ""}
          </div>
          <a href="https://klassroom.cv/dashboard/student"
             style="display:inline-block;margin-top:8px;padding:11px 22px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
            Submit now →
          </a>
        `),
      })
    )
  );
}

// scripts/broadcast.mjs — one-off email broadcast to every student in a classroom,
// regardless of emailOptIn. For occasional instructor messages only; the app's
// normal announcement emails still respect the opt-in gate.
//
// Dry run (lists recipients, sends nothing):
//   node --env-file=.env.local scripts/broadcast.mjs "JavaScript" "Subject line" "Your message here"
//
// Actually send:
//   node --env-file=.env.local scripts/broadcast.mjs "JavaScript" "Subject line" "Your message here" --send

import { MongoClient, ObjectId } from "mongodb";
import { Resend } from "resend";

const [classQuery, subject, message] = process.argv.slice(2);
const doSend = process.argv.includes("--send");

if (!classQuery || !subject || !message) {
  console.error('Usage: node --env-file=.env.local scripts/broadcast.mjs "<class name>" "<subject>" "<message>" [--send]');
  process.exit(1);
}
if (!process.env.MONGODB_URI || !process.env.RESEND_API_KEY) {
  console.error("Missing MONGODB_URI or RESEND_API_KEY — did you pass --env-file=.env.local?");
  process.exit(1);
}

const FROM = "Klassroom <notifications@klassroom.cv>";

function html(classroomName, body) {
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
          <h1 style="margin:0 0 6px;font-size:22px;font-weight:700;color:#1a1916">Message from your instructor</h1>
          <p style="margin:0 0 20px;font-size:14px;color:#6b6963">${classroomName}</p>
          <p style="margin:0;font-size:15px;color:#1a1916;line-height:1.65;border-left:3px solid #00897b;padding-left:14px">${body}</p>
          <a href="https://klassroom.cv/dashboard/student"
             style="display:inline-block;margin-top:24px;padding:11px 22px;background:#00897b;color:#fff;border-radius:10px;text-decoration:none;font-size:14px;font-weight:600">
            Open Klassroom
          </a>
          <hr style="margin:28px 0;border:none;border-top:1px solid #e5e3de">
          <p style="margin:0;font-size:11px;color:#aaa">You're receiving this one-time message because you're enrolled in
          ${classroomName} on Klassroom. To get notified about assignments and announcements, turn on email
          notifications at <a href="https://klassroom.cv" style="color:#00897b">klassroom.cv</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const client = await new MongoClient(process.env.MONGODB_URI).connect();
try {
  const db = client.db();

  // The query is a regex, so "JavaScript|React" matches multiple classes at once.
  const classrooms = await db.collection("classrooms").find({ name: { $regex: classQuery, $options: "i" } }).toArray();
  if (classrooms.length === 0) {
    console.error(`No classroom matching "${classQuery}" found.`);
    process.exit(1);
  }
  console.log(`Classrooms: ${classrooms.map((c) => c.name).join(", ")}`);

  // Union the rosters and remember which matched classes each student is in,
  // so students enrolled in more than one only get a single email.
  const classNamesByStudent = new Map();
  for (const c of classrooms) {
    for (const id of c.memberIds ?? []) {
      classNamesByStudent.set(id, [...(classNamesByStudent.get(id) ?? []), c.name]);
    }
  }
  const memberIds = [...classNamesByStudent.keys()].map((id) => new ObjectId(id));
  const students = await db.collection("users").find({ _id: { $in: memberIds }, role: "student" }).toArray();

  console.log(`${students.length} unique students:`);
  for (const s of students) {
    const classes = classNamesByStudent.get(s._id.toHexString()).join(" & ");
    console.log(`  ${s.emailOptIn ? "[opted-in]   " : "[NOT opted-in]"} ${s.name} <${s.email}> — ${classes}`);
  }

  if (!doSend) {
    console.log("\nDry run — nothing sent. Re-run with --send to deliver.");
    process.exit(0);
  }

  console.log(`\nSending "${subject}" to ${students.length} students...`);
  let ok = 0, failed = 0;
  for (const s of students) {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: s.email,
      subject,
      html: html(classNamesByStudent.get(s._id.toHexString()).join(" & "), message),
    });
    if (error) {
      failed++;
      console.error(`  FAILED ${s.email}: ${error.message}`);
    } else {
      ok++;
      console.log(`  sent   ${s.email}`);
    }
    // Resend free tier allows 2 requests/sec — stay under it.
    await new Promise((r) => setTimeout(r, 600));
  }
  console.log(`\nDone: ${ok} sent, ${failed} failed.`);
} finally {
  await client.close();
}

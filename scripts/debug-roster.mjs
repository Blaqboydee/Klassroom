// scripts/debug-roster.mjs — list every classroom with member count, and find students not in any React/JS class.
import { MongoClient } from "mongodb";

const client = await new MongoClient(process.env.MONGODB_URI).connect();
try {
  const db = client.db();

  const classrooms = await db.collection("classrooms").find({}).toArray();
  console.log("All classrooms:");
  for (const c of classrooms) {
    console.log(`  "${c.name}" code=${c.code} members=${(c.memberIds ?? []).length}`);
  }

  const enrolledIds = new Set(classrooms.flatMap((c) => c.memberIds ?? []));
  const students = await db.collection("users").find({ role: "student" }).toArray();
  const unenrolled = students.filter((s) => !enrolledIds.has(s._id.toHexString()));
  console.log(`\nStudents in users collection: ${students.length}`);
  console.log(`Students not enrolled in ANY classroom: ${unenrolled.length}`);
  for (const s of unenrolled) {
    console.log(`  ${s.name} <${s.email}>`);
  }
} finally {
  await client.close();
}

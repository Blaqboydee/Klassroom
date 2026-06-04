// lib/db.ts — MongoDB singleton client
// Uses a module-level cached promise so hot-reload in dev doesn't open new connections on every request.

import { MongoClient, ObjectId, type Db } from "mongodb";
import bcrypt from "bcryptjs";
import type { User } from "@/models/User";
import type { Classroom } from "@/models/Classroom";
import type { Assignment } from "@/models/Assignment";
import type { Submission } from "@/models/Submission";
import type { Announcement } from "@/models/Announcement";
import type { Challenge, ChallengeSubmission } from "@/models/Challenge";
import { computeStreak, type StreakResult } from "./streak";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("Missing MONGODB_URI environment variable");

// Cache the client promise on the global object in development to survive HMR.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(); // uses the DB name from the connection string
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function toId(doc: Record<string, unknown> & { _id?: unknown }) {
  const { _id, ...rest } = doc;
  return { id: (_id as ObjectId | undefined)?.toHexString() ?? "", ...rest };
}

// ─── Users ───────────────────────────────────────────────────────────────────
// Everyone is a "user" — role field separates admins from students.

export async function findUsers(filter?: { role?: "student" | "admin" }): Promise<User[]> {
  const db = await getDb();
  const query = filter?.role ? { role: filter.role } : {};
  const docs = await db.collection("users").find(query).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as User);
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as User;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne({ email: email.toLowerCase() });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as User;
}

export async function findUsersByIds(ids: string[]): Promise<User[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  const objectIds = ids.map((id) => new ObjectId(id));
  const docs = await db.collection("users").find({ _id: { $in: objectIds } }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as User);
}

export async function createUser(data: Omit<User, "id">): Promise<User> {
  const db = await getDb();
  const result = await db.collection("users").insertOne({ ...data, email: data.email.toLowerCase() });
  return { id: result.insertedId.toHexString(), ...data };
}

// Hash a plaintext password for storage.
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

// Verify a plaintext password against a stored hash. Returns the user if valid, null otherwise.
export async function verifyAdminPassword(email: string, plain: string): Promise<User | null> {
  const db = await getDb();
  const doc = await db.collection("users").findOne({ email: email.toLowerCase(), role: "admin" });
  if (!doc || !doc.passwordHash) return null;
  const ok = await bcrypt.compare(plain, doc.passwordHash as string);
  if (!ok) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as User;
}

export async function updateUser(id: string, data: Partial<Omit<User, "id">>): Promise<User | null> {
  const db = await getDb();
  const result = await db.collection("users").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as User;
}

// ─── Classrooms ──────────────────────────────────────────────────────────────

export async function findClassrooms(filter?: { adminId?: string; memberId?: string }): Promise<Classroom[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (filter?.adminId) query.adminId = filter.adminId;
  if (filter?.memberId) query.memberIds = filter.memberId; // $elemMatch via equality on array field
  const docs = await db.collection("classrooms").find(query).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom);
}

export async function findClassroomByCode(code: string): Promise<Classroom | null> {
  const db = await getDb();
  const doc = await db.collection("classrooms").findOne({ code: code.toUpperCase() });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom;
}

export async function createClassroom(data: Omit<Classroom, "id">): Promise<Classroom> {
  const db = await getDb();
  const result = await db.collection("classrooms").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function findClassroomById(id: string): Promise<Classroom | null> {
  const db = await getDb();
  const doc = await db.collection("classrooms").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom;
}

export async function addMemberToClassroom(classroomId: string, userId: string): Promise<Classroom | null> {
  const db = await getDb();
  const result = await db.collection("classrooms").findOneAndUpdate(
    { _id: new ObjectId(classroomId) },
    { $addToSet: { memberIds: userId } },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom;
}

export async function removeMemberFromClassroom(classroomId: string, userId: string): Promise<Classroom | null> {
  const db = await getDb();
  const oid = new ObjectId(classroomId);
  await db.collection("classrooms").updateOne(
    { _id: oid },
    { $pull: { memberIds: userId } } as Record<string, unknown>
  );
  const doc = await db.collection("classrooms").findOne({ _id: oid });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom;
}

export async function updateClassroom(id: string, data: Partial<Pick<Classroom, "name">>): Promise<Classroom | null> {
  const db = await getDb();
  const result = await db.collection("classrooms").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as Classroom;
}

export async function deleteClassroom(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("classrooms").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export async function findAssignments(filter?: { classroomId?: string }): Promise<Assignment[]> {
  const db = await getDb();
  const query = filter?.classroomId ? { classroomId: filter.classroomId } : {};
  const docs = await db.collection("assignments").find(query).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Assignment);
}

export async function findAssignmentsByClassroomIds(classroomIds: string[]): Promise<Assignment[]> {
  if (classroomIds.length === 0) return [];
  const db = await getDb();
  const docs = await db.collection("assignments").find({ classroomId: { $in: classroomIds } }).sort({ dueDate: 1 }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Assignment);
}

export async function findAssignmentById(id: string): Promise<Assignment | null> {
  const db = await getDb();
  const doc = await db.collection("assignments").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Assignment;
}

export async function createAssignment(data: Omit<Assignment, "id">): Promise<Assignment> {
  const db = await getDb();
  const result = await db.collection("assignments").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function updateAssignment(id: string, data: Partial<Pick<Assignment, "title" | "description" | "dueDate">>): Promise<Assignment | null> {
  const db = await getDb();
  const result = await db.collection("assignments").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as Assignment;
}

export async function deleteAssignment(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("assignments").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function findSubmissions(filter?: { studentId?: string; assignmentId?: string; assignmentIds?: string[] }): Promise<Submission[]> {
  const db = await getDb();
  const query: Record<string, unknown> = {};
  if (filter?.studentId) query.studentId = filter.studentId;
  if (filter?.assignmentId) query.assignmentId = filter.assignmentId;
  if (filter?.assignmentIds !== undefined) {
    // Empty array means "no matching assignments" — return nothing rather than scanning the whole collection.
    if (filter.assignmentIds.length === 0) return [];
    query.assignmentId = { $in: filter.assignmentIds };
  }
  const docs = await db.collection("submissions").find(query).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Submission);
}

export async function createSubmission(data: Omit<Submission, "id">): Promise<Submission> {
  const db = await getDb();
  const result = await db.collection("submissions").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function findSubmissionById(id: string): Promise<Submission | null> {
  const db = await getDb();
  const doc = await db.collection("submissions").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Submission;
}

export async function updateSubmission(id: string, data: { link?: string; grade?: string; feedback?: string }): Promise<Submission | null> {
  const db = await getDb();
  const result = await db.collection("submissions").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as Submission;
}

export async function deleteSubmission(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("submissions").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function deleteSubmissionsByAssignmentId(assignmentId: string): Promise<number> {
  const db = await getDb();
  const result = await db.collection("submissions").deleteMany({ assignmentId });
  return result.deletedCount;
}

export async function deleteSubmissionsByStudentId(studentId: string): Promise<number> {
  const db = await getDb();
  const result = await db.collection("submissions").deleteMany({ studentId });
  return result.deletedCount;
}

// Delete all assignments belonging to a classroom and return their IDs (for cascading to submissions).
export async function deleteAssignmentsByClassroomId(classroomId: string): Promise<string[]> {
  const db = await getDb();
  const assignments = await db
    .collection("assignments")
    .find({ classroomId }, { projection: { _id: 1 } })
    .toArray();
  const ids = assignments.map((a) => (a._id as ObjectId).toHexString());
  if (ids.length > 0) {
    await db.collection("assignments").deleteMany({ classroomId });
  }
  return ids;
}

// Delete all submissions for a set of assignment IDs (used after deleteAssignmentsByClassroomId).
export async function deleteSubmissionsByAssignmentIds(assignmentIds: string[]): Promise<number> {
  if (assignmentIds.length === 0) return 0;
  const db = await getDb();
  const result = await db.collection("submissions").deleteMany({ assignmentId: { $in: assignmentIds } });
  return result.deletedCount;
}

// Delete a user and cascade: remove from classroom memberIds, delete their submissions.
export async function deleteUser(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });
  if (result.deletedCount === 0) return false;
  await Promise.all([
    db.collection("classrooms").updateMany({}, { $pull: { memberIds: id } } as Record<string, unknown>),
    db.collection("submissions").deleteMany({ studentId: id }),
  ]);
  return true;
}

// Delete a classroom and cascade: delete its assignments and all related submissions.
export async function deleteClassroomCascade(id: string): Promise<boolean> {
  const db = await getDb();
  const deleted = await db.collection("classrooms").deleteOne({ _id: new ObjectId(id) });
  if (deleted.deletedCount === 0) return false;
  const assignmentIds = await deleteAssignmentsByClassroomId(id);
  await deleteSubmissionsByAssignmentIds(assignmentIds);
  return true;
}

// ─── Streaks (derived per-class, never stored) ────────────────────────────────
// A streak belongs to a (student, classroom) pair: it is computed from only that
// classroom's assignments + that student's submissions, so a miss in one class
// never touches another class's streak. See lib/streak.ts for the rules.

export interface ClassroomStreak extends StreakResult {
  classroomId: string;
  classroomName: string;
}
export interface StudentStreak extends StreakResult {
  studentId: string;
  name: string;
}

// One student's streak in each class they're enrolled in (newest class first).
export async function getStudentClassroomStreaks(
  studentId: string,
  now: Date = new Date(),
): Promise<ClassroomStreak[]> {
  const classrooms = await findClassrooms({ memberId: studentId });
  if (classrooms.length === 0) return [];

  const allAssignments = await findAssignmentsByClassroomIds(classrooms.map((c) => c.id));
  const submissions = await findSubmissions({ studentId });

  const assignmentsByClassroom = new Map<string, Assignment[]>();
  for (const a of allAssignments) {
    const list = assignmentsByClassroom.get(a.classroomId) ?? [];
    list.push(a);
    assignmentsByClassroom.set(a.classroomId, list);
  }

  return classrooms.map((c) => {
    const classAssignments = assignmentsByClassroom.get(c.id) ?? [];
    const ids = new Set(classAssignments.map((a) => a.id));
    const classSubs = submissions.filter((s) => ids.has(s.assignmentId));
    return { classroomId: c.id, classroomName: c.name, ...computeStreak(classAssignments, classSubs, now) };
  });
}

// Every member's streak within a single classroom.
export async function getClassroomStreaks(
  classroomId: string,
  now: Date = new Date(),
): Promise<StudentStreak[]> {
  const classroom = await findClassroomById(classroomId);
  if (!classroom) return [];

  const assignments = await findAssignmentsByClassroomIds([classroomId]);
  const submissions = await findSubmissions({ assignmentIds: assignments.map((a) => a.id) });
  const members = await findUsersByIds(classroom.memberIds);

  const submissionsByStudent = new Map<string, Submission[]>();
  for (const s of submissions) {
    const list = submissionsByStudent.get(s.studentId) ?? [];
    list.push(s);
    submissionsByStudent.set(s.studentId, list);
  }

  return members.map((m) => ({
    studentId: m.id,
    name: m.name,
    ...computeStreak(assignments, submissionsByStudent.get(m.id) ?? [], now),
  }));
}

// ─── Backward-compat aliases ──────────────────────────────────────────────────
// Used by /api/auth, /api/students, /api/submissions, /api/streaks routes.
export const findStudents = findUsers;
export const findStudentById = findUserById;
export const findStudentByEmail = findUserByEmail;
export const createStudent = createUser;
export const updateStudent = updateUser;

// ─── Announcements ────────────────────────────────────────────────────────────

export async function findAnnouncements(filter: { classroomIds: string[] }): Promise<Announcement[]> {
  if (filter.classroomIds.length === 0) return [];
  const db = await getDb();
  const docs = await db
    .collection("announcements")
    .find({ classroomId: { $in: filter.classroomIds } })
    .sort({ createdAt: -1 })
    .toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Announcement);
}

export async function createAnnouncement(data: Omit<Announcement, "id">): Promise<Announcement> {
  const db = await getDb();
  const result = await db.collection("announcements").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function deleteAnnouncement(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.collection("announcements").deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}

export async function deleteAnnouncementsByClassroomId(classroomId: string): Promise<number> {
  const db = await getDb();
  const result = await db.collection("announcements").deleteMany({ classroomId });
  return result.deletedCount;
}

// ─── Challenges ───────────────────────────────────────────────────────────────

export async function createChallenge(data: Omit<Challenge, "id">): Promise<Challenge> {
  const db = await getDb();
  const result = await db.collection("challenges").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function findChallenges(filter: { classroomId: string }): Promise<Challenge[]> {
  const db = await getDb();
  const docs = await db.collection("challenges").find({ classroomId: filter.classroomId }).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as Challenge);
}

export async function findChallengeById(id: string): Promise<Challenge | null> {
  const db = await getDb();
  const doc = await db.collection("challenges").findOne({ _id: new ObjectId(id) });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as Challenge;
}

export async function updateChallenge(id: string, data: Partial<Omit<Challenge, "id">>): Promise<Challenge | null> {
  const db = await getDb();
  const result = await db.collection("challenges").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: data },
    { returnDocument: "after" }
  );
  if (!result) return null;
  return toId(result as Record<string, unknown> & { _id: ObjectId }) as unknown as Challenge;
}

// ─── Challenge Submissions ────────────────────────────────────────────────────

export async function createChallengeSubmission(data: Omit<ChallengeSubmission, "id">): Promise<ChallengeSubmission> {
  const db = await getDb();
  const result = await db.collection("challengeSubmissions").insertOne(data);
  return { id: result.insertedId.toHexString(), ...data };
}

export async function findChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
  const db = await getDb();
  const docs = await db.collection("challengeSubmissions").find({ challengeId }).sort({ submittedAt: 1 }).toArray();
  return docs.map((d) => toId(d as Record<string, unknown> & { _id: ObjectId }) as unknown as ChallengeSubmission);
}

export async function findChallengeSubmissionByStudent(challengeId: string, studentId: string): Promise<ChallengeSubmission | null> {
  const db = await getDb();
  const doc = await db.collection("challengeSubmissions").findOne({ challengeId, studentId });
  if (!doc) return null;
  return toId(doc as Record<string, unknown> & { _id: ObjectId }) as unknown as ChallengeSubmission;
}

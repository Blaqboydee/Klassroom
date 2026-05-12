// lib/db.ts — MongoDB singleton client
// Uses a module-level cached promise so hot-reload in dev doesn't open new connections on every request.

import { MongoClient, ObjectId, type Db } from "mongodb";
import bcrypt from "bcryptjs";
import type { User } from "@/models/User";
import type { Classroom } from "@/models/Classroom";
import type { Assignment } from "@/models/Assignment";
import type { Submission } from "@/models/Submission";

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

export async function updateSubmission(id: string, link: string): Promise<Submission | null> {
  const db = await getDb();
  const result = await db.collection("submissions").findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { link } },
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

// ─── Backward-compat aliases ──────────────────────────────────────────────────
// Used by /api/auth, /api/students, /api/submissions, /api/streaks routes.
export const findStudents = findUsers;
export const findStudentById = findUserById;
export const findStudentByEmail = findUserByEmail;
export const createStudent = createUser;
export const updateStudent = updateUser;

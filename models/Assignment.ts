// models/Assignment.ts

export interface Assignment {
  id: string;
  classroomId: string; // which classroom this assignment belongs to
  title: string;
  description: string;
  dueDate: string;     // ISO date string e.g. "2026-04-30"
  createdAt: string;   // ISO datetime string
}

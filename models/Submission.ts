// models/Submission.ts

export interface Submission {
  id: string;
  studentId: string;
  assignmentId: string;
  link: string;       // GitHub URL, live URL, etc.
  submittedAt: string; // ISO datetime string
  isLate: boolean;
}

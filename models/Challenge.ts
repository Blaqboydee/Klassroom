// models/Challenge.ts

export type ChallengeStatus = "active" | "closed";

export interface Challenge {
  id: string;
  classroomId: string;
  adminId: string;
  title: string;
  description: string;
  windowMinutes: number;        // how long the challenge is open
  status: ChallengeStatus;
  createdAt: string;            // ISO datetime
  closedAt?: string;            // ISO datetime — set when admin closes or window expires
  winnerId?: string;            // userId of the declared winner
  winnerName?: string;
  prize?: string;               // optional prize description set by admin
}

export interface ChallengeSubmission {
  id: string;
  challengeId: string;
  studentId: string;
  studentName: string;
  link: string;
  submittedAt: string;          // ISO datetime — used for "fastest" ranking
}

// models/Announcement.ts

export interface Announcement {
  id: string;
  classroomId: string;
  authorId: string;    // instructor user id
  authorName: string;
  message: string;
  createdAt: string;   // ISO datetime string
}

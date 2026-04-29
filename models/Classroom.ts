// models/Classroom.ts

export interface Classroom {
  id: string;
  name: string;
  code: string;        // 6-char uppercase alphanumeric join code, e.g. "XK29TM"
  adminId: string;     // userId of the instructor who created this classroom
  memberIds: string[]; // userIds of enrolled students
  createdAt: string;   // ISO datetime string
}

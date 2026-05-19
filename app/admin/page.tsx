// Admin Dashboard — view all students, submissions, and streaks

const mockStudents = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex@school.edu",
    streak: 5,
    lastSubmissionDate: "2026-04-28",
    submissions: { "1": true, "2": false, "3": true },
  },
  {
    id: "2",
    name: "Maria Garcia",
    email: "maria@school.edu",
    streak: 12,
    lastSubmissionDate: "2026-04-28",
    submissions: { "1": true, "2": true, "3": true },
  },
  {
    id: "3",
    name: "James Lee",
    email: "james@school.edu",
    streak: 0,
    lastSubmissionDate: "2026-04-20",
    submissions: { "1": false, "2": false, "3": false },
  },
  {
    id: "4",
    name: "Priya Patel",
    email: "priya@school.edu",
    streak: 3,
    lastSubmissionDate: "2026-04-27",
    submissions: { "1": true, "2": false, "3": true },
  },
];

const mockAssignments = [
  { id: "1", title: "Build a REST API", dueDate: "2026-04-30" },
  { id: "2", title: "React Component Library", dueDate: "2026-05-05" },
  { id: "3", title: "Database Schema Design", dueDate: "2026-04-25" },
];

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-6">
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Admin Dashboard
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Instructor view — monitor all students
            </p>
          </div>
          <a
            href="/live"
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Open Live Board →
          </a>
        </div>

        {/* Create Assignment */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white mb-4">
            Create Assignment
          </h2>
          <form className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Title"
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <input
                type="date"
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>
            <textarea
              placeholder="Description"
              rows={2}
              className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        </div>

        {/* Student Submission Matrix */}
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-700">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">
              Submission Overview
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50">
                <tr>
                  <th className="text-left px-5 py-3 font-sm text-zinc-500 dark:text-zinc-400">
                    Student
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Streak
                  </th>
                  <th className="text-center px-3 py-3 font-medium text-zinc-500 dark:text-zinc-400">
                    Last Active
                  </th>
                  {mockAssignments.map((a) => (
                    <th
                      key={a.id}
                      className="text-center px-3 py-3 font-medium text-zinc-500 dark:text-zinc-400 max-w-[120px]"
                    >
                      <span className="truncate block">{a.title}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                {mockStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-700/30 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-zinc-900 dark:text-white">
                        {s.name}
                      </p>
                      <p className="text-xs text-zinc-400">{s.email}</p>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`font-bold ${
                          s.streak > 0
                            ? "text-orange-500"
                            : "text-zinc-300 dark:text-zinc-600"
                        }`}
                      >
                        🔥 {s.streak}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center text-xs text-zinc-400">
                      {s.lastSubmissionDate}
                    </td>
                    {mockAssignments.map((a) => (
                      <td key={a.id} className="px-3 py-3 text-center">
                        {s.submissions[a.id as keyof typeof s.submissions] ? (
                          <span className="inline-block w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 text-xs leading-5">
                            ✓
                          </span>
                        ) : (
                          <span className="inline-block w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-400 text-xs leading-5">
                            –
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live Class Board — auto-refreshing view for classroom display
// Polls every 5 seconds in real implementation (polling wired to API)

const mockStudents = [
  {
    id: "1",
    name: "Alex Johnson",
    streak: 5,
    submitted: true,
    submittedAt: "2026-04-28T09:14:00Z",
    isLate: false,
  },
  {
    id: "2",
    name: "Maria Garcia",
    streak: 12,
    submitted: true,
    submittedAt: "2026-04-28T08:55:00Z",
    isLate: false,
  },
  {
    id: "3",
    name: "James Lee",
    streak: 0,
    submitted: false,
    submittedAt: null,
    isLate: false,
  },
  {
    id: "4",
    name: "Priya Patel",
    streak: 3,
    submitted: true,
    submittedAt: "2026-04-28T10:02:00Z",
    isLate: false,
  },
  {
    id: "5",
    name: "Carlos Ruiz",
    streak: 0,
    submitted: false,
    submittedAt: null,
    isLate: false,
  },
  {
    id: "6",
    name: "Sophie Turner",
    streak: 7,
    submitted: true,
    submittedAt: "2026-04-28T07:40:00Z",
    isLate: false,
  },
];

const submitted = mockStudents.filter((s) => s.submitted).length;
const total = mockStudents.length;

export default function LiveBoardPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">
            📋 Live Class Board
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Assignment: <span className="text-white font-medium">Build a REST API</span>
            &nbsp;·&nbsp;Due Apr 30, 2026
          </p>
        </div>
        <div className="text-right">
          <p className="text-4xl font-black text-white">
            {submitted}
            <span className="text-zinc-500 text-2xl font-normal">/{total}</span>
          </p>
          <p className="text-xs text-zinc-400 uppercase tracking-widest mt-0.5">
            Submitted
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full transition-all duration-500"
          style={{ width: `${(submitted / total) * 100}%` }}
        />
      </div>

      {/* Student grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockStudents.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl p-5 flex flex-col gap-2 border transition-all ${
              s.submitted
                ? "bg-green-900/30 border-green-700"
                : "bg-zinc-800 border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <p className="font-semibold text-base leading-tight">{s.name}</p>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  s.submitted
                    ? "bg-green-700/50 text-green-300"
                    : "bg-zinc-700 text-zinc-400"
                }`}
              >
                {s.submitted ? "✓" : "–"}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <span
                className={`font-bold ${
                  s.streak > 0 ? "text-orange-400" : "text-zinc-600"
                }`}
              >
                🔥 {s.streak}
              </span>
              <span className="text-zinc-500 text-xs">streak</span>
            </div>

            {s.submittedAt && (
              <p className="text-xs text-zinc-500">
                {new Date(s.submittedAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Poll indicator */}
      <p className="text-xs text-zinc-600 text-center">
        Refreshes every 5 seconds · Last updated just now
      </p>
    </div>
  );
}

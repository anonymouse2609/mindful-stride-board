import { BarChart3, CheckCircle2, Flame, Target } from "lucide-react";

const HABITS_KEY = "dashboard-habits";
const TODOS_KEY = "dashboard-todos";

function getWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0];
}

function getHabitStats(): { total: number; completed: number; habits: number } {
  try {
    const raw = localStorage.getItem(HABITS_KEY);
    if (!raw) return { total: 0, completed: 0, habits: 0 };
    const data = JSON.parse(raw);
    if (data.week !== getWeekKey()) return { total: 0, completed: 0, habits: 0 };
    const habits = data.habits as string[];
    let completed = 0;
    let total = 0;
    habits.forEach((h: string) => {
      const arr = (data.grid[h] || []) as boolean[];
      arr.forEach((v: boolean) => { total++; if (v) completed++; });
    });
    return { total, completed, habits: habits.length };
  } catch { return { total: 0, completed: 0, habits: 0 }; }
}

function getTodoStats(): { total: number; done: number } {
  try {
    const raw = localStorage.getItem(TODOS_KEY);
    if (!raw) return { total: 0, done: 0 };
    const data = JSON.parse(raw);
    const todos = data.todos || [];
    return { total: todos.length, done: todos.filter((t: any) => t.done).length };
  } catch { return { total: 0, done: 0 }; }
}

export default function WeeklyProgress() {
  const habits = getHabitStats();
  const todos = getTodoStats();
  const habitPct = habits.total > 0 ? Math.round((habits.completed / habits.total) * 100) : 0;
  const todoPct = todos.total > 0 ? Math.round((todos.done / todos.total) * 100) : 0;

  const stats = [
    {
      icon: <Flame className="w-5 h-5" />,
      label: "Habits Completed",
      value: `${habits.completed}/${habits.total}`,
      pct: habitPct,
      color: "hsl(var(--habits-accent))",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5" />,
      label: "Tasks Done Today",
      value: `${todos.done}/${todos.total}`,
      pct: todoPct,
      color: "hsl(var(--accent))",
    },
    {
      icon: <Target className="w-5 h-5" />,
      label: "Tracked Habits",
      value: `${habits.habits}`,
      pct: null,
      color: "hsl(var(--goals-accent))",
    },
  ];

  return (
    <div className="section-card section-weekly" style={{ animation: "fade-in 0.4s ease-out 0.4s forwards", opacity: "0" } as React.CSSProperties & Record<string, string>}>
      <h2 className="text-[18px] font-semibold section-title-weekly flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-xl bg-goals/15 flex items-center justify-center">
          <BarChart3 className="w-[22px] h-[22px] text-goals" />
        </div>
        Weekly Progress
      </h2>

      <div className="grid grid-cols-3 gap-4 sm:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2" style={{ color: s.color }}>
              {s.icon}
              <span className="text-sm hidden sm:inline text-muted-foreground">{s.label}</span>
              <span className="text-sm sm:hidden text-muted-foreground">{s.label.split(" ")[0]}</span>
            </div>
            <span className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: s.color }}>{s.value}</span>
            {s.pct !== null && (
              <div className="w-full h-2 sm:h-2.5 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

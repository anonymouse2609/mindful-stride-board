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
      icon: <Flame className="w-4 h-4" />,
      label: "Habits Completed",
      value: `${habits.completed}/${habits.total}`,
      pct: habitPct,
    },
    {
      icon: <CheckCircle2 className="w-4 h-4" />,
      label: "Tasks Done Today",
      value: `${todos.done}/${todos.total}`,
      pct: todoPct,
    },
    {
      icon: <Target className="w-4 h-4" />,
      label: "Tracked Habits",
      value: `${habits.habits}`,
      pct: null,
    },
  ];

  return (
    <div className="glass-card p-5" style={{ animation: "fade-in 0.4s ease-out 0.4s forwards", opacity: 0 }}>
      <h2 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        Weekly Progress
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              {s.icon}
              <span className="text-xs">{s.label}</span>
            </div>
            <span className="text-2xl font-semibold text-foreground tracking-tight">{s.value}</span>
            {s.pct !== null && (
              <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-700"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

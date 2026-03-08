import { useState, useEffect } from "react";
import { Target } from "lucide-react";

const STORAGE_KEY = "dashboard-daily-goals";
const todayKey = () => new Date().toISOString().split("T")[0];

function loadGoals(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return ["", "", ""];
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return ["", "", ""];
    return data.goals || ["", "", ""];
  } catch { return ["", "", ""]; }
}

function saveGoals(goals: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), goals }));
}

export default function DailyGoals() {
  const [goals, setGoals] = useState<string[]>(loadGoals);

  useEffect(() => { saveGoals(goals); }, [goals]);

  const updateGoal = (idx: number, value: string) => {
    const next = [...goals];
    next[idx] = value;
    setGoals(next);
  };

  const filledCount = goals.filter((g) => g.trim()).length;

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3" style={{ animation: "fade-in 0.4s ease-out 0.15s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground flex items-center gap-1.5">
          <Target className="w-4 h-4 text-muted-foreground" />
          Today's Goals
        </h2>
        <span className="text-[11px] font-mono text-muted-foreground">{filledCount}/3</span>
      </div>

      <div className="flex flex-col gap-2">
        {goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-accent text-xs font-medium w-4 text-center shrink-0">{i + 1}</span>
            <input
              value={goal}
              onChange={(e) => updateGoal(i, e.target.value)}
              placeholder={`Goal ${i + 1}`}
              className="flex-1 min-w-0 bg-transparent border-b border-border/60 px-1 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
        ))}
      </div>

      {filledCount === 3 && (
        <p className="text-[11px] text-accent text-center animate-fade-in">
          All goals set — make it happen ✨
        </p>
      )}
    </div>
  );
}

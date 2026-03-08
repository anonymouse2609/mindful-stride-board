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
    <div className="glass-card p-6 flex flex-col gap-4" style={{ animation: "fade-in 0.6s ease-out 0.15s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Today's Goals
        </h2>
        <span className="text-xs font-mono text-muted-foreground">{filledCount}/3</span>
      </div>

      <div className="flex flex-col gap-3">
        {goals.map((goal, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-primary font-bold text-sm w-5 text-center">{i + 1}</span>
            <input
              value={goal}
              onChange={(e) => updateGoal(i, e.target.value)}
              placeholder={`Goal ${i + 1}...`}
              className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
        ))}
      </div>

      {filledCount === 3 && (
        <p className="text-xs text-success text-center font-medium animate-fade-in">
          ✨ All goals set — crush it today!
        </p>
      )}
    </div>
  );
}

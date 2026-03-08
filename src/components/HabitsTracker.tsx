import { useState, useEffect } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_HABITS = ["💧 Drink water", "🏃 Exercise", "📚 Study", "😴 Sleep 7h+", "🧘 Meditate"];
const STORAGE_KEY = "dashboard-habits";

interface HabitData {
  habits: string[];
  grid: Record<string, boolean[]>; // habitName -> [mon..sun]
  week: string;
}

function getWeekKey(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return monday.toISOString().split("T")[0];
}

function getTodayIndex(): number {
  return (new Date().getDay() + 6) % 7;
}

function loadData(): HabitData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as HabitData;
      if (data.week === getWeekKey()) return data;
    }
  } catch {}
  const grid: Record<string, boolean[]> = {};
  DEFAULT_HABITS.forEach((h) => (grid[h] = Array(7).fill(false)));
  return { habits: DEFAULT_HABITS, grid, week: getWeekKey() };
}

function saveData(data: HabitData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export default function HabitsTracker() {
  const [data, setData] = useState<HabitData>(loadData);
  const [newHabit, setNewHabit] = useState("");

  useEffect(() => { saveData(data); }, [data]);

  const toggleDay = (habit: string, dayIdx: number) => {
    setData((prev) => {
      const newGrid = { ...prev.grid };
      const arr = [...(newGrid[habit] || Array(7).fill(false))];
      arr[dayIdx] = !arr[dayIdx];
      newGrid[habit] = arr;
      return { ...prev, grid: newGrid };
    });
  };

  const addHabit = () => {
    if (!newHabit.trim() || data.habits.includes(newHabit.trim())) return;
    const name = newHabit.trim();
    setData((prev) => ({
      ...prev,
      habits: [...prev.habits, name],
      grid: { ...prev.grid, [name]: Array(7).fill(false) },
    }));
    setNewHabit("");
  };

  const removeHabit = (habit: string) => {
    setData((prev) => {
      const newGrid = { ...prev.grid };
      delete newGrid[habit];
      return { ...prev, habits: prev.habits.filter((h) => h !== habit), grid: newGrid };
    });
  };

  const todayIdx = getTodayIndex();

  return (
    <div className="glass-card p-6 flex flex-col gap-4" style={{ animation: "fade-in 0.6s ease-out 0.3s forwards", opacity: 0 }}>
      <h2 className="text-lg font-semibold text-foreground">Habits This Week</h2>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-medium pb-2 pr-4 min-w-[140px]">Habit</th>
              {DAYS.map((d, i) => (
                <th
                  key={d}
                  className={`text-center font-medium pb-2 px-1 min-w-[36px] ${
                    i === todayIdx ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {d}
                </th>
              ))}
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {data.habits.map((habit) => {
              const completed = (data.grid[habit] || []).filter(Boolean).length;
              return (
                <tr key={habit} className="group">
                  <td className="py-1.5 pr-4 text-foreground text-xs truncate max-w-[140px]">{habit}</td>
                  {DAYS.map((_, i) => {
                    const checked = data.grid[habit]?.[i] || false;
                    return (
                      <td key={i} className="text-center py-1.5 px-1">
                        <button
                          onClick={() => toggleDay(habit, i)}
                          className={`w-7 h-7 rounded-md transition-all ${
                            checked
                              ? "bg-success/80 shadow-[0_0_8px_hsl(var(--success)/0.3)]"
                              : i === todayIdx
                              ? "bg-secondary border border-primary/30 hover:bg-primary/20"
                              : "bg-secondary/50 hover:bg-secondary"
                          } ${checked ? "animate-check-pop" : ""}`}
                        >
                          {checked && <span className="text-xs">✓</span>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="py-1.5 pl-2">
                    <span className="text-[10px] text-muted-foreground">{completed}/7</span>
                    <button
                      onClick={() => removeHabit(habit)}
                      className="ml-1 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all text-xs"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-1">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="Add habit..."
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={addHabit}
          className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:opacity-80 transition-opacity"
        >
          Add
        </button>
      </div>
    </div>
  );
}

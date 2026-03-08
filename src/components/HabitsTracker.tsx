import { useState, useEffect } from "react";
import { Check } from "lucide-react";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const DEFAULT_HABITS = ["💧 Drink water", "🏃 Exercise", "📚 Study", "😴 Sleep 7h+", "🧘 Meditate"];
const STORAGE_KEY = "dashboard-habits";

interface HabitData {
  habits: string[];
  grid: Record<string, boolean[]>;
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
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-3" style={{ animation: "fade-in 0.4s ease-out 0.3s forwards", opacity: 0 }}>
      <h2 className="text-sm font-medium text-foreground">Habits</h2>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-xs min-w-[320px]">
          <thead>
            <tr>
              <th className="text-left text-muted-foreground font-normal pb-2 pr-2 sm:pr-3 min-w-[90px] sm:min-w-[120px]"></th>
              {DAYS.map((d, i) => (
                <th
                  key={i}
                  className={`text-center font-normal pb-2 px-0.5 sm:px-1 ${
                    i === todayIdx ? "text-accent" : "text-muted-foreground"
                  }`}
                >
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.habits.map((habit) => (
              <tr key={habit} className="group">
                <td className="py-1 pr-2 sm:pr-3 text-foreground/80 text-[11px] sm:text-xs">
                  <div className="flex items-center justify-between gap-1 max-w-[90px] sm:max-w-[120px]">
                    <span className="truncate">{habit}</span>
                    <button
                      onClick={() => removeHabit(habit)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-[10px] shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {DAYS.map((_, i) => {
                  const checked = data.grid[habit]?.[i] || false;
                  return (
                    <td key={i} className="text-center py-1 px-0.5">
                      <button
                        onClick={() => toggleDay(habit, i)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md flex items-center justify-center mx-auto transition-all ${
                          checked
                            ? "bg-accent/20 text-accent"
                            : i === todayIdx
                            ? "bg-secondary/80 hover:bg-accent/10"
                            : "bg-secondary/40 hover:bg-secondary/70"
                        } ${checked ? "animate-check-pop" : ""}`}
                      >
                        {checked && <Check className="w-3 h-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addHabit()}
          placeholder="Add habit..."
          className="flex-1 min-w-0 bg-secondary/50 border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <button
          onClick={addHabit}
          className="px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs hover:text-foreground transition-colors shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Check, Flame } from "lucide-react";

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
    <div className="section-card section-habits flex flex-col gap-4" style={{ animation: "fade-in 0.4s ease-out 0.3s forwards", opacity: 0 }}>
      <h2 className="text-[18px] font-semibold section-title-habits flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-habits/15 flex items-center justify-center">
          <Flame className="w-[22px] h-[22px] text-habits" />
        </div>
        Habits
      </h2>

      <div className="-mx-1 overflow-x-auto">
        <table className="w-full text-sm min-w-[340px]">
          <thead>
            <tr>
              <th className="text-left font-normal pb-3 pr-3 min-w-[100px] sm:min-w-[140px]"></th>
              {DAYS.map((d, i) => (
                <th
                  key={i}
                  className={`text-center font-bold pb-3 px-1 ${
                    i === todayIdx ? "text-habits" : "text-white/70"
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
                <td className="py-1.5 pr-3 text-[15px] font-semibold text-white">
                  <div className="flex items-center justify-between gap-2 max-w-[100px] sm:max-w-[140px]">
                    <span className="truncate">{habit}</span>
                    <button
                      onClick={() => removeHabit(habit)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all text-sm shrink-0"
                    >
                      ×
                    </button>
                  </div>
                </td>
                {DAYS.map((_, i) => {
                  const checked = data.grid[habit]?.[i] || false;
                  return (
                     <td key={i} className="text-center py-1.5 px-0.5">
                      <button
                        onClick={() => toggleDay(habit, i)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mx-auto transition-all ${
                          checked
                            ? "bg-habits text-white"
                            : i === todayIdx
                            ? "border-2 border-white/40 bg-transparent hover:bg-habits/20"
                            : "border-2 border-white/25 bg-transparent hover:border-white/40"
                        } ${checked ? "animate-check-pop" : ""}`}
                      >
                        {checked && <Check className="w-4 h-4" />}
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
          className="input-styled flex-1 min-w-0"
        />
        <button
          onClick={addHabit}
          className="btn-primary bg-white text-habits border border-white/80 hover:bg-white/90 shrink-0 font-bold"
        >
          Add
        </button>
      </div>
    </div>
  );
}

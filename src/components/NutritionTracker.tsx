import { useState, useEffect } from "react";
import { Plus, Trash2, Settings2, RotateCcw, Search, X } from "lucide-react";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface LogEntry {
  id: string;
  food: FoodItem;
  grams: number;
}

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const FOODS: FoodItem[] = [
  { name: "Toor Dal (cooked)", calories: 128, protein: 7.5, carbs: 21, fat: 0.6, fiber: 5 },
  { name: "Moong Dal (cooked)", calories: 105, protein: 7, carbs: 18, fat: 0.4, fiber: 4.5 },
  { name: "Masoor Dal (cooked)", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 4 },
  { name: "Chana Dal (cooked)", calories: 164, protein: 8.5, carbs: 27, fat: 2.7, fiber: 5 },
  { name: "Urad Dal (cooked)", calories: 105, protein: 7.5, carbs: 15, fat: 1.5, fiber: 4 },
  { name: "Rajma (cooked)", calories: 127, protein: 8.7, carbs: 22, fat: 0.5, fiber: 6.4 },
  { name: "Chana / Chickpeas (cooked)", calories: 164, protein: 8.9, carbs: 27, fat: 2.6, fiber: 7.6 },
  { name: "Steamed Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 },
  { name: "Jeera Rice", calories: 155, protein: 3, carbs: 28, fat: 3.5, fiber: 0.5 },
  { name: "Roti (wheat)", calories: 297, protein: 9, carbs: 56, fat: 3.5, fiber: 4 },
  { name: "Paratha (plain)", calories: 326, protein: 8, carbs: 45, fat: 13, fiber: 3.5 },
  { name: "Puri", calories: 350, protein: 7, carbs: 45, fat: 16, fiber: 2.5 },
  { name: "Naan", calories: 290, protein: 8.5, carbs: 50, fat: 5.5, fiber: 2 },
  { name: "Paneer", calories: 265, protein: 18, carbs: 1.2, fat: 21, fiber: 0 },
  { name: "Paneer Bhurji", calories: 220, protein: 15, carbs: 4, fat: 16, fiber: 0.5 },
  { name: "Palak Paneer", calories: 170, protein: 10, carbs: 6, fat: 12, fiber: 2 },
  { name: "Shahi Paneer", calories: 200, protein: 11, carbs: 8, fat: 14, fiber: 1 },
  { name: "Matar Paneer", calories: 180, protein: 10, carbs: 10, fat: 12, fiber: 3 },
  { name: "Poha", calories: 130, protein: 2.5, carbs: 24, fat: 2.8, fiber: 1.2 },
  { name: "Upma", calories: 120, protein: 3.5, carbs: 18, fat: 3.8, fiber: 1.5 },
  { name: "Sabudana Khichdi", calories: 180, protein: 3, carbs: 35, fat: 4, fiber: 0.5 },
  { name: "Dhokla", calories: 160, protein: 6, carbs: 25, fat: 4, fiber: 1.5 },
  { name: "Khandvi", calories: 145, protein: 5, carbs: 18, fat: 5.5, fiber: 1 },
  { name: "Thepla", calories: 310, protein: 8, carbs: 42, fat: 12, fiber: 4 },
  { name: "Idli", calories: 130, protein: 4, carbs: 24, fat: 1, fiber: 1.5 },
  { name: "Dosa (plain)", calories: 168, protein: 4, carbs: 28, fat: 4, fiber: 1 },
  { name: "Uttapam", calories: 155, protein: 5, carbs: 26, fat: 3.5, fiber: 1.5 },
  { name: "Sambhar", calories: 65, protein: 3, carbs: 10, fat: 1.2, fiber: 2.5 },
  { name: "Rasam", calories: 25, protein: 1, carbs: 4, fat: 0.5, fiber: 0.5 },
  { name: "Khichdi (dal rice)", calories: 120, protein: 4, carbs: 20, fat: 2, fiber: 2 },
  { name: "Curd / Yogurt", calories: 60, protein: 3.5, carbs: 5, fat: 3.3, fiber: 0 },
  { name: "Lassi (sweet)", calories: 75, protein: 3, carbs: 12, fat: 2, fiber: 0 },
  { name: "Chaas / Buttermilk", calories: 20, protein: 1.5, carbs: 2.5, fat: 0.5, fiber: 0 },
  { name: "Milk (full fat)", calories: 62, protein: 3.2, carbs: 4.8, fat: 3.3, fiber: 0 },
  { name: "Milk (toned)", calories: 45, protein: 3, carbs: 5, fat: 1.5, fiber: 0 },
  { name: "Cheese (cheddar)", calories: 402, protein: 25, carbs: 1.3, fat: 33, fiber: 0 },
  { name: "Ghee", calories: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 },
  { name: "Butter", calories: 717, protein: 0.8, carbs: 0.1, fat: 81, fiber: 0 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, fiber: 2.6 },
  { name: "Mango", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, fiber: 1.6 },
  { name: "Papaya", calories: 43, protein: 0.5, carbs: 11, fat: 0.3, fiber: 1.7 },
  { name: "Grapes", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, fiber: 0.9 },
  { name: "Watermelon", calories: 30, protein: 0.6, carbs: 7.5, fat: 0.2, fiber: 0.4 },
  { name: "Orange", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, fiber: 2.4 },
  { name: "Pomegranate", calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4 },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12.5 },
  { name: "Cashews", calories: 553, protein: 18, carbs: 30, fat: 44, fiber: 3.3 },
  { name: "Walnuts", calories: 654, protein: 15, carbs: 14, fat: 65, fiber: 6.7 },
  { name: "Peanuts", calories: 567, protein: 26, carbs: 16, fat: 49, fiber: 8.5 },
  { name: "Dry Fruit Ladoo", calories: 450, protein: 10, carbs: 40, fat: 28, fiber: 4 },
  { name: "Jalebi", calories: 370, protein: 2, carbs: 60, fat: 14, fiber: 0.5 },
  { name: "Gulab Jamun", calories: 325, protein: 5, carbs: 45, fat: 14, fiber: 0.3 },
  { name: "Rasgulla", calories: 186, protein: 5, carbs: 30, fat: 5, fiber: 0 },
  { name: "Kheer", calories: 140, protein: 4, carbs: 22, fat: 4, fiber: 0.3 },
  { name: "Shrikhand", calories: 200, protein: 5, carbs: 30, fat: 7, fiber: 0 },
  { name: "Dal Dhokli", calories: 150, protein: 5, carbs: 22, fat: 4.5, fiber: 2 },
  { name: "Pav Bhaji (no potato)", calories: 140, protein: 4, carbs: 18, fat: 6, fiber: 3 },
  { name: "Undhiyu (Jain style)", calories: 160, protein: 4, carbs: 15, fat: 9, fiber: 4 },
  { name: "Handvo", calories: 175, protein: 5, carbs: 25, fat: 6, fiber: 2.5 },
  { name: "Sev Tameta", calories: 130, protein: 3, carbs: 15, fat: 6, fiber: 2 },
  { name: "Kadhi", calories: 80, protein: 3, carbs: 8, fat: 4, fiber: 0.5 },
  { name: "Murmura / Puffed Rice", calories: 394, protein: 6, carbs: 87, fat: 1.3, fiber: 1.5 },
  { name: "Makhana / Fox Nuts", calories: 332, protein: 9.7, carbs: 77, fat: 0.1, fiber: 14.5 },
  { name: "Chapati (multigrain)", calories: 280, protein: 10, carbs: 48, fat: 5, fiber: 6 },
  { name: "Bajra Roti", calories: 295, protein: 8, carbs: 55, fat: 5, fiber: 6 },
  { name: "Jowar Roti", calories: 290, protein: 8.5, carbs: 58, fat: 3, fiber: 5 },
];

const STORAGE_KEY = "dashboard-nutrition";
const todayKey = () => new Date().toISOString().split("T")[0];

const DEFAULT_GOALS: MacroGoals = { calories: 2000, protein: 80, carbs: 250, fat: 65 };

interface StoredData {
  date: string;
  log: LogEntry[];
  goals: MacroGoals;
}

function loadData(): StoredData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredData;
      if (data.date === todayKey()) return data;
      return { date: todayKey(), log: [], goals: data.goals || DEFAULT_GOALS };
    }
  } catch {}
  return { date: todayKey(), log: [], goals: DEFAULT_GOALS };
}

function saveData(data: StoredData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive font-medium" : "text-foreground"}>
          {Math.round(current)}
          <span className="text-muted-foreground">/{goal}
            {label === "Calories" ? "" : "g"}
          </span>
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-destructive" : ""}`}
          style={{ width: `${pct}%`, backgroundColor: over ? undefined : color }}
        />
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const [data, setData] = useState<StoredData>(loadData);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [grams, setGrams] = useState("100");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [showGoals, setShowGoals] = useState(false);
  const [editGoals, setEditGoals] = useState<MacroGoals>(data.goals);

  useEffect(() => { saveData(data); }, [data]);

  const filtered = search.length > 0
    ? FOODS.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  const selectFood = (food: FoodItem) => {
    setSelected(food);
    setSearch(food.name);
    setShowDropdown(false);
  };

  const addEntry = () => {
    if (!selected || !grams) return;
    const g = parseFloat(grams);
    if (isNaN(g) || g <= 0) return;
    const entry: LogEntry = { id: Date.now().toString(), food: selected, grams: g };
    setData((prev) => ({ ...prev, log: [...prev.log, entry] }));
    setSearch("");
    setSelected(null);
    setGrams("100");
  };

  const removeEntry = (id: string) => {
    setData((prev) => ({ ...prev, log: prev.log.filter((e) => e.id !== id) }));
  };

  const resetLog = () => {
    setData((prev) => ({ ...prev, log: [] }));
  };

  const saveGoals = () => {
    setData((prev) => ({ ...prev, goals: editGoals }));
    setShowGoals(false);
  };

  const totals = data.log.reduce(
    (acc, entry) => {
      const m = entry.grams / 100;
      return {
        calories: acc.calories + entry.food.calories * m,
        protein: acc.protein + entry.food.protein * m,
        carbs: acc.carbs + entry.food.carbs * m,
        fat: acc.fat + entry.food.fat * m,
        fiber: acc.fiber + entry.food.fiber * m,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col gap-4" style={{ animation: "fade-in 0.4s ease-out 0.35s forwards", opacity: 0 }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">🥗 Nutrition Tracker</h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => { setShowGoals(!showGoals); setEditGoals(data.goals); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
            title="Set macro goals"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          {data.log.length > 0 && (
            <button
              onClick={resetLog}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary/60 transition-colors"
              title="Reset daily log"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Goals editor */}
      {showGoals && (
        <div className="bg-secondary/40 rounded-lg p-3 flex flex-col gap-2 animate-fade-in">
          <span className="text-[11px] text-muted-foreground font-medium">Daily Macro Goals</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground capitalize">{key}</label>
                <input
                  type="number"
                  value={editGoals[key]}
                  onChange={(e) => setEditGoals({ ...editGoals, [key]: Number(e.target.value) })}
                  className="bg-secondary border border-border/60 rounded-md px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40 w-full"
                />
              </div>
            ))}
          </div>
          <button
            onClick={saveGoals}
            className="self-end px-3 py-1 rounded-md bg-accent text-accent-foreground text-[11px] font-medium hover:opacity-90 transition-opacity"
          >
            Save Goals
          </button>
        </div>
      )}

      {/* Macro progress bars */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MacroBar label="Calories" current={totals.calories} goal={data.goals.calories} color="hsl(var(--accent))" />
        <MacroBar label="Protein" current={totals.protein} goal={data.goals.protein} color="hsl(200, 60%, 50%)" />
        <MacroBar label="Carbs" current={totals.carbs} goal={data.goals.carbs} color="hsl(38, 70%, 55%)" />
        <MacroBar label="Fat" current={totals.fat} goal={data.goals.fat} color="hsl(0, 60%, 55%)" />
      </div>

      {/* Fiber total */}
      <div className="text-[11px] text-muted-foreground">
        Fiber: <span className="text-foreground font-medium">{Math.round(totals.fiber)}g</span>
      </div>

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search food..."
            className="w-full bg-secondary/50 border border-border/60 rounded-lg pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
          />
          {search && (
            <button onClick={() => { setSearch(""); setSelected(null); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {showDropdown && filtered.length > 0 && !selected && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 py-1 max-h-48 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f.name}
                  onClick={() => selectFood(f)}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary/60 transition-colors flex justify-between"
                >
                  <span>{f.name}</span>
                  <span className="text-muted-foreground">{f.calories} cal</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-20 bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
              min="1"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">g</span>
          </div>
          <button
            onClick={addEntry}
            disabled={!selected}
            className="p-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Food log */}
      {data.log.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto -mx-1 px-1">
          {data.log.map((entry) => {
            const m = entry.grams / 100;
            return (
              <div key={entry.id} className="group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-foreground truncate">{entry.food.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{entry.grams}g</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {Math.round(entry.food.calories * m)} cal · {Math.round(entry.food.protein * m)}p · {Math.round(entry.food.carbs * m)}c · {Math.round(entry.food.fat * m)}f
                  </div>
                </div>
                <button
                  onClick={() => removeEntry(entry.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data.log.length === 0 && (
        <p className="text-[11px] text-muted-foreground text-center py-3">Search and add foods to start tracking</p>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings2, RotateCcw, Search, X, ChefHat, Edit2, BookOpen } from "lucide-react";
import { FOODS, UNIT_MAP, type FoodItem, type UnitInfo } from "@/data/foodDatabase";
import { loadSettings, type UserSettings } from "@/lib/utils";

interface LogEntry {
  id: string;
  food: FoodItem;
  grams: number;
  sugarFree?: boolean;
  oilFree?: boolean;
}

interface MacroGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

// FOODS and UNIT_MAP imported from @/data/foodDatabase

const STORAGE_KEY = "dashboard-nutrition";
const CUSTOM_FOODS_KEY = "custom_foods";
const RECIPES_KEY = "dashboard-recipes";
const SAVED_RECIPES_KEY = "saved_recipes";
const todayKey = () => new Date().toISOString().split("T")[0];

const DEFAULT_GOALS: MacroGoals = { calories: 2000, protein: 80, carbs: 250, fat: 65, fiber: 25, water: 8 };

interface CustomFood extends FoodItem {
  id: string;
  unitLabel?: string;
  gramsPerUnit?: number;
}

interface RecipeIngredient {
  food: FoodItem;
  grams: number;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  // per 100g macros (computed)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  totalGrams: number;
}

interface StoredData {
  date: string;
  log: LogEntry[];
  goals: MacroGoals;
}

function loadData(): StoredData {
  const settings = loadSettings();
  const goals: MacroGoals = {
    calories: settings.goals.dailyCalorieGoal,
    protein: settings.goals.proteinGoal,
    carbs: settings.goals.carbsGoal,
    fat: settings.goals.fatGoal,
    fiber: settings.goals.fiberGoal,
    water: settings.goals.waterIntakeGoal,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StoredData;
      if (data.date === todayKey()) return data;
      return { date: todayKey(), log: [], goals };
    }
  } catch {}
  return { date: todayKey(), log: [], goals };
}
function saveData(data: StoredData) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function loadCustomFoods(): CustomFood[] {
  try { const r = localStorage.getItem(CUSTOM_FOODS_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveCustomFoods(foods: CustomFood[]) { localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(foods)); }

function loadRecipes(): Recipe[] {
  try { const r = localStorage.getItem(RECIPES_KEY); return r ? JSON.parse(r) : []; } catch { return []; }
}
function saveRecipes(recipes: Recipe[]) { localStorage.setItem(RECIPES_KEY, JSON.stringify(recipes)); }

function MacroBar({ label, current, goal, color }: { label: string; current: number; goal: number; color: string }) {
  const pct = Math.min((current / goal) * 100, 100);
  const over = current > goal;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={over ? "text-destructive font-medium" : "text-foreground font-medium"}>
          {Math.round(current)}
          <span className="text-muted-foreground font-normal">/{goal}{label === "Calories" ? "" : "g"}</span>
        </span>
      </div>
      <div className="w-full h-3.5 rounded-full bg-white/15 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${over ? "bg-destructive" : ""}`} style={{ width: `${pct}%`, backgroundColor: over ? undefined : color }} />
      </div>
    </div>
  );
}

const PIE_COLORS = { protein: "hsl(200, 60%, 50%)", carbs: "hsl(38, 70%, 55%)", fat: "hsl(0, 60%, 55%)" };

function MacroPieChart({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const proteinCal = protein * 4, carbsCal = carbs * 4, fatCal = fat * 9;
  const total = proteinCal + carbsCal + fatCal;
  if (total === 0) return (
    <div className="flex items-center justify-center">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
        <span className="text-sm text-muted-foreground">No data</span>
      </div>
    </div>
  );
  const pPct = (proteinCal / total) * 100, cPct = (carbsCal / total) * 100, fPct = (fatCal / total) * 100;
  const r = 42, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
  const segments = [{ pct: pPct, color: PIE_COLORS.protein }, { pct: cPct, color: PIE_COLORS.carbs }, { pct: fPct, color: PIE_COLORS.fat }];
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {segments.map((seg, i) => { const dash = (seg.pct / 100) * circumference; const gap = circumference - dash; const so = -offset; offset += dash; return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="12" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={so} className="transition-all duration-500" />; })}
      </svg>
      <div className="flex gap-4 text-sm">
        <span style={{ color: PIE_COLORS.protein }}>● P {Math.round(pPct)}%</span>
        <span style={{ color: PIE_COLORS.carbs }}>● C {Math.round(cPct)}%</span>
        <span style={{ color: PIE_COLORS.fat }}>● F {Math.round(fPct)}%</span>
      </div>
    </div>
  );
}

// Modal wrapper
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function NutritionTracker() {
  const { toast } = useToast();
  const [data, setData] = useState<StoredData>(loadData);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState("1");
  const [useGramMode, setUseGramMode] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [sugarFree, setSugarFree] = useState(false);
  const [oilFree, setOilFree] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [editGoals, setEditGoals] = useState<MacroGoals>(data.goals);

  // Reload data when settings change
  useEffect(() => {
    const handleStorageChange = () => {
      setData(loadData());
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Custom foods
  const [customFoods, setCustomFoods] = useState<CustomFood[]>(loadCustomFoods);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [editingCustom, setEditingCustom] = useState<CustomFood | null>(null);
  const [showMyFoods, setShowMyFoods] = useState(false);
  const [cf, setCf] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", unitLabel: "", gramsPerUnit: "" });

  // Recipes
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showMyRecipes, setShowMyRecipes] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeServings, setRecipeServings] = useState("1");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeShowDrop, setRecipeShowDrop] = useState(false);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveCustomFoods(customFoods); }, [customFoods]);
  useEffect(() => { saveRecipes(recipes); }, [recipes]);

  // Build combined unit map with custom food units
  const dynamicUnitMap: Record<string, UnitInfo> = { ...UNIT_MAP };
  customFoods.forEach((f) => { if (f.unitLabel && f.gramsPerUnit) dynamicUnitMap[f.name] = { unitLabel: f.unitLabel, gramsPerUnit: f.gramsPerUnit }; });
  recipes.forEach((r) => { dynamicUnitMap[r.name] = { unitLabel: "serving", gramsPerUnit: r.totalGrams / r.servings }; });

  const selectedUnit = selected ? dynamicUnitMap[selected.name] : null;
  const hasUnit = !!selectedUnit;
  const effectiveGramMode = !hasUnit || useGramMode;
  const computedGrams = effectiveGramMode ? parseFloat(quantity) : (parseFloat(quantity) || 0) * (selectedUnit?.gramsPerUnit || 0);

  // All foods combined
  const allFoods: (FoodItem & { tag?: string })[] = [
    ...FOODS,
    ...customFoods.map((f) => ({ ...f, tag: "Custom" })),
    ...recipes.map((r) => ({ name: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber, tag: "🍳 Recipe" })),
  ];

  const filtered = search.length > 0
    ? allFoods.filter((f) => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10)
    : [];

  const selectFood = (food: FoodItem) => {
    setSelected(food);
    setSearch(food.name);
    setShowDropdown(false);
    const unit = dynamicUnitMap[food.name];
    if (unit) { setUseGramMode(false); setQuantity("1"); } else { setUseGramMode(true); setQuantity("100"); }
  };

  const addEntry = () => {
    if (!selected || !quantity) return;
    const g = computedGrams;
    if (isNaN(g) || g <= 0) return;
    setData((prev) => ({ ...prev, log: [...prev.log, { id: Date.now().toString(), food: selected, grams: g, sugarFree, oilFree }] }));
    setSearch(""); setSelected(null); setQuantity("1"); setUseGramMode(false); setSugarFree(false); setOilFree(false);
  };

  const removeEntry = (id: string) => { setData((prev) => ({ ...prev, log: prev.log.filter((e) => e.id !== id) })); };
  const resetLog = () => { setData((prev) => ({ ...prev, log: [] })); };
  const handleSaveGoals = () => { setData((prev) => ({ ...prev, goals: editGoals })); setShowGoals(false); };

  const totals = data.log.reduce((acc, entry) => {
    const m = entry.grams / 100;
    const fat = entry.oilFree ? 0 : entry.food.fat * m;
    return { calories: acc.calories + entry.food.calories * m, protein: acc.protein + entry.food.protein * m, carbs: acc.carbs + entry.food.carbs * m, fat: acc.fat + fat, fiber: acc.fiber + entry.food.fiber * m };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

  // Custom food handlers
  const openCustomModal = (food?: CustomFood) => {
    if (food) {
      setEditingCustom(food);
      setCf({ name: food.name, calories: String(food.calories), protein: String(food.protein), carbs: String(food.carbs), fat: String(food.fat), fiber: String(food.fiber), unitLabel: food.unitLabel || "", gramsPerUnit: food.gramsPerUnit ? String(food.gramsPerUnit) : "" });
    } else {
      setEditingCustom(null);
      setCf({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", unitLabel: "", gramsPerUnit: "" });
    }
    setShowCustomModal(true);
  };

  const saveCustomFood = () => {
    if (!cf.name || !cf.calories) return;
    const food: CustomFood = {
      id: editingCustom?.id || Date.now().toString(),
      name: cf.name, calories: Number(cf.calories), protein: Number(cf.protein) || 0, carbs: Number(cf.carbs) || 0,
      fat: Number(cf.fat) || 0, fiber: Number(cf.fiber) || 0,
      unitLabel: cf.unitLabel || undefined, gramsPerUnit: cf.gramsPerUnit ? Number(cf.gramsPerUnit) : undefined,
    };

    // Ensure localStorage array exists and update it directly
    try {
      const existingRaw = localStorage.getItem(CUSTOM_FOODS_KEY);
      const existing: CustomFood[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = editingCustom
        ? existing.map((f) => (f.id === editingCustom.id ? food : f))
        : [...existing, food];
      localStorage.setItem(CUSTOM_FOODS_KEY, JSON.stringify(updated));
    } catch {
      // Fallback: still update in-memory state even if localStorage fails
    }

    // Keep React state in sync so search results update immediately
    if (editingCustom) {
      setCustomFoods((prev) => prev.map((f) => (f.id === editingCustom.id ? food : f)));
    } else {
      setCustomFoods((prev) => [...prev, food]);
    }

    setShowCustomModal(false);
    toast({ title: "Food saved!" });

    // Surface the newly saved food in the main search with Custom badge
    setSearch(food.name);
    setShowDropdown(true);
    setSelected(null);
  };

  const deleteCustomFood = (id: string) => { setCustomFoods((prev) => prev.filter((f) => f.id !== id)); };

  // Recipe handlers
  const allFoodsForRecipe = [...FOODS, ...customFoods];
  const recipeFiltered = recipeSearch.length > 0
    ? allFoodsForRecipe.filter((f) => f.name.toLowerCase().includes(recipeSearch.toLowerCase())).slice(0, 8)
    : [];

  const addRecipeIngredient = (food: FoodItem) => {
    const unit = dynamicUnitMap[food.name];
    const grams = unit ? unit.gramsPerUnit : 100;
    setRecipeIngredients((prev) => [...prev, { food, grams }]);
    setRecipeSearch("");
    setRecipeShowDrop(false);
  };

  const updateIngredientGrams = (idx: number, grams: number) => {
    setRecipeIngredients((prev) => prev.map((ing, i) => i === idx ? { ...ing, grams } : ing));
  };

  const removeIngredient = (idx: number) => {
    setRecipeIngredients((prev) => prev.filter((_, i) => i !== idx));
  };

  const recipeTotals = recipeIngredients.reduce((acc, ing) => {
    const m = ing.grams / 100;
    return { calories: acc.calories + ing.food.calories * m, protein: acc.protein + ing.food.protein * m, carbs: acc.carbs + ing.food.carbs * m, fat: acc.fat + ing.food.fat * m, fiber: acc.fiber + ing.food.fiber * m, grams: acc.grams + ing.grams };
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, grams: 0 });

  const servingsNum = Math.max(1, Number(recipeServings) || 1);
  const perServing = {
    calories: recipeTotals.calories / servingsNum,
    protein: recipeTotals.protein / servingsNum,
    carbs: recipeTotals.carbs / servingsNum,
    fat: recipeTotals.fat / servingsNum,
    fiber: recipeTotals.fiber / servingsNum,
    grams: recipeTotals.grams / servingsNum,
  };

  const openRecipeModal = (recipe?: Recipe) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setRecipeName(recipe.name);
      setRecipeServings(String(recipe.servings));
      setRecipeIngredients(recipe.ingredients);
    } else {
      setEditingRecipe(null);
      setRecipeName("");
      setRecipeServings("1");
      setRecipeIngredients([]);
    }
    setRecipeSearch("");
    setShowRecipeModal(true);
  };

  const saveRecipe = () => {
    if (!recipeName || recipeIngredients.length === 0) return;
    const totalG = recipeTotals.grams;
    const per100 = totalG > 0 ? {
      calories: (recipeTotals.calories / totalG) * 100,
      protein: (recipeTotals.protein / totalG) * 100,
      carbs: (recipeTotals.carbs / totalG) * 100,
      fat: (recipeTotals.fat / totalG) * 100,
      fiber: (recipeTotals.fiber / totalG) * 100,
    } : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };

    const recipe: Recipe = {
      id: editingRecipe?.id || Date.now().toString(),
      name: recipeName, ingredients: recipeIngredients, servings: servingsNum, totalGrams: totalG,
      ...per100,
    };
    if (editingRecipe) {
      setRecipes((prev) => prev.map((r) => r.id === editingRecipe.id ? recipe : r));
    } else {
      setRecipes((prev) => [...prev, recipe]);
    }

    // Also persist to saved_recipes key
    try {
      const existing = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || "[]");
      const idx = existing.findIndex((r: any) => r.id === recipe.id);
      if (idx >= 0) existing[idx] = recipe; else existing.push(recipe);
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(existing));
    } catch {
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify([recipe]));
    }

    setShowRecipeModal(false);
    toast({ title: "Recipe saved!" });
  };

  const deleteRecipe = (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    try {
      const existing = JSON.parse(localStorage.getItem(SAVED_RECIPES_KEY) || "[]");
      localStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(existing.filter((r: any) => r.id !== id)));
    } catch {}
  };

  const logRecipeToDay = (recipe: Recipe) => {
    const newEntries: LogEntry[] = recipe.ingredients.map((ing) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
      food: ing.food,
      grams: ing.grams,
    }));
    setData((prev) => ({ ...prev, log: [...prev.log, ...newEntries] }));
    toast({ title: `🍳 ${recipe.name} logged to today!` });
  };

  const totalFoodCount = FOODS.length + customFoods.length + recipes.length;

  return (
    <div className="section-card section-nutrition flex flex-col gap-5" style={{ animation: "fade-in 0.4s ease-out 0.35s forwards", opacity: "0" } as React.CSSProperties}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[18px] font-semibold section-title-nutrition flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-nutrition/15 flex items-center justify-center">
            <span className="text-lg">🥗</span>
          </div>
          Nutrition Tracker <span className="text-sm text-muted-foreground font-normal ml-1">{totalFoodCount} foods</span>
        </h2>
        <div className="flex items-center gap-1.5">
          <button onClick={() => openRecipeModal()} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20 transition-colors" title="Build a Recipe">
            <ChefHat className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => openCustomModal()} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20 transition-colors" title="Create Custom Food">
            <Plus className="w-[18px] h-[18px]" />
          </button>
          <button onClick={() => { setShowGoals(!showGoals); setEditGoals(data.goals); }} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Set macro goals">
            <Settings2 className="w-[18px] h-[18px]" />
          </button>
          {data.log.length > 0 && (
            <button onClick={resetLog} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-destructive transition-colors" title="Reset daily log">
              <RotateCcw className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* My Foods / My Recipes links */}
      {(customFoods.length > 0 || recipes.length > 0) && (
        <div className="flex gap-4 text-sm">
          {customFoods.length > 0 && (
            <button onClick={() => setShowMyFoods(!showMyFoods)} className="text-nutrition hover:underline font-medium">
              My Foods ({customFoods.length})
            </button>
          )}
          {recipes.length > 0 && (
            <button onClick={() => setShowMyRecipes(!showMyRecipes)} className="text-nutrition hover:underline font-medium">
              My Recipes ({recipes.length})
            </button>
          )}
        </div>
      )}

      {/* My Foods list */}
      {showMyFoods && (
        <div className="bg-nutrition/5 border border-nutrition/10 rounded-xl p-4 flex flex-col gap-2 animate-fade-in">
          <span className="text-sm text-nutrition font-medium mb-1">My Custom Foods</span>
          {customFoods.map((f) => (
            <div key={f.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/40">
              <div>
                <span className="text-[15px] text-foreground">{f.name}</span>
                {f.unitLabel && <span className="text-sm text-muted-foreground ml-2">per {f.unitLabel} ≈{f.gramsPerUnit}g</span>}
                <div className="text-sm text-muted-foreground">{f.calories}cal · {f.protein}p · {f.carbs}c · {f.fat}f</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openCustomModal(f)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteCustomFood(f.id)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Recipes list */}
      {showMyRecipes && (
        <div className="bg-nutrition/5 border border-nutrition/10 rounded-xl p-4 flex flex-col gap-2 animate-fade-in">
          <span className="text-sm text-nutrition font-medium mb-1">My Recipes — click to log</span>
          {recipes.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-secondary/40">
              <div className="flex-1 min-w-0">
                <span className="text-[15px] text-foreground">🍳 {r.name}</span>
                <span className="text-sm text-muted-foreground ml-2">{r.ingredients.length} ingredients</span>
                <div className="text-sm text-muted-foreground">
                  {Math.round(r.ingredients.reduce((a, i) => a + i.food.calories * i.grams / 100, 0))} cal total
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => logRecipeToDay(r)} className="icon-btn w-9 h-9 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20" title="Log to today">
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => openRecipeModal(r)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => deleteRecipe(r.id)} className="icon-btn w-9 h-9 min-w-0 min-h-0 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Goals editor */}
      {showGoals && (
        <div className="bg-secondary/40 rounded-xl p-4 flex flex-col gap-3 animate-fade-in">
          <span className="text-sm text-muted-foreground font-medium">Daily Macro Goals</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(["calories", "protein", "carbs", "fat"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground capitalize">{key}</label>
                <input type="number" value={editGoals[key]} onChange={(e) => setEditGoals({ ...editGoals, [key]: Number(e.target.value) })} className="input-styled" />
              </div>
            ))}
          </div>
          <button onClick={handleSaveGoals} className="self-end btn-primary bg-nutrition text-white hover:opacity-90">Save Goals</button>
        </div>
      )}

      {/* Macro bars + Pie chart */}
      <div className="flex flex-col sm:flex-row gap-5 items-start">
        <div className="flex-1 grid grid-cols-2 gap-x-5 gap-y-3 w-full">
          <MacroBar label="Calories" current={totals.calories} goal={data.goals.calories} color="hsl(25, 95%, 53%)" />
          <MacroBar label="Protein" current={totals.protein} goal={data.goals.protein} color="hsl(217, 91%, 60%)" />
          <MacroBar label="Carbs" current={totals.carbs} goal={data.goals.carbs} color="hsl(45, 80%, 50%)" />
          <MacroBar label="Fat" current={totals.fat} goal={data.goals.fat} color="hsl(350, 89%, 60%)" />
          <div className="col-span-2">
            <MacroBar label="Fiber" current={totals.fiber} goal={30} color="hsl(160, 60%, 45%)" />
          </div>
        </div>
        <MacroPieChart protein={totals.protein} carbs={totals.carbs} fat={totals.fat} />
      </div>

      {/* Search + add */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelected(null); }} onFocus={() => setShowDropdown(true)} placeholder="Search food..." className="input-styled w-full pl-12 pr-10" />
          {search && (<button onClick={() => { setSearch(""); setSelected(null); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>)}
          {showDropdown && filtered.length > 0 && !selected && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-64 overflow-y-auto">
              {filtered.map((f: any) => {
                const unit = dynamicUnitMap[f.name];
                return (
                  <button key={f.name + (f.tag || "")} onClick={() => selectFood(f)} className="w-full text-left px-4 py-3 text-[15px] text-foreground hover:bg-nutrition/5 transition-colors flex justify-between items-center gap-3 min-h-[48px]">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="truncate">{f.name}</span>
                      {f.tag && <span className={`shrink-0 text-sm px-2 py-0.5 rounded-full font-medium ${f.tag === "Custom" ? "bg-orange-500/15 text-orange-400" : "bg-primary/15 text-primary"}`}>{f.tag}</span>}
                      {unit && <span className="text-muted-foreground text-sm shrink-0">per {unit.unitLabel} ≈{Math.round(unit.gramsPerUnit)}g</span>}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-sm">{f.calories} cal</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder={effectiveGramMode ? "grams" : "How many?"} className="input-styled w-28 pr-8" min="0.1" step={effectiveGramMode ? "1" : "0.5"} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{effectiveGramMode ? "g" : "×"}</span>
            </div>
            <button onClick={addEntry} disabled={!selected} className="btn-primary bg-nutrition text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 px-6">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          {selected && hasUnit && (
            <div className="flex flex-col gap-0.5">
              <button onClick={() => { setUseGramMode(!useGramMode); setQuantity(useGramMode ? "1" : String(Math.round(computedGrams) || 100)); }} className="text-sm text-nutrition hover:underline self-start">
                {effectiveGramMode ? `Use ${selectedUnit!.unitLabel} count` : "Enter grams instead"}
              </button>
              {!effectiveGramMode && quantity && parseFloat(quantity) > 0 && (
                <span className="text-sm text-muted-foreground">{quantity} {selectedUnit!.unitLabel}{parseFloat(quantity) !== 1 ? "s" : ""} = {Math.round(computedGrams)}g</span>
              )}
            </div>
          )}
          {selected && (
            <div className="flex gap-4 items-center mt-1">
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={sugarFree} onChange={(e) => setSugarFree(e.target.checked)} className="w-3.5 h-3.5 accent-nutrition rounded" />
                Sugar Free
              </label>
              <label className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer select-none">
                <input type="checkbox" checked={oilFree} onChange={(e) => setOilFree(e.target.checked)} className="w-3.5 h-3.5 accent-nutrition rounded" />
                Oil Free
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Food log */}
      {data.log.length > 0 && (
        <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto -mx-1 px-1">
          {data.log.map((entry) => {
            const m = entry.grams / 100;
            return (
              <div key={entry.id} className="group flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-secondary/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[15px] text-foreground truncate">{entry.food.name}</span>
                    <span className="text-sm text-muted-foreground shrink-0">{Math.round(entry.grams)}g</span>
                    {entry.sugarFree && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">SF</span>}
                    {entry.oilFree && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 font-medium">OF</span>}
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {Math.round(entry.food.calories * m)} cal · {Math.round(entry.food.protein * m)}p · {Math.round(entry.food.carbs * m)}c · {Math.round(entry.oilFree ? 0 : entry.food.fat * m)}f
                  </div>
                </div>
                <button onClick={() => removeEntry(entry.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {data.log.length === 0 && (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-[15px] text-white/70">No food logged yet</p>
          <p className="text-sm text-white/60 mt-1">Search and add foods to start tracking</p>
        </div>
      )}

      {/* Custom Food Modal */}
      <Modal open={showCustomModal} onClose={() => setShowCustomModal(false)} title={editingCustom ? "Edit Custom Food" : "Create Custom Food"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Food Name *</label>
            <input value={cf.name} onChange={(e) => setCf({ ...cf, name: e.target.value })} placeholder="e.g. My Chocolate Milk" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Serving Unit (optional)</label>
              <input value={cf.unitLabel} onChange={(e) => setCf({ ...cf, unitLabel: e.target.value })} placeholder="e.g. glass, piece, bowl" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Grams per unit</label>
              <input type="number" value={cf.gramsPerUnit} onChange={(e) => setCf({ ...cf, gramsPerUnit: e.target.value })} placeholder="e.g. 300" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
            </div>
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Macros per 100g</span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(["calories", "protein", "carbs", "fat", "fiber"] as const).map((key) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[10px] text-muted-foreground capitalize">{key}{key === "calories" ? " *" : ""}</label>
                <input type="number" value={cf[key]} onChange={(e) => setCf({ ...cf, [key]: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
              </div>
            ))}
          </div>
          <button onClick={saveCustomFood} disabled={!cf.name || !cf.calories} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
            {editingCustom ? "Update Food" : "Save Food"}
          </button>
        </div>
      </Modal>

      {/* Recipe Builder Modal */}
      <Modal open={showRecipeModal} onClose={() => setShowRecipeModal(false)} title={editingRecipe ? "Edit Recipe" : "🍳 Build a Recipe"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Recipe Name *</label>
            <input value={recipeName} onChange={(e) => setRecipeName(e.target.value)} placeholder="e.g. Ghee Khakra, Protein Shake" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>

          {/* Ingredient search */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Add Ingredients</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input value={recipeSearch} onChange={(e) => { setRecipeSearch(e.target.value); setRecipeShowDrop(true); }} onFocus={() => setRecipeShowDrop(true)} placeholder="Search food to add..." className="w-full bg-secondary border border-border/60 rounded-md pl-7 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
              {recipeShowDrop && recipeFiltered.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-30 py-1 max-h-36 overflow-y-auto">
                  {recipeFiltered.map((f) => {
                    const unit = dynamicUnitMap[f.name];
                    return (
                      <button key={f.name} onClick={() => addRecipeIngredient(f)} className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary/60 transition-colors flex justify-between">
                        <span>{f.name} {unit && <span className="text-[10px] text-muted-foreground">≈{unit.gramsPerUnit}g/{unit.unitLabel}</span>}</span>
                        <span className="text-muted-foreground">{f.calories} cal</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Ingredients list with per-ingredient breakdown */}
          {recipeIngredients.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-secondary/30 rounded-lg p-2">
              <div className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 text-[9px] text-muted-foreground font-medium px-1">
                <span>Ingredient</span><span className="text-right">Qty(g)</span><span className="text-right">Cal</span><span className="text-right">P</span><span className="text-right">C</span><span className="text-right">F</span><span></span>
              </div>
              {recipeIngredients.map((ing, idx) => {
                const unit = dynamicUnitMap[ing.food.name];
                const m = ing.grams / 100;
                return (
                  <div key={idx} className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 items-center text-xs px-1">
                    <span className="text-foreground truncate">{ing.food.name}</span>
                    <input type="number" value={ing.grams} onChange={(e) => updateIngredientGrams(idx, Number(e.target.value))} className="w-full bg-secondary border border-border/60 rounded px-1 py-1 text-xs text-foreground text-right focus:outline-none" min="1" />
                    <span className="text-muted-foreground text-right">{Math.round(ing.food.calories * m)}</span>
                    <span className="text-muted-foreground text-right">{(ing.food.protein * m).toFixed(1)}</span>
                    <span className="text-muted-foreground text-right">{Math.round(ing.food.carbs * m)}</span>
                    <span className="text-muted-foreground text-right">{(ing.food.fat * m).toFixed(1)}</span>
                    <button onClick={() => removeIngredient(idx)} className="text-muted-foreground hover:text-destructive justify-self-center"><X className="w-3 h-3" /></button>
                  </div>
                );
              })}
              <div className="grid grid-cols-[1fr_60px_40px_40px_30px_30px_20px] gap-1 items-center text-xs px-1 pt-1.5 border-t border-border/40 font-medium">
                <span className="text-foreground">Total</span>
                <span className="text-right text-muted-foreground">{Math.round(recipeTotals.grams)}g</span>
                <span className="text-right text-foreground">{Math.round(recipeTotals.calories)}</span>
                <span className="text-right text-foreground">{recipeTotals.protein.toFixed(1)}</span>
                <span className="text-right text-foreground">{Math.round(recipeTotals.carbs)}</span>
                <span className="text-right text-foreground">{recipeTotals.fat.toFixed(1)}</span>
                <span></span>
              </div>
            </div>
          )}

          {/* Servings */}
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-muted-foreground">This makes</label>
            <input type="number" value={recipeServings} onChange={(e) => setRecipeServings(e.target.value)} className="w-14 bg-secondary border border-border/60 rounded-md px-2 py-1 text-xs text-foreground text-center focus:outline-none" min="1" />
            <span className="text-[10px] text-muted-foreground">serving{servingsNum > 1 ? "s" : ""}</span>
          </div>

          {/* Per serving summary */}
          {recipeIngredients.length > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <span className="text-[10px] text-muted-foreground font-medium">Per Serving ({Math.round(perServing.grams)}g)</span>
              <div className="grid grid-cols-5 gap-2 mt-1.5">
                {[
                  { label: "Cal", value: perServing.calories },
                  { label: "Protein", value: perServing.protein },
                  { label: "Carbs", value: perServing.carbs },
                  { label: "Fat", value: perServing.fat },
                  { label: "Fiber", value: perServing.fiber },
                ].map((m) => (
                  <div key={m.label} className="text-center">
                    <div className="text-xs font-medium text-foreground">{Math.round(m.value)}</div>
                    <div className="text-[9px] text-muted-foreground">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={saveRecipe} disabled={!recipeName || recipeIngredients.length === 0} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed">
            {editingRecipe ? "Update Recipe" : "Save Recipe"}
          </button>

          {/* Saved recipes quick-log list */}
          {recipes.length > 0 && !editingRecipe && (
            <div className="border-t border-border/40 pt-3 flex flex-col gap-1.5">
              <span className="text-[10px] text-muted-foreground font-medium">Saved Recipes — tap + to log</span>
              {recipes.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
                  <div className="min-w-0">
                    <span className="text-xs text-foreground font-medium">🍳 {r.name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">
                      {Math.round(r.ingredients.reduce((a, i) => a + i.food.calories * i.grams / 100, 0))} cal
                    </span>
                  </div>
                  <button onClick={() => logRecipeToDay(r)} className="icon-btn w-7 h-7 min-w-0 min-h-0 bg-nutrition/10 text-nutrition hover:bg-nutrition/20" title="Log to today">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

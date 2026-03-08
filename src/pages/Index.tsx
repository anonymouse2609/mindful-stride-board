import { useState, useEffect, useCallback } from "react";
import QuoteSection from "@/components/QuoteSection";
import SubjectStudyTimer from "@/components/SubjectStudyTimer";
import TodoList from "@/components/TodoList";
import HabitsTracker from "@/components/HabitsTracker";
import DailyGoals from "@/components/DailyGoals";
import FocusMusicPlayer from "@/components/FocusMusicPlayer";
import WeeklyProgress from "@/components/WeeklyProgress";
import NutritionTracker from "@/components/NutritionTracker";
import GrowthChatbot, { type AppState } from "@/components/GrowthChatbot";

function getAppState(): AppState {
  const todayKey = new Date().toISOString().split("T")[0];

  // Habits
  let habitsCompleted = 0, habitsTotal = 0, habitNames = "";
  try {
    const raw = localStorage.getItem("dashboard-habits");
    if (raw) {
      const data = JSON.parse(raw);
      const todayIdx = (new Date().getDay() + 6) % 7;
      habitsTotal = data.habits?.length || 0;
      habitNames = (data.habits || []).join(", ");
      habitsCompleted = (data.habits || []).filter((_: string, i: number) => {
        const key = `${i}`;
        return data.grid?.[key]?.[todayIdx];
      }).length;
    }
  } catch {}

  // Nutrition
  let nutritionState = { calories: 0, caloriesGoal: 2000, protein: 0, carbs: 0, fat: 0, mealsCount: 0 };
  try {
    const raw = localStorage.getItem("dashboard-nutrition");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === todayKey) {
        nutritionState.mealsCount = data.log?.length || 0;
        nutritionState.caloriesGoal = data.goals?.calories || 2000;
        (data.log || []).forEach((entry: any) => {
          const m = entry.grams / 100;
          nutritionState.calories += entry.food.calories * m;
          nutritionState.protein += entry.food.protein * m;
          nutritionState.carbs += entry.food.carbs * m;
          nutritionState.fat += entry.food.fat * m;
        });
      }
    }
  } catch {}

  // Pomodoro
  let pomodoroState = { sessions: 0, isRunning: false };
  // Pomodoro state is in component state, we can't easily read it. Use defaults.

  // Todos
  let todosState = { completed: 0, total: 0 };
  try {
    const raw = localStorage.getItem("dashboard-todos");
    if (raw) {
      const data = JSON.parse(raw);
      const todos = data.todos || data || [];
      if (Array.isArray(todos)) {
        todosState.total = todos.length;
        todosState.completed = todos.filter((t: any) => t.done || t.completed).length;
      }
    }
  } catch {}

  return {
    habits: true,
    habitsCompleted,
    habitsTotal,
    habitNames,
    nutrition: nutritionState,
    pomodoro: pomodoroState,
    todos: todosState,
  };
}

const Index = () => {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const [appState, setAppState] = useState<AppState>(getAppState);

  // Refresh app state periodically so chatbot has current data
  useEffect(() => {
    const interval = setInterval(() => setAppState(getAppState()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChatAction = useCallback((action: string, param: string | null) => {
    if (action === "SEARCH_FOOD" && param) {
      // Scroll to nutrition tracker
      const el = document.querySelector('[class*="nutrition"]') || document.querySelector('h2');
      const nutritionSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Nutrition'));
      nutritionSection?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (action === "START_POMODORO") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background px-3 py-6 sm:px-6 md:px-8 lg:px-16 md:py-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">
            {greeting}.
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <QuoteSection />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-3 sm:space-y-4">
            <PomodoroTimer />
            <DailyGoals />
            <FocusMusicPlayer />
          </div>
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <TodoList />
            <HabitsTracker />
          </div>
        </div>

        <NutritionTracker />
        <WeeklyProgress />

        <div className="text-center pb-2 sm:pb-4">
          <p className="text-[10px] text-muted-foreground/40">Stay focused. Stay consistent.</p>
        </div>
      </div>

      <GrowthChatbot appState={appState} onAction={handleChatAction} />
    </div>
  );
};

export default Index;

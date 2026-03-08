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

  let studyState = { sessions: 0, isRunning: false, todayMinutes: 0 };
  try {
    const raw = localStorage.getItem("dashboard-study-timer");
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toISOString().split("T")[0];
      const todaySessions = (data.sessions || []).filter((s: any) => s.date === today);
      studyState.sessions = todaySessions.length;
      studyState.todayMinutes = todaySessions.reduce((a: number, s: any) => a + (s.durationMinutes || 0), 0);
    }
  } catch {}

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
    pomodoro: studyState,
    todos: todosState,
  };
}

const Index = () => {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  const [appState, setAppState] = useState<AppState>(getAppState);

  useEffect(() => {
    const interval = setInterval(() => setAppState(getAppState()), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleChatAction = useCallback((action: string, param: string | null) => {
    if (action === "SEARCH_FOOD" && param) {
      const nutritionSection = Array.from(document.querySelectorAll('h2')).find(h => h.textContent?.includes('Nutrition'));
      nutritionSection?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (action === "START_POMODORO") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 md:px-10 lg:px-20 md:py-10 animate-page-enter">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            {greeting}.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <QuoteSection />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="space-y-4 sm:space-y-6">
            <SubjectStudyTimer />
            <DailyGoals />
            <FocusMusicPlayer />
          </div>
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <TodoList />
            <HabitsTracker />
          </div>
        </div>

        <NutritionTracker />
        <WeeklyProgress />

        <div className="text-center pb-4 sm:pb-6">
          <p className="text-sm text-muted-foreground/40">Stay focused. Stay consistent.</p>
        </div>
      </div>

      <GrowthChatbot appState={appState} onAction={handleChatAction} />
    </div>
  );
};

export default Index;

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuoteSection from "@/components/QuoteSection";
import SubjectStudyTimer from "@/components/SubjectStudyTimer";
import TodoList from "@/components/TodoList";
import HabitsTracker from "@/components/HabitsTracker";
import DailyGoals from "@/components/DailyGoals";
import FocusMusicPlayer from "@/components/FocusMusicPlayer";
import WeeklyProgress from "@/components/WeeklyProgress";
import NutritionTracker from "@/components/NutritionTracker";
import GrowthChatbot, { type AppState } from "@/components/GrowthChatbot";
import FocusScore from "@/components/FocusScore";
import RevisionScheduler from "@/components/RevisionScheduler";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { loadSettings } from "@/lib/utils";

function getAppState(): AppState {
  const todayKey = new Date().toISOString().split("T")[0];

  let habitsCompleted = 0, habitsTotal = 0, habitNames = "";
  try {
    const raw = localStorage.getItem("habits_today");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === todayKey) {
        habitsCompleted = data.completed || 0;
        habitsTotal = data.total || 0;
      }
    }
    // fallback to old key for habit names
    const rawH = localStorage.getItem("dashboard-habits");
    if (rawH) {
      const hData = JSON.parse(rawH);
      habitNames = (hData.habits || []).join(", ");
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
  const navigate = useNavigate();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState(() => {
    const now = new Date();
    const settings = loadSettings();
    return settings.profile.name 
      ? `${now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"}, ${settings.profile.name}!`
      : (now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening");
  });

  // Update greeting when settings change
  useEffect(() => {
    const handleStorageChange = () => {
      const now = new Date();
      const settings = loadSettings();
      const newGreeting = settings.profile.name 
        ? `${now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening"}, ${settings.profile.name}!`
        : (now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening");
      setGreeting(newGreeting);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Load profile name from settings
  const profileName = (() => {
    try {
      const raw = localStorage.getItem("growth_settings");
      if (raw) {
        const s = JSON.parse(raw);
        return s.profile?.name || "";
      }
    } catch {}
    return "";
  })();

  const [appState, setAppState] = useState<AppState>(getAppState);
  const revisionRef = useRef<{ addExternalTopic: (topic: { name: string; subject: string; difficulty: string; source: string }) => void } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setAppState(getAppState()), 5000);
    return () => clearInterval(interval);
  }, []);

  // URL Integration from Study Buddy -> add revision topic via URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "add_revision") {
      const subject = params.get("subject");
      const chapter = params.get("chapter");
      const rawDifficulty = params.get("difficulty") || "Medium";
      const difficulty = ["Easy", "Medium", "Hard"].includes(rawDifficulty) ? rawDifficulty : "Medium";

      if (subject && chapter) {
        const nowIso = new Date().toISOString();
        const topicEntry = {
          id: Date.now(),
          topic: chapter,
          subject: subject,
          difficulty: difficulty,
          source: "Study Buddy",
          dateAdded: nowIso,
          nextReview: nowIso,
          interval: difficulty === "Hard" ? 1 : difficulty === "Easy" ? 4 : 2,
          repetitions: 0,
          mastery: 0,
        };

        // Save to revision_topics
        try {
          const existing = JSON.parse(localStorage.getItem("revision_topics") || "[]");
          existing.push(topicEntry);
          localStorage.setItem("revision_topics", JSON.stringify(existing));
        } catch {
          localStorage.setItem("revision_topics", JSON.stringify([topicEntry]));
        }

        // Save to studybuddy_topics
        try {
          const sbExisting = JSON.parse(localStorage.getItem("studybuddy_topics") || "[]");
          sbExisting.push(topicEntry);
          localStorage.setItem("studybuddy_topics", JSON.stringify(sbExisting));
        } catch {
          localStorage.setItem("studybuddy_topics", JSON.stringify([topicEntry]));
        }

        // Also add to the RevisionScheduler's internal state
        revisionRef.current?.addExternalTopic({ name: chapter, subject, difficulty, source: "Study Buddy" });

        toast({ title: `📚 ${chapter} added to revision schedule!` });
        window.history.replaceState({}, "", "/");
        setTimeout(() => document.getElementById("revision-scheduler")?.scrollIntoView({ behavior: "smooth" }), 500);
      }
    }
  }, [toast]);

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
        <div className="flex items-center justify-between" style={{ animation: "fade-in 0.4s ease-out forwards" }}>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              {greeting}{profileName ? `, ${profileName}` : ""}.
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/settings")} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/40 text-muted-foreground hover:text-foreground" title="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <ThemeToggle />
          </div>
        </div>

        <FocusScore />
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
        <div id="revision-scheduler">
          <RevisionScheduler ref={revisionRef} />
        </div>
        <WeeklyProgress />

        <div className="text-center pb-4 sm:pb-6">
          <p className="text-sm text-muted-foreground">Stay focused. Stay consistent.</p>
        </div>
      </div>

      <GrowthChatbot appState={appState} onAction={handleChatAction} />
    </div>
  );
};

export default Index;

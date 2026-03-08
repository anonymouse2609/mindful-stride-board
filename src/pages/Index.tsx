import QuoteSection from "@/components/QuoteSection";
import PomodoroTimer from "@/components/PomodoroTimer";
import TodoList from "@/components/TodoList";
import HabitsTracker from "@/components/HabitsTracker";
import DailyGoals from "@/components/DailyGoals";
import FocusMusicPlayer from "@/components/FocusMusicPlayer";
import WeeklyProgress from "@/components/WeeklyProgress";
import NutritionTracker from "@/components/NutritionTracker";

const Index = () => {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

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
          {/* Left Column - on mobile, Pomodoro + Goals side by side */}
          <div className="space-y-3 sm:space-y-4">
            <PomodoroTimer />
            <DailyGoals />
            <FocusMusicPlayer />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <TodoList />
            <HabitsTracker />
          </div>
        </div>

        {/* Weekly Progress */}
        <WeeklyProgress />

        <div className="text-center pb-2 sm:pb-4">
          <p className="text-[10px] text-muted-foreground/40">Stay focused. Stay consistent.</p>
        </div>
      </div>
    </div>
  );
};

export default Index;

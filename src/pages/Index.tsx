import QuoteSection from "@/components/QuoteSection";
import PomodoroTimer from "@/components/PomodoroTimer";
import TodoList from "@/components/TodoList";
import HabitsTracker from "@/components/HabitsTracker";
import DailyGoals from "@/components/DailyGoals";
import { Sparkles } from "lucide-react";

const Index = () => {
  const now = new Date();
  const greeting =
    now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen bg-background px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between" style={{ animation: "fade-in 0.5s ease-out forwards" }}>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gradient flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-primary" />
              {greeting}, Scholar
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Quote */}
        <QuoteSection />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <PomodoroTimer />
            <DailyGoals />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TodoList />
          </div>
        </div>

        {/* Habits - full width */}
        <HabitsTracker />
      </div>
    </div>
  );
};

export default Index;

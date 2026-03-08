import { useState, useEffect, useMemo } from "react";
import { X, Trophy, Flame, TrendingUp, ChevronRight, Award, Zap, Star } from "lucide-react";

// ===== TYPES =====
interface DailyScore {
  date: string;
  score: number;
  breakdown: {
    study: number;
    nutrition: number;
    habits: number;
    energy: number;
  };
  locked: boolean;
}

interface Milestone {
  id: string;
  label: string;
  emoji: string;
  achieved: boolean;
  date?: string;
}

interface FocusScoreData {
  scores: DailyScore[];
  milestones: Milestone[];
}

const STORAGE_KEY = "dashboard-focus-score";
const MILESTONES_DEF: Omit<Milestone, "achieved" | "date">[] = [
  { id: "first80", label: "First time above 80", emoji: "⭐" },
  { id: "streak3", label: "3-day streak", emoji: "🔥" },
  { id: "streak7", label: "7-day streak", emoji: "💎" },
  { id: "perfect", label: "Perfect 100", emoji: "👑" },
  { id: "avg70", label: "30-day avg above 70", emoji: "🏆" },
];

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function calculateScore(): { score: number; breakdown: { study: number; nutrition: number; habits: number; energy: number }; nudges: string[] } {
  const todayKey = getTodayKey();
  let study = 0, nutrition = 0, habits = 0, energy = 0;
  const nudges: string[] = [];

  // Study (35 pts)
  try {
    const raw = localStorage.getItem("dashboard-study-timer");
    if (raw) {
      const data = JSON.parse(raw);
      const subjects = data.subjects || [];
      const sessions = (data.sessions || []).filter((s: any) => s.date === todayKey);
      const todayMinutes = sessions.reduce((a: number, s: any) => a + (s.durationMinutes || 0), 0);
      
      // Calculate daily goal from weekly goals
      let totalWeeklyGoalHours = subjects.reduce((a: number, s: any) => a + (s.weeklyGoalHours || 0), 0);
      const dailyGoalMinutes = totalWeeklyGoalHours > 0 ? (totalWeeklyGoalHours / 7) * 60 : 60;
      
      const ratio = dailyGoalMinutes > 0 ? todayMinutes / dailyGoalMinutes : 0;
      if (ratio >= 1) study = 35;
      else if (ratio >= 0.75) study = 25;
      else if (ratio >= 0.5) study = 15;
      else if (ratio >= 0.25) study = 8;
      
      if (study < 35) {
        const remaining = Math.ceil((dailyGoalMinutes - todayMinutes) / 60 * 10) / 10;
        if (remaining > 0) nudges.push(`Study ${remaining.toFixed(1)} more hours to max study points`);
      }
    } else {
      nudges.push("Start a study session to earn up to 35 points");
    }
  } catch {}

  // Nutrition (25 pts)
  try {
    const raw = localStorage.getItem("dashboard-nutrition");
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === todayKey) {
        const meals = data.log?.length || 0;
        if (meals >= 1) nutrition += 5;
        else nudges.push("Log a meal to earn 5 nutrition points");

        let totalCal = 0, totalProtein = 0;
        const calGoal = data.goals?.calories || 2000;
        const proteinGoal = data.goals?.protein || 80;
        (data.log || []).forEach((e: any) => {
          const m = e.grams / 100;
          totalCal += e.food.calories * m;
          totalProtein += e.food.protein * m;
        });

        if (Math.abs(totalCal - calGoal) / calGoal <= 0.1) nutrition += 10;
        else if (meals >= 1) nudges.push("Get within 10% of calorie goal for 10 more points");

        if (totalProtein >= proteinGoal) nutrition += 10;
        else if (meals >= 1) nudges.push(`Eat ${Math.ceil(proteinGoal - totalProtein)}g more protein for 10 points`);
      } else {
        nudges.push("Log your first meal today to start earning nutrition points");
      }
    } else {
      nudges.push("Log a meal to earn up to 25 nutrition points");
    }
  } catch {}

  // Habits (25 pts)
  try {
    const raw = localStorage.getItem("dashboard-habits");
    if (raw) {
      const data = JSON.parse(raw);
      const todayIdx = (new Date().getDay() + 6) % 7;
      const total = data.habits?.length || 0;
      if (total > 0) {
        const perHabit = 25 / total;
        let completed = 0;
        (data.habits || []).forEach((_: string, i: number) => {
          if (data.grid?.[`${i}`]?.[todayIdx]) completed++;
        });
        habits = Math.round(perHabit * completed);
        const remaining = total - completed;
        if (remaining > 0) nudges.push(`Complete ${remaining} more habit${remaining > 1 ? "s" : ""} to earn ${Math.round(perHabit * remaining)} more points`);
      }
    }
  } catch {}

  // Energy (15 pts)
  try {
    const raw = localStorage.getItem("dashboard-study-timer");
    if (raw) {
      const data = JSON.parse(raw);
      const todaySessions = (data.sessions || []).filter((s: any) => s.date === todayKey && s.energyLevel);
      if (todaySessions.length > 0) {
        energy += 5;
        const avgEnergy = todaySessions.reduce((a: number, s: any) => a + s.energyLevel, 0) / todaySessions.length;
        if (avgEnergy >= 4) energy += 10;
        else if (avgEnergy >= 3) energy += 5;
      } else {
        nudges.push("Log your energy level in a study session for 5 free points");
      }
    }
  } catch {}

  return { score: study + nutrition + habits + energy, breakdown: { study, nutrition, habits, energy }, nudges };
}

function loadData(): FocusScoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { scores: [], milestones: MILESTONES_DEF.map(m => ({ ...m, achieved: false })) };
}

function saveData(data: FocusScoreData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getScoreColor(score: number): string {
  if (score >= 81) return "hsl(160, 60%, 45%)";
  if (score >= 61) return "hsl(217, 91%, 60%)";
  if (score >= 41) return "hsl(38, 90%, 55%)";
  return "hsl(0, 60%, 50%)";
}

function getScoreColorClass(score: number): string {
  if (score >= 81) return "text-nutrition";
  if (score >= 61) return "text-goals";
  if (score >= 41) return "text-medium";
  return "text-destructive";
}

function getVerdict(score: number): string {
  if (score >= 90) return "Exceptional Day 🔥";
  if (score >= 75) return "Strong Day 💪";
  if (score >= 60) return "Decent Day 👍";
  if (score >= 40) return "Room To Improve ⚡";
  return "Rough Day — Tomorrow Is Fresh 🌱";
}

function getBarColor(score: number): string {
  if (score >= 81) return "hsl(160, 60%, 45%)";
  if (score >= 61) return "hsl(217, 91%, 60%)";
  if (score >= 41) return "hsl(38, 90%, 55%)";
  return "hsl(0, 60%, 50%)";
}

// ===== COMPONENT =====
const FocusScore = () => {
  const [data, setData] = useState<FocusScoreData>(loadData);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showEndOfDay, setShowEndOfDay] = useState(false);
  const [newMilestone, setNewMilestone] = useState<string | null>(null);

  const { score, breakdown, nudges } = useMemo(() => calculateScore(), [data]);

  // Update today's score and check milestones
  useEffect(() => {
    const interval = setInterval(() => {
      const result = calculateScore();
      setData(prev => {
        const todayKey = getTodayKey();
        const updated = { ...prev };
        const existingIdx = updated.scores.findIndex(s => s.date === todayKey);
        const todayScore: DailyScore = {
          date: todayKey,
          score: result.score,
          breakdown: result.breakdown,
          locked: false,
        };
        if (existingIdx >= 0) {
          if (!updated.scores[existingIdx].locked) updated.scores[existingIdx] = todayScore;
        } else {
          updated.scores.push(todayScore);
        }

        // Fill missing days with 0
        const scores = updated.scores.sort((a, b) => a.date.localeCompare(b.date));
        if (scores.length > 1) {
          const latest = scores[scores.length - 1];
          const secondLast = scores[scores.length - 2];
          const d1 = new Date(secondLast.date);
          const d2 = new Date(latest.date);
          const diff = Math.floor((d2.getTime() - d1.getTime()) / 86400000);
          for (let i = 1; i < diff; i++) {
            const missingDate = new Date(d1);
            missingDate.setDate(d1.getDate() + i);
            const key = missingDate.toISOString().split("T")[0];
            if (!scores.find(s => s.date === key)) {
              scores.splice(scores.length - 1, 0, {
                date: key, score: 0, breakdown: { study: 0, nutrition: 0, habits: 0, energy: 0 }, locked: true,
              });
            }
          }
        }

        // Lock previous days
        scores.forEach(s => { if (s.date !== todayKey) s.locked = true; });

        // Check milestones
        const streak = getStreak(scores);
        const avg30 = get30DayAvg(scores);
        updated.milestones = updated.milestones.map(m => {
          if (m.achieved) return m;
          let achieved = false;
          if (m.id === "first80" && result.score >= 80) achieved = true;
          if (m.id === "streak3" && streak >= 3) achieved = true;
          if (m.id === "streak7" && streak >= 7) achieved = true;
          if (m.id === "perfect" && result.score >= 100) achieved = true;
          if (m.id === "avg70" && avg30 >= 70 && scores.length >= 30) achieved = true;
          if (achieved) {
            setNewMilestone(m.label + " " + m.emoji);
            setTimeout(() => setNewMilestone(null), 4000);
            return { ...m, achieved: true, date: todayKey };
          }
          return m;
        });

        // Keep last 90 days only
        updated.scores = scores.slice(-90);
        saveData(updated);
        return updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // End of day check
  useEffect(() => {
    const hour = new Date().getHours();
    const dismissed = sessionStorage.getItem("eod-dismissed");
    if (hour >= 22 && !dismissed && score > 0) {
      setShowEndOfDay(true);
    }
  }, [score]);

  const last30 = useMemo(() => {
    const today = getTodayKey();
    const result: DailyScore[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      const existing = data.scores.find(s => s.date === key);
      result.push(existing || { date: key, score: 0, breakdown: { study: 0, nutrition: 0, habits: 0, energy: 0 }, locked: true });
    }
    return result;
  }, [data.scores]);

  const streak = useMemo(() => getStreak(data.scores), [data.scores]);
  const avg7 = useMemo(() => {
    const recent = last30.slice(-7);
    const sum = recent.reduce((a, s) => a + s.score, 0);
    return Math.round(sum / 7);
  }, [last30]);
  const bestDay = useMemo(() => {
    if (last30.length === 0) return null;
    return last30.reduce((best, s) => s.score > best.score ? s : best, last30[0]);
  }, [last30]);
  const monthlyAvg = useMemo(() => {
    const sum = last30.reduce((a, s) => a + s.score, 0);
    return Math.round(sum / 30);
  }, [last30]);

  const maxBarHeight = 100;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  const achievedMilestones = data.milestones.filter(m => m.achieved);

  // Lowest category for end-of-day
  const lowestCat = useMemo(() => {
    const cats = [
      { name: "Study", score: breakdown.study, max: 35 },
      { name: "Nutrition", score: breakdown.nutrition, max: 25 },
      { name: "Habits", score: breakdown.habits, max: 25 },
      { name: "Energy", score: breakdown.energy, max: 15 },
    ];
    return cats.reduce((low, c) => (c.score / c.max) < (low.score / low.max) ? c : low, cats[0]);
  }, [breakdown]);

  return (
    <>
      {/* Main Score Ring */}
      <div
        className="section-card section-focus cursor-pointer group"
        onClick={() => setShowBreakdown(true)}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-focus/10 flex items-center justify-center">
              <Zap className="w-[18px] h-[18px] text-focus" />
            </div>
            <h2 className="text-[18px] font-semibold section-title-focus">Focus Score</h2>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/60">
              <Flame className="w-4 h-4 text-study" />
              <span className="text-sm font-semibold text-foreground">{streak} day streak</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Ring */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={getScoreColor(score)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.3s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-bold font-mono ${getScoreColorClass(score)}`}>{score}</span>
              <span className="text-[11px] text-muted-foreground">/ 100</span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left space-y-3">
            <p className="text-[17px] font-semibold text-foreground">{getVerdict(score)}</p>

            {/* Mini breakdown bars */}
            <div className="space-y-2">
              {[
                { label: "Study", val: breakdown.study, max: 35, color: "hsl(var(--study-accent))" },
                { label: "Nutrition", val: breakdown.nutrition, max: 25, color: "hsl(var(--nutrition-accent))" },
                { label: "Habits", val: breakdown.habits, max: 25, color: "hsl(var(--habits-accent))" },
                { label: "Energy", val: breakdown.energy, max: 15, color: "hsl(var(--mood-accent))" },
              ].map(c => (
                <div key={c.label} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-16 text-right">{c.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary/60 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(c.val / c.max) * 100}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground w-10">{c.val}/{c.max}</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-center sm:justify-start">
              Tap for details <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* 30-day mini chart */}
        <div className="mt-6">
          <div className="flex items-end gap-[3px] h-16">
            {last30.map((day, i) => (
              <div
                key={day.date}
                className="flex-1 rounded-t-sm transition-all duration-200 group/bar relative"
                style={{
                  height: `${Math.max(4, (day.score / 100) * maxBarHeight)}%`,
                  background: day.score === 0 ? "hsl(var(--secondary))" : getBarColor(day.score),
                  opacity: day.date === getTodayKey() ? 1 : 0.6,
                }}
                title={`${day.date}: ${day.score}`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">30 days ago</span>
            <span className="text-[10px] text-muted-foreground">Today</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-2 rounded-xl bg-secondary/30">
            <p className="text-lg font-bold font-mono text-foreground">{bestDay ? bestDay.score : "—"}</p>
            <p className="text-[10px] text-muted-foreground">Best Day</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-secondary/30">
            <p className="text-lg font-bold font-mono text-foreground">{streak}</p>
            <p className="text-[10px] text-muted-foreground">Streak (60+)</p>
          </div>
          <div className="text-center p-2 rounded-xl bg-secondary/30">
            <p className="text-lg font-bold font-mono text-foreground">{monthlyAvg}</p>
            <p className="text-[10px] text-muted-foreground">30d Avg</p>
          </div>
        </div>

        {/* Badges */}
        {achievedMilestones.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {achievedMilestones.map(m => (
              <span key={m.id} className="px-2.5 py-1 rounded-full bg-secondary/50 text-xs font-medium text-foreground">
                {m.emoji} {m.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Milestone celebration toast */}
      {newMilestone && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="px-6 py-3 rounded-2xl bg-card border border-border shadow-lg flex items-center gap-3">
            <Trophy className="w-5 h-5 text-study" />
            <span className="text-sm font-semibold text-foreground">Milestone Unlocked: {newMilestone}</span>
          </div>
        </div>
      )}

      {/* Breakdown Panel */}
      {showBreakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setShowBreakdown(false)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[20px] font-bold text-foreground">Score Breakdown</h3>
              <button onClick={() => setShowBreakdown(false)} className="icon-btn bg-secondary/50 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center">
              <span className={`text-5xl font-bold font-mono ${getScoreColorClass(score)}`}>{score}</span>
              <span className="text-lg text-muted-foreground"> / 100</span>
              <p className="text-sm text-muted-foreground mt-1">{getVerdict(score)}</p>
            </div>

            {/* Category breakdown */}
            <div className="space-y-4">
              {[
                { label: "📚 Study", val: breakdown.study, max: 35, color: "hsl(var(--study-accent))" },
                { label: "🥗 Nutrition", val: breakdown.nutrition, max: 25, color: "hsl(var(--nutrition-accent))" },
                { label: "✅ Habits", val: breakdown.habits, max: 25, color: "hsl(var(--habits-accent))" },
                { label: "⚡ Energy", val: breakdown.energy, max: 15, color: "hsl(var(--mood-accent))" },
              ].map(c => (
                <div key={c.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-foreground">{c.label}</span>
                    <span className="text-sm font-mono font-semibold text-foreground">{c.val}/{c.max}</span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary/60 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.val / c.max) * 100}%`, background: c.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Nudges */}
            {nudges.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground">💡 How to earn more today</h4>
                {nudges.map((n, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-secondary/30">
                    <Star className="w-3.5 h-3.5 text-medium mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-foreground">{n}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 30-day history */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-3">📊 30-Day History</h4>
              <div className="flex items-end gap-[2px] h-24">
                {last30.map(day => (
                  <div key={day.date} className="flex-1 group/bar relative cursor-default" style={{ height: "100%" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 rounded-t-sm transition-all duration-200"
                      style={{
                        height: `${Math.max(3, (day.score / 100) * 100)}%`,
                        background: day.score === 0 ? "hsl(var(--secondary))" : getBarColor(day.score),
                      }}
                    />
                    <div className="opacity-0 group-hover/bar:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 z-10 px-2 py-1 rounded bg-card border border-border text-[10px] whitespace-nowrap text-foreground shadow-lg transition-opacity">
                      {day.date.slice(5)}: {day.score}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">{last30[0]?.date.slice(5)}</span>
                <span className="text-[10px] text-muted-foreground">Today</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold font-mono text-foreground">{bestDay?.score ?? "—"}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{bestDay ? `Best (${bestDay.date.slice(5)})` : "Best Day"}</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold font-mono text-foreground">🔥 {streak}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Streak (60+)</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-xl font-bold font-mono text-foreground">{monthlyAvg}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Monthly Avg</p>
              </div>
            </div>

            {/* Trophies */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">🏆 Milestones</h4>
              <div className="grid grid-cols-2 gap-2">
                {data.milestones.map(m => (
                  <div key={m.id} className={`p-3 rounded-xl border ${m.achieved ? "bg-secondary/40 border-border" : "bg-secondary/10 border-border/30 opacity-40"}`}>
                    <span className="text-lg">{m.emoji}</span>
                    <p className="text-xs font-medium text-foreground mt-1">{m.label}</p>
                    {m.achieved && m.date && <p className="text-[10px] text-muted-foreground">{m.date.slice(5)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End of Day Summary */}
      {showEndOfDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-card rounded-2xl border border-border p-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">End of Day Summary</p>
            <div>
              <span className={`text-5xl font-bold font-mono ${getScoreColorClass(score)}`}>{score}</span>
              <p className="text-[17px] font-semibold text-foreground mt-2">{getVerdict(score)}</p>
            </div>

            <div className="space-y-2 text-left">
              {breakdown.study / 35 >= 0.8 && <p className="text-sm text-foreground">✅ Study goals on track</p>}
              {breakdown.nutrition / 25 >= 0.8 && <p className="text-sm text-foreground">✅ Nutrition well managed</p>}
              {breakdown.habits / 25 >= 0.8 && <p className="text-sm text-foreground">✅ Habits going strong</p>}
              {breakdown.energy / 15 >= 0.8 && <p className="text-sm text-foreground">✅ Energy levels great</p>}
              <p className="text-sm text-muted-foreground mt-2">
                📌 Focus on <span className="text-foreground font-medium">{lowestCat.name}</span> tomorrow — it was your lowest scoring category today
              </p>
            </div>

            <p className="text-xs text-muted-foreground italic">
              {score >= 75 ? "You crushed it today. Rest well!" : score >= 50 ? "Solid effort. Small wins compound!" : "Every day is a fresh start. You showed up!"}
            </p>

            <button
              className="btn-primary w-full bg-goals text-primary-foreground"
              onClick={() => { setShowEndOfDay(false); sessionStorage.setItem("eod-dismissed", "1"); }}
            >
              Got it 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
};

// Helpers
function getStreak(scores: DailyScore[]): number {
  let streak = 0;
  const today = getTodayKey();
  const sorted = [...scores].sort((a, b) => b.date.localeCompare(a.date));
  for (const s of sorted) {
    if (s.date === today && s.score < 60) break;
    if (s.date !== today && s.score < 60) break;
    if (s.score >= 60) streak++;
  }
  return streak;
}

function get30DayAvg(scores: DailyScore[]): number {
  const recent = scores.slice(-30);
  if (recent.length === 0) return 0;
  return recent.reduce((a, s) => a + s.score, 0) / recent.length;
}

export default FocusScore;


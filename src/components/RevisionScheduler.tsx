import { useState, useEffect, useMemo } from "react";
import { Plus, Check, X, Search, Edit2, Trash2, RotateCcw, Calendar, Star, BookOpen, ChevronLeft, ChevronRight, Zap, AlertTriangle } from "lucide-react";

// ===== TYPES =====
type Difficulty = "easy" | "medium" | "hard";

interface RevisionTopic {
  id: string;
  name: string;
  subject: string;
  subjectColor?: string;
  difficulty: Difficulty;
  dateFirstStudied: string;
  currentStage: number; // 0-indexed into intervals
  timesRevised: number;
  lastRevised: string | null;
  nextDue: string;
  mastered: boolean;
  revisionLog: { date: string; action: "revised" | "too_hard" | "too_easy" }[];
}

interface RevisionData {
  topics: RevisionTopic[];
  streakDays: number;
  lastStreakDate: string | null;
}

// ===== CONSTANTS =====
const STORAGE_KEY = "dashboard-revision";

const INTERVALS: Record<Difficulty, number[]> = {
  easy: [1, 4, 10, 21, 45, 90],
  medium: [1, 3, 7, 14, 30, 60],
  hard: [1, 2, 5, 10, 20, 40],
};

const DIFF_COLORS: Record<Difficulty, { bg: string; text: string; label: string }> = {
  easy: { bg: "bg-cyan-500/15", text: "text-cyan-400", label: "Easy" },
  medium: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Medium" },
  hard: { bg: "bg-red-500/15", text: "text-red-400", label: "Hard" },
};

function todayKey() { return new Date().toISOString().split("T")[0]; }

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysDiff(a: string, b: string): number {
  return Math.floor((new Date(b + "T00:00:00").getTime() - new Date(a + "T00:00:00").getTime()) / 86400000);
}

function calcNextDue(topic: RevisionTopic): string {
  const intervals = INTERVALS[topic.difficulty];
  const stage = Math.min(topic.currentStage, intervals.length - 1);
  const baseDate = topic.lastRevised || topic.dateFirstStudied;
  return addDays(baseDate, intervals[stage]);
}

function getSubjects(): { id: string; name: string; color: string }[] {
  try {
    const raw = localStorage.getItem("dashboard-study-timer");
    if (raw) {
      const data = JSON.parse(raw);
      return (data.subjects || []).map((s: any) => ({ id: s.id, name: s.name, color: s.color }));
    }
  } catch {}
  return [];
}

function loadData(): RevisionData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { topics: [], streakDays: 0, lastStreakDate: null };
}

function saveData(data: RevisionData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===== COMPONENT =====
type TabType = "today" | "upcoming" | "all" | "mastered" | "stats";

export default function RevisionScheduler() {
  const [data, setData] = useState<RevisionData>(loadData);
  const [tab, setTab] = useState<TabType>("today");
  const [showAdd, setShowAdd] = useState(false);
  const [editingTopic, setEditingTopic] = useState<RevisionTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterDiff, setFilterDiff] = useState<Difficulty | "">("");
  const [upcomingWeekOffset, setUpcomingWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [celebration, setCelebration] = useState(false);

  // Form state
  const [form, setForm] = useState({ name: "", subject: "", difficulty: "medium" as Difficulty, dateFirstStudied: todayKey() });

  const subjects = useMemo(() => getSubjects(), []);

  useEffect(() => { saveData(data); }, [data]);

  // Update streak
  useEffect(() => {
    const today = todayKey();
    const dueToday = data.topics.filter(t => !t.mastered && t.nextDue <= today);
    const allDone = dueToday.length > 0 && dueToday.every(t => t.revisionLog.some(r => r.date === today));
    if (allDone && data.lastStreakDate !== today) {
      setData(prev => {
        const yesterday = addDays(today, -1);
        const streak = prev.lastStreakDate === yesterday ? prev.streakDays + 1 : 1;
        return { ...prev, streakDays: streak, lastStreakDate: today };
      });
    }
  }, [data.topics]);

  const today = todayKey();

  // Due today (includes overdue)
  const dueToday = useMemo(() =>
    data.topics.filter(t => !t.mastered && t.nextDue <= today)
      .sort((a, b) => a.nextDue.localeCompare(b.nextDue)),
    [data.topics, today]
  );

  const completedToday = useMemo(() =>
    dueToday.filter(t => t.revisionLog.some(r => r.date === today)),
    [dueToday, today]
  );

  const allDoneToday = dueToday.length > 0 && completedToday.length === dueToday.length;

  // Show celebration when all done
  useEffect(() => {
    if (allDoneToday && !celebration) {
      setCelebration(true);
      setTimeout(() => setCelebration(false), 3000);
    }
  }, [allDoneToday]);

  const masteredTopics = useMemo(() => data.topics.filter(t => t.mastered), [data.topics]);

  // Actions
  const addTopic = () => {
    if (!form.name.trim()) return;
    const subjectMatch = subjects.find(s => s.name === form.subject);
    const topic: RevisionTopic = {
      id: Date.now().toString(),
      name: form.name.trim(),
      subject: form.subject || "General",
      subjectColor: subjectMatch?.color,
      difficulty: form.difficulty,
      dateFirstStudied: form.dateFirstStudied,
      currentStage: 0,
      timesRevised: 0,
      lastRevised: null,
      nextDue: addDays(form.dateFirstStudied, INTERVALS[form.difficulty][0]),
      mastered: false,
      revisionLog: [],
    };
    setData(prev => ({ ...prev, topics: [...prev.topics, topic] }));
    setForm({ name: "", subject: "", difficulty: "medium", dateFirstStudied: todayKey() });
    setShowAdd(false);
  };

  const updateTopic = () => {
    if (!editingTopic || !form.name.trim()) return;
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === editingTopic.id ? {
        ...t, name: form.name.trim(), subject: form.subject || "General",
        difficulty: form.difficulty, subjectColor: subjects.find(s => s.name === form.subject)?.color,
      } : t),
    }));
    setEditingTopic(null);
    setShowAdd(false);
  };

  const deleteTopic = (id: string) => {
    setData(prev => ({ ...prev, topics: prev.topics.filter(t => t.id !== id) }));
  };

  const resetTopic = (id: string) => {
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === id ? {
        ...t, currentStage: 0, timesRevised: 0, lastRevised: null, mastered: false,
        nextDue: addDays(todayKey(), INTERVALS[t.difficulty][0]),
        revisionLog: [],
      } : t),
    }));
  };

  const markRevised = (id: string) => {
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => {
        if (t.id !== id) return t;
        const intervals = INTERVALS[t.difficulty];
        const nextStage = t.currentStage + 1;
        const mastered = nextStage >= intervals.length;
        const newTopic = {
          ...t,
          currentStage: nextStage,
          timesRevised: t.timesRevised + 1,
          lastRevised: today,
          mastered,
          nextDue: mastered ? "9999-12-31" : addDays(today, intervals[Math.min(nextStage, intervals.length - 1)]),
          revisionLog: [...t.revisionLog, { date: today, action: "revised" as const }],
        };
        return newTopic;
      }),
    }));
  };

  const markTooHard = (id: string) => {
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => {
        if (t.id !== id) return t;
        return {
          ...t, currentStage: 0, lastRevised: today, timesRevised: t.timesRevised + 1,
          nextDue: addDays(today, INTERVALS[t.difficulty][0]),
          revisionLog: [...t.revisionLog, { date: today, action: "too_hard" as const }],
        };
      }),
    }));
  };

  const markTooEasy = (id: string) => {
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => {
        if (t.id !== id) return t;
        const intervals = INTERVALS[t.difficulty];
        const skipStage = Math.min(t.currentStage + 2, intervals.length);
        const mastered = skipStage >= intervals.length;
        return {
          ...t, currentStage: skipStage, lastRevised: today, timesRevised: t.timesRevised + 1,
          mastered,
          nextDue: mastered ? "9999-12-31" : addDays(today, intervals[Math.min(skipStage, intervals.length - 1)]),
          revisionLog: [...t.revisionLog, { date: today, action: "too_easy" as const }],
        };
      }),
    }));
  };

  // Upcoming 14 days
  const upcomingDays = useMemo(() => {
    const days: { date: string; count: number; topics: RevisionTopic[] }[] = [];
    const startOffset = upcomingWeekOffset * 14;
    for (let i = startOffset; i < startOffset + 14; i++) {
      const date = addDays(today, i);
      const topics = data.topics.filter(t => !t.mastered && t.nextDue === date);
      days.push({ date, count: topics.length, topics });
    }
    return days;
  }, [data.topics, today, upcomingWeekOffset]);

  // Filtered all topics
  const filteredTopics = useMemo(() => {
    return data.topics.filter(t => !t.mastered)
      .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.subject.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(t => !filterSubject || t.subject === filterSubject)
      .filter(t => !filterDiff || t.difficulty === filterDiff);
  }, [data.topics, searchQuery, filterSubject, filterDiff]);

  // Stats
  const stats = useMemo(() => {
    const activeTopics = data.topics.filter(t => !t.mastered);
    const subjectCounts: Record<string, number> = {};
    data.topics.forEach(t => { subjectCounts[t.subject] = (subjectCounts[t.subject] || 0) + t.timesRevised; });
    const mostRevised = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0];
    const dueThisWeek = activeTopics.filter(t => t.nextDue >= today && t.nextDue <= addDays(today, 7)).length;
    const completedThisWeek = data.topics.reduce((a, t) =>
      a + t.revisionLog.filter(r => r.date >= addDays(today, -7) && r.date <= today).length, 0);
    return {
      total: data.topics.length,
      mastered: masteredTopics.length,
      streak: data.streakDays,
      mostRevised: mostRevised ? mostRevised[0] : "N/A",
      dueThisWeek,
      completedThisWeek,
    };
  }, [data.topics, masteredTopics, today]);

  const allSubjects = useMemo(() => {
    const set = new Set(data.topics.map(t => t.subject));
    subjects.forEach(s => set.add(s.name));
    return Array.from(set);
  }, [data.topics, subjects]);

  const openEdit = (topic: RevisionTopic) => {
    setEditingTopic(topic);
    setForm({ name: topic.name, subject: topic.subject, difficulty: topic.difficulty, dateFirstStudied: topic.dateFirstStudied });
    setShowAdd(true);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "today", label: `Today${dueToday.length > 0 ? ` (${dueToday.length})` : ""}` },
    { key: "upcoming", label: "Upcoming" },
    { key: "all", label: "All Topics" },
    { key: "mastered", label: `Mastered (${masteredTopics.length})` },
    { key: "stats", label: "Stats" },
  ];

  const nextDueTopic = useMemo(() => {
    const future = data.topics.filter(t => !t.mastered && t.nextDue > today).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
    return future[0];
  }, [data.topics, today]);

  return (
    <div className="section-card section-revision flex flex-col gap-4">
      {/* Celebration overlay */}
      {celebration && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-[var(--radius)]" style={{ animation: "fade-in 0.3s ease-out" }}>
          <div className="text-center">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-lg font-bold text-foreground">All caught up for today!</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-[18px] font-semibold section-title-revision flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-revision/15 flex items-center justify-center">
            <Calendar className="w-[22px] h-[22px] text-revision" />
          </div>
          Revision Scheduler
        </h2>
        <div className="flex items-center gap-2">
          {dueToday.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
              {dueToday.length - completedToday.length} due today
            </span>
          )}
          {masteredTopics.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300">
              ⭐ {masteredTopics.length} mastered
            </span>
          )}
          <button onClick={() => { setEditingTopic(null); setForm({ name: "", subject: "", difficulty: "medium", dateFirstStudied: todayKey() }); setShowAdd(true); }} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20">
            <Plus className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1 tab-bar">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm font-medium transition-all whitespace-nowrap min-h-[36px] ${tab === t.key ? "tab-active" : "tab-inactive"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== TODAY TAB ===== */}
      {tab === "today" && (
        <div className="flex flex-col gap-2">
          {dueToday.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🌟</p>
              <p className="text-[15px] text-foreground font-medium">No revisions due today — enjoy your day!</p>
              {nextDueTopic && (
                <p className="text-sm text-muted-foreground mt-1">Next revision: <span className="text-indigo-400">{nextDueTopic.name}</span> on {nextDueTopic.nextDue}</p>
              )}
            </div>
          )}
          {dueToday.map(topic => {
            const isOverdue = topic.nextDue < today;
            const overdueDays = isOverdue ? daysDiff(topic.nextDue, today) : 0;
            const doneToday = topic.revisionLog.some(r => r.date === today);
            const intervals = INTERVALS[topic.difficulty];
            const dc = DIFF_COLORS[topic.difficulty];
            return (
              <div key={topic.id} className={`flex flex-col gap-2 p-3 rounded-xl transition-all ${doneToday ? "opacity-50" : ""} ${isOverdue && !doneToday ? "border-l-[3px] border-l-red-500 bg-red-500/5" : "bg-secondary/20 hover:bg-secondary/30"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[16px] font-bold text-foreground">{topic.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: topic.subjectColor ? `${topic.subjectColor}20` : "rgba(255,255,255,0.05)", color: topic.subjectColor || "hsl(var(--muted-foreground))" }}>
                        {topic.subject}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${dc.bg} ${dc.text}`}>{dc.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm">
                      {isOverdue && !doneToday ? (
                        <span className="text-red-400 font-medium">Overdue by {overdueDays} day{overdueDays > 1 ? "s" : ""}</span>
                      ) : doneToday ? (
                        <span className="text-indigo-400 font-medium">✓ Completed</span>
                      ) : (
                        <span className="text-amber-400">Due Today</span>
                      )}
                      <span className="text-muted-foreground text-xs">Stage {topic.currentStage + 1}/{intervals.length}</span>
                    </div>
                  </div>
                  {!doneToday && (
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => markRevised(topic.id)} className="px-3 py-2 rounded-xl text-xs font-medium bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-all" title="Revised">✓ Revised</button>
                      <button onClick={() => markTooHard(topic.id)} className="px-2.5 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all" title="Too Hard">😅</button>
                      <button onClick={() => markTooEasy(topic.id)} className="px-2.5 py-2 rounded-xl text-xs font-medium bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all" title="Too Easy">⚡</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== UPCOMING TAB ===== */}
      {tab === "upcoming" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button onClick={() => setUpcomingWeekOffset(Math.max(0, upcomingWeekOffset - 1))} className="icon-btn w-8 h-8 min-w-0 min-h-0 bg-secondary/40 text-muted-foreground hover:text-foreground" disabled={upcomingWeekOffset === 0}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-muted-foreground">Next 14 days</span>
            <button onClick={() => setUpcomingWeekOffset(upcomingWeekOffset + 1)} className="icon-btn w-8 h-8 min-w-0 min-h-0 bg-secondary/40 text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {upcomingDays.map(day => {
              const isToday = day.date === today;
              const dayNum = new Date(day.date + "T00:00:00").getDate();
              const dayName = new Date(day.date + "T00:00:00").toLocaleDateString("en", { weekday: "short" }).slice(0, 2);
              return (
                <button key={day.date} onClick={() => setSelectedDay(selectedDay === day.date ? null : day.date)}
                  className={`flex flex-col items-center p-2 rounded-xl text-xs transition-all ${isToday ? "bg-indigo-500/15 border border-indigo-500/30" : selectedDay === day.date ? "bg-secondary/60" : "bg-secondary/20 hover:bg-secondary/30"}`}>
                  <span className="text-[10px] text-muted-foreground">{dayName}</span>
                  <span className={`text-sm font-semibold ${isToday ? "text-indigo-400" : "text-foreground"}`}>{dayNum}</span>
                  {day.count > 0 && (
                    <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${day.count >= 5 ? "bg-amber-500/20 text-amber-400" : "bg-indigo-500/15 text-indigo-400"}`}>
                      {day.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {selectedDay && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <span className="text-sm text-muted-foreground font-medium">{selectedDay === today ? "Today" : new Date(selectedDay + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "short", day: "numeric" })}</span>
              {upcomingDays.find(d => d.date === selectedDay)?.topics.map(t => (
                <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/20">
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: t.subjectColor ? `${t.subjectColor}20` : "rgba(255,255,255,0.05)", color: t.subjectColor || "inherit" }}>{t.subject}</span>
                </div>
              ))}
              {(upcomingDays.find(d => d.date === selectedDay)?.count || 0) === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">No topics due this day</p>
              )}
              {(upcomingDays.find(d => d.date === selectedDay)?.count || 0) >= 5 && (
                <div className="flex items-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Heavy revision day — plan extra study time</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ===== ALL TOPICS TAB ===== */}
      {tab === "all" && (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search topics..." className="input-styled w-full pl-9 min-h-[40px] text-sm" />
            </div>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className="input-styled min-h-[40px] text-sm min-w-[100px]">
              <option value="">All Subjects</option>
              {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={filterDiff} onChange={e => setFilterDiff(e.target.value as Difficulty | "")} className="input-styled min-h-[40px] text-sm min-w-[90px]">
              <option value="">All</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          {filteredTopics.length === 0 && (
            <div className="text-center py-6">
              <p className="text-3xl mb-2">📚</p>
              <p className="text-[15px] text-white/70">No topics found</p>
            </div>
          )}
          {filteredTopics.map(topic => {
            const intervals = INTERVALS[topic.difficulty];
            const totalStages = intervals.length;
            const masteryPct = Math.min((topic.currentStage / totalStages) * 100, 100);
            const dc = DIFF_COLORS[topic.difficulty];
            return (
              <div key={topic.id} className="flex flex-col gap-2 p-3 rounded-xl bg-secondary/20 hover:bg-secondary/30 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[15px] font-semibold text-foreground">{topic.name}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: topic.subjectColor ? `${topic.subjectColor}20` : "rgba(255,255,255,0.05)", color: topic.subjectColor || "inherit" }}>{topic.subject}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${dc.bg} ${dc.text}`}>{dc.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Revised {topic.timesRevised}×</span>
                      <span>Stage {topic.currentStage}/{totalStages}</span>
                      <span>Next: {topic.nextDue <= today ? <span className="text-amber-400">Due!</span> : topic.nextDue.slice(5)}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(topic)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-muted-foreground hover:text-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => resetTopic(topic.id)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-muted-foreground hover:text-amber-400"><RotateCcw className="w-3.5 h-3.5" /></button>
                    <button onClick={() => deleteTopic(topic.id)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {/* Mastery bar */}
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 bg-indigo-500" style={{ width: `${masteryPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== MASTERED TAB ===== */}
      {tab === "mastered" && (
        <div className="flex flex-col gap-2">
          {masteredTopics.length === 0 && (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🎯</p>
              <p className="text-[15px] text-white/70">No mastered topics yet</p>
              <p className="text-sm text-white/60 mt-1">Complete all revision intervals to master a topic</p>
            </div>
          )}
          {masteredTopics.map(topic => (
            <div key={topic.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20 border-l-[3px] border-l-amber-400">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-foreground">{topic.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: topic.subjectColor ? `${topic.subjectColor}20` : "rgba(255,255,255,0.05)", color: topic.subjectColor || "inherit" }}>{topic.subject}</span>
                </div>
                <span className="text-xs text-muted-foreground">Revised {topic.timesRevised}× · Mastered</span>
              </div>
              <button onClick={() => resetTopic(topic.id)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-muted-foreground hover:text-amber-400" title="Reset"><RotateCcw className="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteTopic(topic.id)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-muted-foreground hover:text-red-400" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {tab === "stats" && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: "Total Topics", value: stats.total, icon: "📚" },
              { label: "Mastered", value: stats.mastered, icon: "⭐" },
              { label: "Rev. Streak", value: `${stats.streak}d`, icon: "🔥" },
              { label: "Most Revised", value: stats.mostRevised, icon: "🏆" },
              { label: "Due This Week", value: stats.dueThisWeek, icon: "📅" },
              { label: "Done This Week", value: stats.completedThisWeek, icon: "✅" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-secondary/30">
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className="text-lg font-bold font-mono text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {stats.dueThisWeek > 0 && (
            <div>
              <span className="text-xs text-muted-foreground mb-1 block">This Week Progress</span>
              <div className="h-3 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-500" style={{ width: `${Math.min((stats.completedThisWeek / stats.dueThisWeek) * 100, 100)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground mt-1">{stats.completedThisWeek}/{stats.dueThisWeek} completed</span>
            </div>
          )}
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => { setShowAdd(false); setEditingTopic(null); }}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[17px] font-bold text-foreground">{editingTopic ? "Edit Topic" : "Add Revision Topic"}</h3>
              <button onClick={() => { setShowAdd(false); setEditingTopic(null); }} className="icon-btn w-8 h-8 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Topic Name *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Thermodynamics" className="input-styled" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Subject</label>
                <div className="flex gap-2">
                  <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input-styled flex-1">
                    <option value="">Select or type...</option>
                    {allSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    {subjects.filter(s => !allSubjects.includes(s.name)).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="Or type new" className="input-styled flex-1" />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs text-muted-foreground">Difficulty</label>
                  <div className="flex gap-1">
                    {(["easy", "medium", "hard"] as Difficulty[]).map(d => (
                      <button key={d} onClick={() => setForm({ ...form, difficulty: d })}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${form.difficulty === d ? `${DIFF_COLORS[d].bg} ${DIFF_COLORS[d].text}` : "bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                        {DIFF_COLORS[d].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">Date Studied</label>
                  <input type="date" value={form.dateFirstStudied} onChange={e => setForm({ ...form, dateFirstStudied: e.target.value })} className="input-styled text-sm" />
                </div>
              </div>
              <button onClick={editingTopic ? updateTopic : addTopic} disabled={!form.name.trim()} className="btn-primary w-full bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30">
                {editingTopic ? "Update Topic" : "Add Topic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

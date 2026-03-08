import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Plus, Trash2, Edit2, X, ChevronDown, ChevronUp, Clock, Trophy, Flame, AlertTriangle, BookOpen } from "lucide-react";

// ===== TYPES =====
interface Subject {
  id: string;
  name: string;
  color: string;
  weeklyGoalHours: number;
}

interface StudySession {
  id: string;
  subjectId: string;
  subjectName: string;
  date: string; // ISO date
  startTime: string; // HH:MM
  durationMinutes: number;
  energyLevel?: number; // 1-5
  mode: "pomodoro" | "free";
}

interface StudyData {
  subjects: Subject[];
  sessions: StudySession[];
  allTimeSessions: StudySession[];
  lastWeekReset: string;
}

// ===== CONSTANTS =====
const STORAGE_KEY = "dashboard-study-timer";
const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

const SUBJECT_COLORS = [
  { name: "Blue", value: "hsl(210, 70%, 55%)" },
  { name: "Red", value: "hsl(0, 70%, 55%)" },
  { name: "Green", value: "hsl(140, 60%, 45%)" },
  { name: "Yellow", value: "hsl(45, 80%, 50%)" },
  { name: "Purple", value: "hsl(270, 60%, 55%)" },
  { name: "Orange", value: "hsl(25, 80%, 55%)" },
  { name: "Teal", value: "hsl(180, 60%, 45%)" },
  { name: "Pink", value: "hsl(330, 70%, 55%)" },
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "1", name: "Maths", color: SUBJECT_COLORS[0].value, weeklyGoalHours: 10 },
  { id: "2", name: "Physics", color: SUBJECT_COLORS[1].value, weeklyGoalHours: 8 },
  { id: "3", name: "Chemistry", color: SUBJECT_COLORS[2].value, weeklyGoalHours: 8 },
];

// ===== UTILS =====
function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((day + 6) % 7));
  return mon.toISOString().split("T")[0];
}

function todayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getDayName(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function loadData(): StudyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StudyData;
      const currentMonday = getMonday();
      if (data.lastWeekReset !== currentMonday) {
        // Weekly reset — archive current sessions to allTime, clear weekly
        return {
          subjects: data.subjects,
          sessions: [],
          allTimeSessions: [...(data.allTimeSessions || []), ...(data.sessions || [])],
          lastWeekReset: currentMonday,
        };
      }
      return { ...data, allTimeSessions: data.allTimeSessions || [] };
    }
  } catch {}
  return { subjects: DEFAULT_SUBJECTS, sessions: [], allTimeSessions: [], lastWeekReset: getMonday() };
}

function saveData(data: StudyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playTone = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = "sine";
      gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start); osc.stop(ctx.currentTime + start + dur);
    };
    playTone(880, 0, 0.12); playTone(880, 0.18, 0.12); playTone(1100, 0.36, 0.25);
  } catch {}
}

function getStudyStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;
  const dates = [...new Set(sessions.map(s => s.date))].sort().reverse();
  const today = todayKey();
  let streak = 0;
  let checkDate = new Date(today + "T12:00:00");

  // If no study today, start checking from yesterday
  if (!dates.includes(today)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toISOString().split("T")[0];
    if (dates.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// ===== MODAL =====
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
          <button onClick={onClose} className="icon-btn text-muted-foreground hover:text-foreground w-9 h-9 min-w-0 min-h-0"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ===== PIE CHART =====
function SubjectPieChart({ segments }: { segments: { color: string; pct: number; label: string }[] }) {
  const r = 42, cx = 50, cy = 50, circumference = 2 * Math.PI * r;
  let offset = 0;
  const filtered = segments.filter(s => s.pct > 0);
  if (filtered.length === 0) return (
    <div className="w-24 h-24 rounded-full border-2 border-dashed border-border flex items-center justify-center">
      <span className="text-sm text-muted-foreground">No data</span>
    </div>
  );
  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
        {filtered.map((seg, i) => {
          const dash = (seg.pct / 100) * circumference;
          const gap = circumference - dash;
          const so = -offset; offset += dash;
          return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="10" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={so} className="transition-all duration-500" />;
        })}
      </svg>
      <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
        {filtered.map((seg, i) => (
          <span key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            {seg.label} {Math.round(seg.pct)}%
          </span>
        ))}
      </div>
    </div>
  );
}

// ===== CELEBRATION =====
function CelebrationOverlay({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 animate-fade-in">
      <div className="text-center animate-bounce">
        <div className="text-5xl mb-2">🎉</div>
        <div className="text-[15px] font-semibold text-foreground">Session Complete!</div>
      </div>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function SubjectStudyTimer() {
  const [data, setData] = useState<StudyData>(loadData);
  const [activeTab, setActiveTab] = useState<"timer" | "stats" | "history">("timer");

  // Timer state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(data.subjects[0]?.id || "");
  const [mode, setMode] = useState<"pomodoro" | "free">("pomodoro");
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [freeStudySeconds, setFreeStudySeconds] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [showCelebration, setShowCelebration] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subject management
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [sf, setSf] = useState({ name: "", color: SUBJECT_COLORS[0].value, weeklyGoalHours: "8" });

  // Manual session
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualSession, setManualSession] = useState({ subjectId: "", date: todayKey(), startTime: "09:00", durationMinutes: "25" });

  // History filter
  const [historyFilter, setHistoryFilter] = useState("");

  useEffect(() => { saveData(data); }, [data]);

  const selectedSubject = data.subjects.find(s => s.id === selectedSubjectId);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      if (mode === "pomodoro") {
        setTimeLeft(prev => {
          if (prev <= 1) {
            playBeep();
            setIsRunning(false);
            if (!isBreak) {
              // Log session
              logSession(WORK_TIME / 60);
              setShowCelebration(true);
              setTimeout(() => setShowCelebration(false), 2000);
              setIsBreak(true);
              return BREAK_TIME;
            } else {
              setIsBreak(false);
              return WORK_TIME;
            }
          }
          return prev - 1;
        });
      } else {
        setFreeStudySeconds(prev => prev + 1);
      }
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isBreak, mode]);

  const logSession = useCallback((durationMinutes: number) => {
    if (!selectedSubject || durationMinutes < 0.5) return;
    const now = new Date();
    const session: StudySession = {
      id: Date.now().toString(),
      subjectId: selectedSubject.id,
      subjectName: selectedSubject.name,
      date: todayKey(),
      startTime: sessionStartTime ? `${sessionStartTime.getHours().toString().padStart(2, "0")}:${sessionStartTime.getMinutes().toString().padStart(2, "0")}` : `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`,
      durationMinutes,
      energyLevel,
      mode,
    };
    setData(prev => ({ ...prev, sessions: [...prev.sessions, session] }));
  }, [selectedSubject, energyLevel, mode, sessionStartTime]);

  const startTimer = () => {
    if (!selectedSubject) return;
    setSessionStartTime(new Date());
    setIsRunning(true);
  };

  const stopFreeStudy = () => {
    setIsRunning(false);
    if (freeStudySeconds > 30) {
      logSession(freeStudySeconds / 60);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
    setFreeStudySeconds(0);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === "pomodoro") {
      setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME);
    } else {
      setFreeStudySeconds(0);
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  // Subject CRUD
  const openSubjectModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      setSf({ name: subject.name, color: subject.color, weeklyGoalHours: String(subject.weeklyGoalHours) });
    } else {
      setEditingSubject(null);
      setSf({ name: "", color: SUBJECT_COLORS[0].value, weeklyGoalHours: "8" });
    }
    setShowSubjectModal(true);
  };

  const saveSubject = () => {
    if (!sf.name) return;
    const subject: Subject = { id: editingSubject?.id || Date.now().toString(), name: sf.name, color: sf.color, weeklyGoalHours: Number(sf.weeklyGoalHours) || 8 };
    if (editingSubject) {
      setData(prev => ({ ...prev, subjects: prev.subjects.map(s => s.id === editingSubject.id ? subject : s) }));
    } else {
      setData(prev => ({ ...prev, subjects: [...prev.subjects, subject] }));
    }
    setShowSubjectModal(false);
    if (!selectedSubjectId) setSelectedSubjectId(subject.id);
  };

  const deleteSubject = (id: string) => {
    setData(prev => ({ ...prev, subjects: prev.subjects.filter(s => s.id !== id) }));
    if (selectedSubjectId === id) setSelectedSubjectId(data.subjects.find(s => s.id !== id)?.id || "");
  };

  // Manual session
  const addManualSession = () => {
    const sub = data.subjects.find(s => s.id === manualSession.subjectId);
    if (!sub || !manualSession.durationMinutes) return;
    const session: StudySession = {
      id: Date.now().toString(), subjectId: sub.id, subjectName: sub.name,
      date: manualSession.date, startTime: manualSession.startTime,
      durationMinutes: Number(manualSession.durationMinutes), energyLevel: 3, mode: "free",
    };
    setData(prev => ({ ...prev, sessions: [...prev.sessions, session] }));
    setShowManualModal(false);
  };

  const deleteSession = (id: string) => {
    setData(prev => ({ ...prev, sessions: prev.sessions.filter(s => s.id !== id) }));
  };

  // Stats calculations
  const weekSessions = data.sessions;
  const todaySessions = weekSessions.filter(s => s.date === todayKey());
  const todayTotalMin = todaySessions.reduce((a, s) => a + s.durationMinutes, 0);
  const weekTotalMin = weekSessions.reduce((a, s) => a + s.durationMinutes, 0);
  const streak = getStudyStreak([...data.allTimeSessions, ...data.sessions]);
  const allSessions = [...data.allTimeSessions, ...data.sessions];

  // Per-subject weekly stats
  const subjectStats = data.subjects.map(sub => {
    const mins = weekSessions.filter(s => s.subjectId === sub.id).reduce((a, s) => a + s.durationMinutes, 0);
    const allTimeMins = allSessions.filter(s => s.subjectId === sub.id).reduce((a, s) => a + s.durationMinutes, 0);
    const goalMins = sub.weeklyGoalHours * 60;
    const pct = goalMins > 0 ? Math.min((mins / goalMins) * 100, 100) : 0;
    const remaining = Math.max(0, goalMins - mins);
    return { ...sub, mins, allTimeMins, goalMins, pct, remaining };
  });

  // Best day this week
  const dayMap: Record<string, number> = {};
  weekSessions.forEach(s => { dayMap[s.date] = (dayMap[s.date] || 0) + s.durationMinutes; });
  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

  // Best study time
  const hourBuckets: Record<number, number> = {};
  allSessions.forEach(s => {
    const h = parseInt(s.startTime?.split(":")[0] || "0");
    hourBuckets[h] = (hourBuckets[h] || 0) + s.durationMinutes;
  });
  const bestHour = Object.entries(hourBuckets).sort((a, b) => Number(b[1]) - Number(a[1]))[0];
  const bestTimeLabel = bestHour ? `${parseInt(bestHour[0]) > 12 ? parseInt(bestHour[0]) - 12 : parseInt(bestHour[0])}${parseInt(bestHour[0]) >= 12 ? "PM" : "AM"}` : "N/A";

  // Pie chart data
  const pieSegments = subjectStats.filter(s => s.mins > 0).map(s => ({
    color: s.color, pct: weekTotalMin > 0 ? (s.mins / weekTotalMin) * 100 : 0, label: s.name,
  }));

  // Insights
  const insights: string[] = [];
  subjectStats.forEach(s => {
    if (s.remaining > 0 && s.pct < 80) {
      insights.push(`📚 ${s.name}: ${formatDuration(s.remaining)} more needed this week to hit your goal`);
    }
  });
  const lastSessionDate = weekSessions.length > 0 ? weekSessions[weekSessions.length - 1].date : null;
  if (lastSessionDate && lastSessionDate !== todayKey()) {
    const lastDate = new Date(lastSessionDate + "T23:59:59");
    const hoursSince = (Date.now() - lastDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) insights.push("⚠️ You haven't studied in over 24 hours!");
  }
  if (weekSessions.length === 0) insights.push("⚠️ No study sessions this week yet. Let's get started!");

  // Filtered history
  const filteredSessions = [...weekSessions].reverse().filter(s => !historyFilter || s.subjectId === historyFilter);

  // Timer display
  const pomodoroTotalTime = isBreak ? BREAK_TIME : WORK_TIME;
  const pomodoroProgress = ((pomodoroTotalTime - timeLeft) / pomodoroTotalTime) * 100;
  const freeMinutes = Math.floor(freeStudySeconds / 60).toString().padStart(2, "0");
  const freeSeconds = (freeStudySeconds % 60).toString().padStart(2, "0");
  const pomMinutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const pomSeconds = (timeLeft % 60).toString().padStart(2, "0");
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (mode === "pomodoro" ? pomodoroProgress : Math.min((freeStudySeconds / 3600) * 100, 100)) / 100 * circumference;

  const activeColor = selectedSubject?.color || "hsl(var(--accent))";

  return (
    <div className="section-card section-study p-5 sm:p-6 flex flex-col gap-5 relative" style={{ animation: "fade-in 0.4s ease-out 0.1s forwards", opacity: "0" } as React.CSSProperties}>
      <CelebrationOverlay show={showCelebration} />

      {/* Header + Tabs */}
      <div className="flex items-center justify-between">
        <h2 className="text-[17px] font-semibold text-foreground flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-study/10 flex items-center justify-center">
            <BookOpen className="w-[18px] h-[18px] text-study" />
          </div>
          Study Timer
        </h2>
        <div className="flex items-center gap-1">
          {(["timer", "stats", "history"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all min-h-[36px] ${activeTab === tab ? "bg-study/15 text-study" : "text-muted-foreground hover:text-foreground"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TIMER TAB ===== */}
      {activeTab === "timer" && (
        <div className="flex flex-col items-center gap-3">
          {/* Subject selector */}
          <div className="flex items-center gap-2 w-full">
            <select value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} className="flex-1 bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" disabled={isRunning}>
              {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => openSubjectModal()} className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors" title="Add subject" disabled={isRunning}>
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Subject color indicator */}
          {selectedSubject && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedSubject.color }} />
              <span>{selectedSubject.name} · Goal: {selectedSubject.weeklyGoalHours}h/week</span>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex rounded-lg bg-secondary/40 p-0.5">
            <button onClick={() => { if (!isRunning) { setMode("pomodoro"); setTimeLeft(WORK_TIME); setFreeStudySeconds(0); } }} className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${mode === "pomodoro" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              🍅 Pomodoro
            </button>
            <button onClick={() => { if (!isRunning) { setMode("free"); setFreeStudySeconds(0); } }} className={`px-3 py-1.5 rounded-md text-[10px] font-medium transition-colors ${mode === "free" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              ⏱️ Free Study
            </button>
          </div>

          {/* Timer circle */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
              <circle cx="60" cy="60" r="54" fill="none" stroke={isBreak ? "hsl(var(--success, 140 60% 45%))" : activeColor} strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="transition-all duration-1000 ease-linear" />
            </svg>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-mono font-medium text-foreground tracking-wider">
                {mode === "pomodoro" ? `${pomMinutes}:${pomSeconds}` : `${freeMinutes}:${freeSeconds}`}
              </span>
              {isBreak && <div className="text-[9px] text-muted-foreground flex items-center gap-1 justify-center mt-0.5"><Coffee className="w-3 h-3" /> Break</div>}
            </div>
          </div>

          {/* Energy level */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">Energy:</span>
            {[1, 2, 3, 4, 5].map(l => (
              <button key={l} onClick={() => setEnergyLevel(l)} className={`w-5 h-5 rounded-full text-[10px] font-medium transition-all ${energyLevel >= l ? "text-foreground" : "text-muted-foreground/30"}`} disabled={isRunning}>
                {l <= 2 ? "😴" : l === 3 ? "😐" : l === 4 ? "⚡" : "🔥"}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {mode === "free" && isRunning ? (
              <button onClick={stopFreeStudy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors" style={{ backgroundColor: activeColor, color: "white" }}>
                <Pause className="w-3.5 h-3.5" /> Stop & Log
              </button>
            ) : (
              <button onClick={() => isRunning ? setIsRunning(false) : startTimer()} disabled={!selectedSubject} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted transition-colors disabled:opacity-30">
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? "Pause" : "Start"}
              </button>
            )}
            <button onClick={resetTimer} className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Today summary */}
          <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Today: <strong className="text-foreground">{formatDuration(todayTotalMin)}</strong></span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> Streak: <strong className="text-foreground">{streak} day{streak !== 1 ? "s" : ""}</strong></span>
          </div>
        </div>
      )}

      {/* ===== STATS TAB ===== */}
      {activeTab === "stats" && (
        <div className="flex flex-col gap-4">
          {/* Top stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <div className="text-lg font-semibold text-foreground">{formatDuration(todayTotalMin)}</div>
              <div className="text-[9px] text-muted-foreground">Today</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <div className="text-lg font-semibold text-foreground">{formatDuration(weekTotalMin)}</div>
              <div className="text-[9px] text-muted-foreground">This Week</div>
            </div>
            <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
              <div className="text-lg font-semibold text-foreground flex items-center justify-center gap-1"><Flame className="w-4 h-4" />{streak}</div>
              <div className="text-[9px] text-muted-foreground">Day Streak</div>
            </div>
          </div>

          {/* Pie chart + best day */}
          <div className="flex items-start gap-4">
            <SubjectPieChart segments={pieSegments} />
            <div className="flex-1 flex flex-col gap-1.5 text-[10px]">
              {bestDay && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Trophy className="w-3 h-3" /> Best day: <strong className="text-foreground">{getDayName(bestDay[0])} ({formatDuration(bestDay[1])})</strong>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3 h-3" /> Best time: <strong className="text-foreground">{bestTimeLabel}</strong>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <BookOpen className="w-3 h-3" /> Sessions: <strong className="text-foreground">{weekSessions.length}</strong>
              </div>
            </div>
          </div>

          {/* Subject progress bars */}
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-muted-foreground font-medium">Weekly Progress by Subject</span>
            {subjectStats.map(s => (
              <div key={s.id} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-foreground">{s.name}</span>
                  </div>
                  <span className="text-muted-foreground">{formatDuration(s.mins)} / {s.weeklyGoalHours}h — {Math.round(s.pct)}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                </div>
                {s.allTimeMins > 0 && (
                  <span className="text-[9px] text-muted-foreground ml-3.5">All time: {formatDuration(s.allTimeMins)}</span>
                )}
              </div>
            ))}
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="flex flex-col gap-1.5 bg-secondary/30 rounded-lg p-3">
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Insights</span>
              {insights.map((ins, i) => (
                <span key={i} className="text-[10px] text-foreground">{ins}</span>
              ))}
            </div>
          )}

          {/* Manage subjects */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">Subjects</span>
              <button onClick={() => openSubjectModal()} className="text-[10px] text-accent hover:underline">+ Add</button>
            </div>
            {data.subjects.map(s => (
              <div key={s.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs text-foreground">{s.name}</span>
                  <span className="text-[9px] text-muted-foreground">{s.weeklyGoalHours}h/wk</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openSubjectModal(s)} className="p-1 text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => deleteSubject(s.id)} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== HISTORY TAB ===== */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} className="flex-1 bg-secondary/50 border border-border/60 rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none">
              <option value="">All Subjects</option>
              {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button onClick={() => { setManualSession({ subjectId: data.subjects[0]?.id || "", date: todayKey(), startTime: "09:00", durationMinutes: "25" }); setShowManualModal(true); }} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors" title="Add manual session">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredSessions.length > 0 ? (
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
              {filteredSessions.map(s => {
                const sub = data.subjects.find(sub => sub.id === s.subjectId);
                return (
                  <div key={s.id} className="group flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/40 transition-colors">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sub?.color || "hsl(var(--muted))" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-foreground">{s.subjectName}</span>
                        <span className="text-[10px] text-muted-foreground">{formatDuration(s.durationMinutes)}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        {getDayName(s.date)} {s.date} · {s.startTime} · {s.mode === "pomodoro" ? "🍅" : "⏱️"} {s.energyLevel ? ["😴", "😴", "😐", "⚡", "🔥"][s.energyLevel - 1] : ""}
                      </div>
                    </div>
                    <button onClick={() => deleteSession(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground text-center py-4">No sessions recorded yet. Start studying!</p>
          )}
        </div>
      )}

      {/* Subject Modal */}
      <Modal open={showSubjectModal} onClose={() => setShowSubjectModal(false)} title={editingSubject ? "Edit Subject" : "Add Subject"}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Subject Name *</label>
            <input value={sf.name} onChange={e => setSf({ ...sf, name: e.target.value })} placeholder="e.g. Mathematics" className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Color</label>
            <div className="flex gap-2">
              {SUBJECT_COLORS.map(c => (
                <button key={c.value} onClick={() => setSf({ ...sf, color: c.value })} className={`w-7 h-7 rounded-full border-2 transition-all ${sf.color === c.value ? "border-foreground scale-110" : "border-transparent"}`} style={{ backgroundColor: c.value }} title={c.name} />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Weekly Goal (hours)</label>
            <input type="number" value={sf.weeklyGoalHours} onChange={e => setSf({ ...sf, weeklyGoalHours: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent/40 w-24" min="1" />
          </div>
          <button onClick={saveSubject} disabled={!sf.name} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30">
            {editingSubject ? "Update" : "Add Subject"}
          </button>
        </div>
      </Modal>

      {/* Manual Session Modal */}
      <Modal open={showManualModal} onClose={() => setShowManualModal(false)} title="Add Manual Session">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Subject</label>
            <select value={manualSession.subjectId} onChange={e => setManualSession({ ...manualSession, subjectId: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none">
              {data.subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Date</label>
              <input type="date" value={manualSession.date} onChange={e => setManualSession({ ...manualSession, date: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-2 py-2 text-xs text-foreground focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-muted-foreground">Start Time</label>
              <input type="time" value={manualSession.startTime} onChange={e => setManualSession({ ...manualSession, startTime: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-2 py-2 text-xs text-foreground focus:outline-none" />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">Duration (minutes)</label>
            <input type="number" value={manualSession.durationMinutes} onChange={e => setManualSession({ ...manualSession, durationMinutes: e.target.value })} className="bg-secondary border border-border/60 rounded-md px-3 py-2 text-xs text-foreground focus:outline-none w-24" min="1" />
          </div>
          <button onClick={addManualSession} disabled={!manualSession.subjectId} className="px-4 py-2 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-30">
            Add Session
          </button>
        </div>
      </Modal>
    </div>
  );
}

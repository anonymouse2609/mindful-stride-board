import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, Download, Upload, Info, Plus, Edit2, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SETTINGS_KEY = "user_settings";

interface HabitSetting {
  name: string;
  dailyTarget: number;
}

interface UserSettings {
  profile: {
    name: string;
    age: number;
    weight: number;
    height: number;
  };
  goals: {
    dailyCalorieGoal: number;
    proteinGoal: number;
    carbsGoal: number;
    fatGoal: number;
    fiberGoal: number;
    waterIntakeGoal: number;
  };
  pomodoro: {
    workDuration: number;
    shortBreak: number;
    longBreak: number;
    longBreakAfter: number;
  };
  habits: HabitSetting[];
  notifications: {
    enabled: boolean;
    reminderTimes: string[];
  };
  focusScore: {
    studyEnabled: boolean;
    nutritionEnabled: boolean;
    habitsEnabled: boolean;
    energyEnabled: boolean;
    studyPoints: number;
    nutritionPoints: number;
    habitsPoints: number;
    energyPoints: number;
  };
}

const DEFAULT_SETTINGS: UserSettings = {
  profile: { name: "", age: 25, weight: 70, height: 170 },
  goals: { dailyCalorieGoal: 2000, proteinGoal: 80, carbsGoal: 250, fatGoal: 65, fiberGoal: 25, waterIntakeGoal: 8 },
  pomodoro: { workDuration: 25, shortBreak: 5, longBreak: 15, longBreakAfter: 4 },
  habits: [
    { name: "💧 Drink water", dailyTarget: 8 },
    { name: "🏃 Exercise", dailyTarget: 1 },
    { name: "📚 Study", dailyTarget: 2 },
    { name: "😴 Sleep 7h+", dailyTarget: 1 },
    { name: "🧘 Meditate", dailyTarget: 1 },
  ],
  notifications: { enabled: true, reminderTimes: ["09:00", "14:00", "19:00"] },
  focusScore: {
    studyEnabled: true, nutritionEnabled: true, habitsEnabled: true, energyEnabled: true,
    studyPoints: 35, nutritionPoints: 25, habitsPoints: 25, energyPoints: 15,
  },
};

function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile }, goals: { ...DEFAULT_SETTINGS.goals, ...parsed.goals }, pomodoro: { ...DEFAULT_SETTINGS.pomodoro, ...parsed.pomodoro }, habits: parsed.habits || DEFAULT_SETTINGS.habits, notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications }, focusScore: { ...DEFAULT_SETTINGS.focusScore, ...parsed.focusScore } };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<number | null>(null);
  const [newHabitName, setNewHabitName] = useState("");
  const [newReminderTime, setNewReminderTime] = useState("");

  useEffect(() => { saveSettings(settings); }, [settings]);

  const updateProfile = (key: keyof UserSettings["profile"], value: string | number) => {
    setSettings(prev => ({ ...prev, profile: { ...prev.profile, [key]: value } }));
  };

  const updateGoals = (key: keyof UserSettings["goals"], value: number) => {
    setSettings(prev => ({ ...prev, goals: { ...prev.goals, [key]: value } }));
  };

  const updatePomodoro = (key: keyof UserSettings["pomodoro"], value: number) => {
    setSettings(prev => ({ ...prev, pomodoro: { ...prev.pomodoro, [key]: value } }));
  };

  const updateFocusScore = (key: keyof UserSettings["focusScore"], value: boolean | number) => {
    setSettings(prev => ({ ...prev, focusScore: { ...prev.focusScore, [key]: value } }));
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    setSettings(prev => ({
      ...prev,
      habits: [...prev.habits, { name: newHabitName.trim(), dailyTarget: 1 }]
    }));
    setNewHabitName("");
  };

  const updateHabit = (index: number, key: keyof HabitSetting, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      habits: prev.habits.map((h, i) => i === index ? { ...h, [key]: value } : h)
    }));
  };

  const removeHabit = (index: number) => {
    setSettings(prev => ({
      ...prev,
      habits: prev.habits.filter((_, i) => i !== index)
    }));
  };

  const addReminderTime = () => {
    if (!newReminderTime) return;
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        reminderTimes: [...prev.notifications.reminderTimes, newReminderTime]
      }
    }));
    setNewReminderTime("");
  };

  const removeReminderTime = (time: string) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        reminderTimes: prev.notifications.reminderTimes.filter(t => t !== time)
      }
    }));
  };

  const exportData = () => {
    const allData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try { allData[key] = JSON.parse(localStorage.getItem(key)!); } catch { allData[key] = localStorage.getItem(key); }
      }
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mindful-stride-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Data exported successfully! 📁" });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        Object.keys(data).forEach(key => {
          localStorage.setItem(key, typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]));
        });
        // Reload settings
        setSettings(loadSettings());
        toast({ title: "Data imported successfully! 📁" });
      } catch (error) {
        toast({ title: "Failed to import data. Please check the file format.", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const clearAllData = () => {
    const keysToKeep = ["growth-theme"];
    const theme = localStorage.getItem("growth-theme");
    localStorage.clear();
    if (theme) localStorage.setItem("growth-theme", theme);
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    setShowClearConfirm(false);
    toast({ title: "All data cleared! 🗑️", description: "Your app has been reset to defaults." });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 md:px-10 lg:px-20 md:py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="icon-btn w-10 h-10 min-w-0 min-h-0 bg-secondary/50 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>

        {/* Profile */}
        <div className="section-card section-focus flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">👤 Profile</h2>
          <div className="mb-3 p-3 rounded-lg bg-secondary/30">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <input value={settings.profile.name} onChange={e => updateProfile("name", e.target.value)} placeholder="Your name" className="input-styled" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Age</label>
              <input type="number" value={settings.profile.age} onChange={e => updateProfile("age", Number(e.target.value))} className="input-styled" min="1" max="120" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Weight (kg)</label>
              <input type="number" value={settings.profile.weight} onChange={e => updateProfile("weight", Number(e.target.value))} className="input-styled" min="1" step="0.1" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Height (cm)</label>
              <input type="number" value={settings.profile.height} onChange={e => updateProfile("height", Number(e.target.value))} className="input-styled" min="50" max="250" />
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="section-card section-nutrition flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">🎯 Daily Goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Calories</label>
              <input type="number" value={settings.goals.calories} onChange={e => updateGoals("calories", Number(e.target.value))} className="input-styled" min="500" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Protein (g)</label>
              <input type="number" value={settings.goals.protein} onChange={e => updateGoals("protein", Number(e.target.value))} className="input-styled" min="10" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Carbs (g)</label>
              <input type="number" value={settings.goals.carbs} onChange={e => updateGoals("carbs", Number(e.target.value))} className="input-styled" min="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Fat (g)</label>
              <input type="number" value={settings.goals.fat} onChange={e => updateGoals("fat", Number(e.target.value))} className="input-styled" min="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Fiber (g)</label>
              <input type="number" value={settings.goals.fiber} onChange={e => updateGoals("fiber", Number(e.target.value))} className="input-styled" min="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Water (ml)</label>
              <input type="number" value={settings.goals.water} onChange={e => updateGoals("water", Number(e.target.value))} className="input-styled" min="0" step="100" />
            </div>
          </div>
        </div>

        {/* Pomodoro */}
        <div className="section-card section-pomodoro flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">🍅 Pomodoro Timer</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Work (min)</label>
              <input type="number" value={settings.pomodoro.workDuration} onChange={e => updatePomodoro("workDuration", Number(e.target.value))} className="input-styled" min="1" max="120" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Short Break (min)</label>
              <input type="number" value={settings.pomodoro.shortBreak} onChange={e => updatePomodoro("shortBreak", Number(e.target.value))} className="input-styled" min="1" max="30" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Long Break (min)</label>
              <input type="number" value={settings.pomodoro.longBreak} onChange={e => updatePomodoro("longBreak", Number(e.target.value))} className="input-styled" min="1" max="60" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Long Break After</label>
              <input type="number" value={settings.pomodoro.longBreakAfter} onChange={e => updatePomodoro("longBreakAfter", Number(e.target.value))} className="input-styled" min="2" max="10" />
            </div>
          </div>
        </div>

        {/* Habits */}
        <div className="section-card section-habits flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">📅 Habits</h2>
          <div className="space-y-3">
            {settings.habits.map((habit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <input
                  value={habit.name}
                  onChange={e => updateHabit(index, "name", e.target.value)}
                  placeholder="Habit name"
                  className="flex-1 input-styled text-sm"
                />
                <input
                  type="number"
                  value={habit.dailyTarget}
                  onChange={e => updateHabit(index, "dailyTarget", Number(e.target.value))}
                  placeholder="Target"
                  className="w-20 input-styled text-sm"
                  min="1"
                />
                <button onClick={() => removeHabit(index)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addHabit} className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
              <Plus className="w-4 h-4" /> Add New Habit
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="section-card section-study flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">🔔 Notifications</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-foreground">Timer completion alerts</span>
            <button
              onClick={() => setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, timerAlerts: !prev.notifications.timerAlerts } }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${settings.notifications.timerAlerts ? "bg-accent" : "bg-secondary"}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${settings.notifications.timerAlerts ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Reminder Times</label>
            {settings.notifications.reminderTimes.map((time, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="time"
                  value={time}
                  onChange={e => updateReminderTime(index, e.target.value)}
                  className="input-styled text-sm"
                />
                <button onClick={() => removeReminderTime(time)} className="icon-btn w-8 h-8 min-w-0 min-h-0 text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button onClick={addReminderTime} className="btn-secondary flex items-center gap-2 text-sm w-full justify-center">
              <Plus className="w-4 h-4" /> Add Reminder Time
            </button>
          </div>
        </div>

        {/* Focus Score */}
        <div className="section-card section-goals flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">⚡ Focus Score</h2>
          <p className="text-xs text-muted-foreground">Toggle which categories contribute to your Focus Score</p>
          {[
            { key: "study" as const, label: "📚 Study", pointsKey: "studyPoints" as const, enabledKey: "studyEnabled" as const },
            { key: "nutrition" as const, label: "🥗 Nutrition", pointsKey: "nutritionPoints" as const, enabledKey: "nutritionEnabled" as const },
            { key: "habits" as const, label: "✅ Habits", pointsKey: "habitsPoints" as const, enabledKey: "habitsEnabled" as const },
            { key: "energy" as const, label: "⚡ Energy", pointsKey: "energyPoints" as const, enabledKey: "energyEnabled" as const },
          ].map(cat => (
            <div key={cat.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateFocusScore(cat.enabledKey, !settings.focusScore[cat.enabledKey])}
                  className={`relative w-11 h-6 rounded-full transition-colors ${settings.focusScore[cat.enabledKey] ? "bg-accent" : "bg-secondary"}`}
                >
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${settings.focusScore[cat.enabledKey] ? "translate-x-5" : "translate-x-0"}`} />
                </button>
                <span className="text-sm text-foreground">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" value={settings.focusScore[cat.pointsKey]} onChange={e => updateFocusScore(cat.pointsKey, Number(e.target.value))} className="input-styled w-16 text-center min-h-[36px] text-sm" min="0" max="100" />
                <span className="text-xs text-muted-foreground">pts</span>
              </div>
            </div>
          ))}
        </div>

        {/* Theme */}
        <div className="section-card section-chatbot flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">🎨 Theme</h2>
          <ThemeToggle />
        </div>

        {/* Data */}
        <div className="section-card section-habits flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">💾 Data</h2>
          <div className="flex gap-3">
            <button onClick={exportData} className="btn-secondary flex items-center gap-2 text-sm">
              <Download className="w-4 h-4" /> Export as JSON
            </button>
            <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Import from JSON
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
            <button onClick={() => setShowClearConfirm(true)} className="btn-secondary text-destructive border-destructive/30 flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Clear All Data
            </button>
          </div>
          {showClearConfirm && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col gap-3">
              <p className="text-sm text-foreground font-medium">⚠️ Are you sure? This will permanently delete all your data including habits, nutrition logs, study sessions, and focus score history.</p>
              <div className="flex gap-2">
                <button onClick={clearAllData} className="btn-primary bg-destructive text-white text-sm">Yes, Clear Everything</button>
                <button onClick={() => setShowClearConfirm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Account */}
        <div className="section-card section-study flex flex-col gap-4">
          <h2 className="text-[16px] font-semibold text-foreground">🔐 Account</h2>
          <button
            onClick={signOut}
            className="btn-secondary text-destructive border-destructive/30 flex items-center gap-2 text-sm w-full justify-center hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>

        {/* About */}
        <div className="section-card section-revision flex flex-col gap-3">
          <h2 className="text-[16px] font-semibold text-foreground">ℹ️ About</h2>
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Growth App v1.0.0</span>
          </div>
          <p className="text-sm text-muted-foreground">Built with love ❤️ for students who want to grow every day.</p>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UserSettings {
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
  habits: { name: string; dailyTarget: number }[];
  notifications: {
    enabled: boolean;
    timerAlerts: boolean;
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

const SETTINGS_KEY = "user_settings";

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
  notifications: { enabled: true, timerAlerts: true, reminderTimes: ["09:00", "14:00", "19:00"] },
  focusScore: {
    studyEnabled: true, nutritionEnabled: true, habitsEnabled: true, energyEnabled: true,
    studyPoints: 35, nutritionPoints: 25, habitsPoints: 25, energyPoints: 15,
  },
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_SETTINGS, ...parsed, profile: { ...DEFAULT_SETTINGS.profile, ...parsed.profile }, goals: { ...DEFAULT_SETTINGS.goals, ...parsed.goals }, pomodoro: { ...DEFAULT_SETTINGS.pomodoro, ...parsed.pomodoro }, habits: parsed.habits || DEFAULT_SETTINGS.habits, notifications: { ...DEFAULT_SETTINGS.notifications, ...parsed.notifications }, focusScore: { ...DEFAULT_SETTINGS.focusScore, ...parsed.focusScore } };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveSettings(s: UserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

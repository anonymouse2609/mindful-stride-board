import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee, Bell } from "lucide-react";

const WORK_TIME_MS = 25 * 60 * 1000;
const BREAK_TIME_MS = 5 * 60 * 1000;

const POMO_STORAGE = "pomo-timer-state";

interface PomoState {
  startedAt: number | null;
  duration: number;
  isBreak: boolean;
  sessions: number;
  pausedRemaining: number | null; // ms remaining when paused
}

function loadPomoState(): PomoState {
  try {
    const raw = localStorage.getItem(POMO_STORAGE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, duration: WORK_TIME_MS, isBreak: false, sessions: 0, pausedRemaining: null };
}

function savePomoState(s: PomoState) {
  localStorage.setItem(POMO_STORAGE, JSON.stringify(s));
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

function notifyComplete(isBreak: boolean) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("Growth App", {
      body: isBreak ? "Break over! Ready to focus? 💪" : "Pomodoro complete! Time for a break 🎉",
      icon: "/icon.svg",
    });
  }
}

async function requestNotifPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

export default function PomodoroTimer() {
  const [state, setState] = useState<PomoState>(loadPomoState);
  const [displayMs, setDisplayMs] = useState(0);
  const wakeLockRef = useRef<any>(null);

  const isRunning = state.startedAt !== null;

  // Calculate remaining ms
  const getRemaining = useCallback(() => {
    if (state.startedAt !== null) {
      return Math.max(0, state.duration - (Date.now() - state.startedAt));
    }
    return state.pausedRemaining ?? state.duration;
  }, [state]);

  // Handle timer completion
  const handleComplete = useCallback((s: PomoState) => {
    playBeep();
    notifyComplete(s.isBreak);
    releaseWakeLock();
    const newState: PomoState = {
      startedAt: null,
      duration: s.isBreak ? WORK_TIME_MS : BREAK_TIME_MS,
      isBreak: !s.isBreak,
      sessions: s.isBreak ? s.sessions : s.sessions + 1,
      pausedRemaining: null,
    };
    setState(newState);
    savePomoState(newState);
  }, []);

  // Display update loop
  useEffect(() => {
    const remaining = getRemaining();
    setDisplayMs(remaining);

    if (!isRunning) return;

    if (remaining <= 0) {
      handleComplete(state);
      return;
    }

    const interval = setInterval(() => {
      const r = getRemaining();
      setDisplayMs(r);
      if (r <= 0) {
        clearInterval(interval);
        handleComplete(state);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isRunning, state, getRemaining, handleComplete]);

  // Restore on mount + visibility change
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === "visible" && state.startedAt !== null) {
        const r = getRemaining();
        if (r <= 0) {
          handleComplete(state);
        } else {
          setDisplayMs(r);
        }
      }
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [state, getRemaining, handleComplete]);

  // Wake lock
  const requestWakeLock = async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
      }
    } catch {}
  };
  const releaseWakeLock = async () => {
    try { if (wakeLockRef.current) { await wakeLockRef.current.release(); wakeLockRef.current = null; } } catch {}
  };

  const start = () => {
    requestNotifPermission();
    requestWakeLock();
    const remaining = state.pausedRemaining ?? state.duration;
    const newState: PomoState = { ...state, startedAt: Date.now(), duration: remaining, pausedRemaining: null };
    setState(newState);
    savePomoState(newState);
  };

  const pause = () => {
    releaseWakeLock();
    const remaining = getRemaining();
    const newState: PomoState = { ...state, startedAt: null, pausedRemaining: remaining };
    setState(newState);
    savePomoState(newState);
  };

  const reset = () => {
    releaseWakeLock();
    const newState: PomoState = { ...state, startedAt: null, pausedRemaining: null, duration: state.isBreak ? BREAK_TIME_MS : WORK_TIME_MS };
    setState(newState);
    savePomoState(newState);
  };

  const totalMs = state.isBreak ? BREAK_TIME_MS : WORK_TIME_MS;
  const progress = ((totalMs - displayMs) / totalMs) * 100;
  const totalSec = Math.ceil(displayMs / 1000);
  const minutes = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const seconds = (totalSec % 60).toString().padStart(2, "0");

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col items-center gap-3 sm:gap-4" style={{ animation: "fade-in 0.4s ease-out 0.1s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-sm font-medium text-foreground">
          {state.isBreak ? (
            <span className="flex items-center gap-1.5"><Coffee className="w-4 h-4 text-success" /> Break</span>
          ) : "Pomodoro"}
        </h2>
        <span className="text-[11px] font-mono text-muted-foreground">{state.sessions} sessions</span>
      </div>

      <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={state.isBreak ? "hsl(var(--success))" : "hsl(var(--accent))"}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-linear"
          />
        </svg>
        <span className="text-xl sm:text-2xl font-mono font-medium text-foreground tracking-wider">
          {minutes}:{seconds}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => isRunning ? pause() : start()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-muted transition-colors"
        >
          {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

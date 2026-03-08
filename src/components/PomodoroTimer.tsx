import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function playBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const playTone = (freq: number, start: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur);
  };
  playTone(880, 0, 0.12);
  playTone(880, 0.18, 0.12);
  playTone(1100, 0.36, 0.25);
}

export default function PomodoroTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalTime = isBreak ? BREAK_TIME : WORK_TIME;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(isBreak ? BREAK_TIME : WORK_TIME);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [isBreak]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          playBeep();
          setIsRunning(false);
          if (!isBreak) {
            setSessions((s) => s + 1);
            setIsBreak(true);
            return BREAK_TIME;
          } else {
            setIsBreak(false);
            return WORK_TIME;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, isBreak]);

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card p-5 flex flex-col items-center gap-4" style={{ animation: "fade-in 0.4s ease-out 0.1s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-sm font-medium text-foreground">
          {isBreak ? (
            <span className="flex items-center gap-1.5"><Coffee className="w-4 h-4 text-success" /> Break</span>
          ) : "Pomodoro"}
        </h2>
        <span className="text-[11px] font-mono text-muted-foreground">{sessions} sessions</span>
      </div>

      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--accent))"}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <span className="text-2xl font-mono font-medium text-foreground tracking-wider">
          {minutes}:{seconds}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsRunning(!isRunning)}
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

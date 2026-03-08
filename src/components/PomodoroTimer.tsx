import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, Coffee } from "lucide-react";

const WORK_TIME = 25 * 60;
const BREAK_TIME = 5 * 60;

function playBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const playTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + duration);
  };
  playTone(880, 0, 0.15);
  playTone(880, 0.2, 0.15);
  playTone(1100, 0.4, 0.3);
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

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="glass-card p-6 flex flex-col items-center gap-4" style={{ animation: "fade-in 0.6s ease-out 0.1s forwards", opacity: 0 }}>
      <div className="flex items-center justify-between w-full">
        <h2 className="text-lg font-semibold text-foreground">
          {isBreak ? (
            <span className="flex items-center gap-2"><Coffee className="w-5 h-5 text-success" /> Break</span>
          ) : "Pomodoro"}
        </h2>
        <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded-md">
          {sessions} done
        </span>
      </div>

      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="90" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
          <circle
            cx="100" cy="100" r="90" fill="none"
            stroke={isBreak ? "hsl(var(--success))" : "hsl(var(--primary))"}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className={`text-center ${isRunning ? "animate-pulse-ring" : ""} rounded-full`}>
          <span className="text-5xl font-mono font-semibold text-foreground tracking-wider">
            {minutes}:{seconds}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm hover:opacity-80 transition-opacity"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

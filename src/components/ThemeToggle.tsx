import { useState, useEffect } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "auto";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const resolved = theme === "auto" ? getSystemTheme() : theme;
  document.documentElement.classList.toggle("dark", resolved === "dark");
  document.documentElement.classList.toggle("light", resolved === "light");
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("growth-theme") as Theme) || "dark";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem("growth-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: "light", icon: <Sun className="w-3.5 h-3.5" />, label: "Light" },
    { value: "dark", icon: <Moon className="w-3.5 h-3.5" />, label: "Dark" },
    { value: "auto", icon: <Monitor className="w-3.5 h-3.5" />, label: "Auto" },
  ];

  return (
    <div className="flex items-center gap-0.5 p-1 rounded-xl bg-secondary/40 border border-border/50">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setTheme(opt.value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            theme === opt.value
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title={opt.label}
        >
          {opt.icon}
          <span className="hidden sm:inline">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Plus, Trash2, Check } from "lucide-react";

type Priority = "high" | "medium" | "low";

interface Todo {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
}

const STORAGE_KEY = "dashboard-todos";
const todayKey = () => new Date().toISOString().split("T")[0];

function loadTodos(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.date !== todayKey()) return [];
    return data.todos || [];
  } catch { return []; }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), todos }));
}

const priorityDot: Record<Priority, string> = {
  high: "bg-high",
  medium: "bg-medium",
  low: "bg-low",
};

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>(loadTodos);
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");

  useEffect(() => { saveTodos(todos); }, [todos]);

  const addTodo = () => {
    if (!input.trim()) return;
    setTodos([...todos, { id: Date.now().toString(), text: input.trim(), priority, done: false }]);
    setInput("");
  };

  const toggle = (id: string) =>
    setTodos(todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const remove = (id: string) => setTodos(todos.filter((t) => t.id !== id));

  const sorted = [...todos].sort((a, b) => {
    const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
    if (a.done !== b.done) return a.done ? 1 : -1;
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="glass-card p-5 flex flex-col gap-3" style={{ animation: "fade-in 0.4s ease-out 0.2s forwards", opacity: 0 }}>
      <h2 className="text-sm font-medium text-foreground">Tasks</h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          className="flex-1 bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
        />
        <div className="flex rounded-lg overflow-hidden border border-border/60 bg-secondary/30">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-2 py-2 transition-colors ${
                priority === p ? "bg-secondary" : "hover:bg-secondary/60"
              }`}
            >
              <span className={`block w-2 h-2 rounded-full ${priorityDot[p]}`} />
            </button>
          ))}
        </div>
        <button
          onClick={addTodo}
          className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No tasks yet</p>
        )}
        {sorted.map((todo) => (
          <div
            key={todo.id}
            className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
              todo.done ? "opacity-40" : "hover:bg-secondary/50"
            }`}
          >
            <button
              onClick={() => toggle(todo.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${
                todo.done
                  ? "bg-accent/80 border-accent animate-check-pop"
                  : "border-muted-foreground/40 hover:border-accent"
              }`}
            >
              {todo.done && <Check className="w-2.5 h-2.5 text-accent-foreground" />}
            </button>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${priorityDot[todo.priority]}`} />
            <span className={`flex-1 text-xs ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {todo.text}
            </span>
            <button onClick={() => remove(todo.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

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

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  high: { label: "H", className: "bg-high/20 text-high" },
  medium: { label: "M", className: "bg-medium/20 text-medium" },
  low: { label: "L", className: "bg-low/20 text-low" },
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
    <div className="glass-card p-6 flex flex-col gap-4" style={{ animation: "fade-in 0.6s ease-out 0.2s forwards", opacity: 0 }}>
      <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <div className="flex rounded-lg overflow-hidden border border-border">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-2.5 py-2 text-xs font-bold transition-colors ${
                priority === p ? priorityConfig[p].className : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {priorityConfig[p].label}
            </button>
          ))}
        </div>
        <button
          onClick={addTodo}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {sorted.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">No tasks yet. Add one above!</p>
        )}
        {sorted.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              todo.done ? "bg-secondary/30 opacity-50" : "bg-secondary/50 hover:bg-secondary/70"
            }`}
          >
            <button
              onClick={() => toggle(todo.id)}
              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                todo.done
                  ? "bg-success border-success animate-check-pop"
                  : "border-muted-foreground hover:border-primary"
              }`}
            >
              {todo.done && <Check className="w-3 h-3 text-success-foreground" />}
            </button>
            <span className={`flex-1 text-sm ${todo.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
              {todo.text}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityConfig[todo.priority].className}`}>
              {todo.priority.toUpperCase()}
            </span>
            <button onClick={() => remove(todo.id)} className="text-muted-foreground hover:text-destructive transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

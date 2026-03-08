import { useState, useEffect } from "react";
import { Plus, Trash2, Check, ListTodo } from "lucide-react";

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
    <div className="section-card section-music" style={{ animation: "fade-in 0.4s ease-out 0.2s forwards", opacity: "0" } as React.CSSProperties & Record<string, string>}>
      <h2 className="text-[18px] font-semibold section-title-pomodoro flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-xl bg-pomodoro/15 flex items-center justify-center">
          <ListTodo className="w-[22px] h-[22px] text-pomodoro" />
        </div>
        Tasks
      </h2>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a task..."
          className="input-styled flex-1 min-w-0"
        />
        <div className="flex rounded-xl overflow-hidden border border-white/20 bg-white/8 shrink-0 items-center">
          {(["high", "medium", "low"] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-3 transition-colors min-h-[44px] ${
                priority === p ? "bg-secondary" : "hover:bg-secondary/60"
              }`}
            >
              <span className={`block w-2.5 h-2.5 rounded-full ${priorityDot[p]}`} />
            </button>
          ))}
        </div>
        <button
          onClick={addTodo}
          className="icon-btn bg-secondary text-foreground hover:bg-muted shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto -mx-1 px-1">
        {sorted.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📝</p>
            <p className="text-[15px] text-white/70">No tasks yet</p>
            <p className="text-sm text-white/60 mt-1">Add your first task above</p>
          </div>
        )}
        {sorted.map((todo) => (
          <div
            key={todo.id}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
              todo.done ? "opacity-40" : "hover:bg-secondary/50"
            }`}
          >
            <button
              onClick={() => toggle(todo.id)}
              className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                todo.done
                  ? "bg-white border-white animate-check-pop"
                  : "border-white/50 hover:border-white/80"
              }`}
            >
              {todo.done && <Check className="w-3.5 h-3.5 text-pomodoro" />}
            </button>
            <span className={`w-2 h-2 rounded-full shrink-0 ${priorityDot[todo.priority]}`} />
            <span className={`flex-1 text-[15px] min-w-0 break-words ${todo.done ? "line-through text-white/40" : "text-white"}`}>
              {todo.text}
            </span>
            <button onClick={() => remove(todo.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

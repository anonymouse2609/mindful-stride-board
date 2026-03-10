import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Send } from "lucide-react";

export interface AppState {
  habits?: boolean;
  habitsCompleted?: number;
  habitsTotal?: number;
  habitNames?: string;
  nutrition?: {
    calories: number;
    caloriesGoal: number;
    protein: number;
    carbs: number;
    fat: number;
    mealsCount: number;
  };
  pomodoro?: {
    sessions: number;
    isRunning: boolean;
    todayMinutes?: number;
  };
  todos?: {
    completed: number;
    total: number;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  quickReplies?: string[];
}

interface BotRule {
  keywords: string[];
  response: (state: AppState) => { text: string; quickReplies?: string[] };
}

const RULES: BotRule[] = [
  { keywords: ["hi", "hello", "hey", "sup", "yo", "hola"],
    response: () => ({ text: "Hey! 👋 I'm your Growth assistant. I can help you navigate the app, explain features, and track your progress. What would you like to do?", quickReplies: ["How am I doing today?", "Log food", "Start Pomodoro"] }) },
  { keywords: ["how am i doing", "my status", "summary", "progress today", "daily summary", "today's progress"],
    response: (s) => {
      const lines: string[] = ["📊 **Here's your day so far:**"];
      if (s.habits) lines.push(`• Habits: ${s.habitsCompleted}/${s.habitsTotal} completed`);
      if (s.nutrition) lines.push(`• Nutrition: ${Math.round(s.nutrition.calories)}/${s.nutrition.caloriesGoal} cal logged (${s.nutrition.mealsCount} items)`);
      if (s.pomodoro) {
        const studyTime = s.pomodoro.todayMinutes || 0;
        lines.push(`• Study: ${s.pomodoro.sessions} sessions (${Math.floor(studyTime / 60)}h ${Math.round(studyTime % 60)}m)`);
      }
      if (s.todos) lines.push(`• Tasks: ${s.todos.completed}/${s.todos.total} done`);
      const nudges: string[] = [];
      if (s.nutrition?.mealsCount === 0) nudges.push("Log a meal");
      if (s.habits && s.habitsCompleted! < s.habitsTotal!) nudges.push("Check habits");
      if (s.pomodoro?.sessions === 0) nudges.push("Start studying");
      return { text: lines.join("\n"), quickReplies: nudges.length > 0 ? nudges : ["Motivate me"] };
    }
  },
  { keywords: ["study", "pomodoro", "timer", "study session", "start studying", "focus timer", "start pomodoro", "open pomodoro", "study timer", "subject"],
    response: (s) => {
      const studyTime = s.pomodoro?.todayMinutes || 0;
      const sessionCount = s.pomodoro?.sessions || 0;
      return { text: `📚 The **Subject Study Timer** is at the top-left of your dashboard. It supports Pomodoro (25/5) and Free Study modes with subject tracking.\n\n${sessionCount > 0 ? `You've done ${sessionCount} sessions today (${Math.floor(studyTime / 60)}h ${Math.round(studyTime % 60)}m). ` : "No sessions yet today. "}Scroll up and select a subject to start!`, quickReplies: ["How does the study timer work?", "Show my macros"] };
    }
  },
  { keywords: ["habit", "habits", "my habits", "show habits", "open habits", "where is habits", "habit tracker"],
    response: (s) => ({ text: `✅ The **Habits Tracker** is in the right column of your dashboard. You have ${s.habitsTotal || 5} habits set up — ${s.habitsCompleted || 0} checked today.\n\nScroll to the right column to find it!`, quickReplies: ["How do I add a habit?", "How am I doing today?"] }) },
  { keywords: ["nutrition", "food", "macros", "calories", "log food", "track food", "diet", "meal", "nutrition tracker", "where is nutrition"],
    response: () => ({ text: "🥗 The **Nutrition Tracker** is below the main grid on your dashboard. You can search from 450+ vegetarian foods and log meals.\n\nScroll down to find it! Use the search bar to find any food.", quickReplies: ["How do I log food?", "Create custom food", "Build a recipe"] }) },
  { keywords: ["todo", "task", "tasks", "to do", "to-do", "show tasks", "open tasks", "my tasks"],
    response: (s) => ({ text: `📝 The **Todo List** is in the right column at the top. You have ${s.todos?.completed || 0}/${s.todos?.total || 0} tasks done today.\n\nScroll to the right column to manage your tasks!`, quickReplies: ["Show habits", "How am I doing today?"] }) },
  { keywords: ["goal", "goals", "daily goals", "my goals", "open goals"],
    response: () => ({ text: "🎯 **Daily Goals** are below the Pomodoro timer on the left side. Set your targets for the day and track them!\n\nScroll to the left column to find it.", quickReplies: ["Open Pomodoro", "How am I doing today?"] }) },
  { keywords: ["music", "focus music", "study music", "play music", "ambient", "lo-fi"],
    response: () => ({ text: "🎵 The **Focus Music Player** is in the left column, below Daily Goals. Play ambient study music to help you concentrate!\n\nScroll down in the left column to find it.", quickReplies: ["Start Pomodoro", "How am I doing today?"] }) },
  { keywords: ["weekly", "progress", "weekly progress", "week", "show progress"],
    response: () => ({ text: "📈 **Weekly Progress** is at the bottom of your dashboard. It shows an overview of your entire week's performance.\n\nScroll to the very bottom to see it!", quickReplies: ["How am I doing today?", "Show habits"] }) },
  { keywords: ["quote", "motivation quote", "daily quote", "quote of the day"],
    response: () => ({ text: "💬 The **Quote of the Day** is right at the top of your dashboard, below the greeting. A fresh motivational quote every day!", quickReplies: ["Motivate me", "How am I doing today?"] }) },
  { keywords: ["show macros", "my macros", "macro summary", "macros today", "show my macros"],
    response: (s) => {
      if (!s.nutrition || s.nutrition.mealsCount === 0) {
        return { text: "📊 You haven't logged any food today yet! Head to the Nutrition Tracker and search for a food to start logging.", quickReplies: ["How do I log food?", "Open nutrition tracker"] };
      }
      return { text: `📊 **Today's Macros:**\n• Calories: ${Math.round(s.nutrition.calories)}/${s.nutrition.caloriesGoal}\n• Protein: ${Math.round(s.nutrition.protein)}g\n• Carbs: ${Math.round(s.nutrition.carbs)}g\n• Fat: ${Math.round(s.nutrition.fat)}g\n\nKeep it up! 💪`, quickReplies: ["Log more food", "How am I doing today?"] };
    }
  },
  { keywords: ["how do i log", "how to log food", "how to add food", "how to track food", "log a meal"],
    response: () => ({ text: "🍽️ **To log food:**\n1. Scroll down to the Nutrition Tracker\n2. Type a food name in the search bar (e.g. 'roti', 'banana')\n3. Select the food from the dropdown\n4. Enter quantity (count or grams)\n5. Click the + button to add it\n\nThe macros update automatically!", quickReplies: ["Create custom food", "Build a recipe", "Show macros"] }) },
  { keywords: ["custom food", "create food", "add my own food", "make food", "create custom"],
    response: () => ({ text: "🆕 **To create a custom food:**\n1. Go to the Nutrition Tracker\n2. Click the **+** button in the header (next to the ⚙️ icon)\n3. Enter the food name, optional unit (glass/piece/bowl), and macros per 100g\n4. Click Save — it appears in search with a 'Custom' badge!\n\nYou can edit/delete custom foods from the 'My Foods' link.", quickReplies: ["Build a recipe", "How do I log food?"] }) },
  { keywords: ["recipe", "build recipe", "combo", "recipe builder", "create recipe", "make recipe"],
    response: () => ({ text: "🍳 **To build a recipe:**\n1. Go to the Nutrition Tracker\n2. Click the **chef hat** icon (🍳) in the header\n3. Name your recipe (e.g. 'Ghee Khakra')\n4. Search & add ingredients with quantities\n5. Set how many servings it makes\n6. Save — it appears in food search with a 🍳 badge!\n\nMacros are auto-calculated per serving.", quickReplies: ["Create custom food", "Log food"] }) },
  { keywords: ["add habit", "new habit", "create habit"],
    response: () => ({ text: "✏️ To add a new habit, go to the **Habits Tracker** (right column) and look for the edit/add option. You can customize your daily habit list there!\n\nDefault habits include water, exercise, study, sleep, and meditation.", quickReplies: ["Show habits", "How am I doing today?"] }) },
  { keywords: ["how does pomodoro", "what is pomodoro", "pomodoro technique", "explain pomodoro", "how does study timer", "how does the study", "explain study timer"],
    response: () => ({ text: "📚 **The Subject Study Timer:**\n1. Add subjects (Maths, Physics, etc.) with color tags and weekly hour goals\n2. Select a subject from the dropdown\n3. Choose mode: **🍅 Pomodoro** (25min work + 5min break) or **⏱️ Free Study** (runs until you stop)\n4. Sessions are logged automatically with subject, duration, and energy level\n5. Check the **Stats** tab for weekly progress bars, pie charts, streak, and insights\n6. The **History** tab shows all sessions with filters\n\nWeekly hours reset every Monday but all-time stats are preserved!", quickReplies: ["Start studying", "How am I doing today?"] }) },
  { keywords: ["motivate", "motivation", "inspire", "i'm lazy", "demotivated", "unmotivated", "i need motivation"],
    response: () => {
      const quotes = [
        "🔥 \"The only way to do great work is to love what you do.\" — Steve Jobs\n\nYou've got this! Even one small step forward counts.",
        "💪 \"It does not matter how slowly you go as long as you do not stop.\" — Confucius\n\nStart with just 5 minutes. Momentum will follow.",
        "🌟 \"Success is the sum of small efforts repeated day in and day out.\" — Robert Collier\n\nEvery habit you check, every meal you log — it all adds up!",
        "🚀 \"The secret of getting ahead is getting started.\" — Mark Twain\n\nPick one thing right now and do it. Future you will be grateful.",
        "⭐ \"You don't have to be perfect. You just have to show up.\"\n\nConsistency beats intensity. Let's keep the streak going!",
        "🎯 \"A year from now you'll wish you had started today.\"\n\nDon't wait for the perfect moment — start now!",
        "🧠 \"Discipline is choosing between what you want now and what you want most.\"\n\nYour goals are worth the effort. Stay focused!",
      ];
      return { text: quotes[Math.floor(Math.random() * quotes.length)], quickReplies: ["Start Pomodoro", "Log breakfast", "How am I doing today?"] };
    }
  },
  { keywords: ["what can you do", "help", "features", "what do you do", "capabilities", "commands"],
    response: () => ({ text: "🤖 **Here's what I can help with:**\n\n• **Navigate** — 'open pomodoro', 'show habits', 'where is nutrition'\n• **Explain features** — 'how do I log food?', 'how does pomodoro work?'\n• **Daily summary** — 'how am I doing today?', 'show my macros'\n• **Motivate** — 'motivate me'\n• **Guide** — 'create custom food', 'build a recipe'\n\nJust type naturally!", quickReplies: ["How am I doing today?", "Motivate me", "Show macros"] }) },
  { keywords: ["settings", "open settings", "preferences", "configure"],
    response: () => ({ text: "⚙️ You can find **Settings** by clicking the gear icon (⚙️) in the top-right corner of the dashboard. There you can configure your profile, Pomodoro timer, notifications, Focus Score, theme, and manage your data.", quickReplies: ["How am I doing today?"] }) },
  { keywords: ["thank", "thanks", "thank you", "thx", "ty"],
    response: () => ({ text: "You're welcome! 😊 Happy to help anytime. Keep crushing your goals! 💪", quickReplies: ["How am I doing today?", "Motivate me"] }) },
  { keywords: ["bye", "goodbye", "see you", "later", "cya"],
    response: () => ({ text: "See you later! 👋 Keep up the great work. I'll be here whenever you need me!", quickReplies: ["How am I doing today?"] }) },
];

function getResponse(input: string, state: AppState): { text: string; quickReplies: string[] } {
  const lower = input.toLowerCase().trim();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      const result = rule.response(state);
      return { text: result.text, quickReplies: result.quickReplies || [] };
    }
  }
  return {
    text: "🤔 I'm not sure about that, but I can help you navigate the app, explain features, or give you a daily summary! Try asking something like 'how am I doing today?' or 'how do I log food?'",
    quickReplies: ["What can you do?", "How am I doing today?", "Motivate me"],
  };
}

export default function GrowthChatbot({ appState, onAction }: { appState: AppState; onAction?: (action: string, param: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const hour = new Date().getHours();
      let greeting = "Hey! 👋 I'm your Growth assistant. ";
      const nudges: string[] = [];
      const replies: string[] = [];

      if (appState.nutrition && appState.nutrition.mealsCount === 0) {
        nudges.push("You haven't logged any meals today — want to add breakfast?");
        replies.push("Log breakfast");
      }
      if (appState.habits && appState.habitsCompleted! < appState.habitsTotal!) {
        nudges.push(`You have ${appState.habitsTotal! - appState.habitsCompleted!} habits unchecked.`);
        replies.push("Show habits");
      }
      if (appState.pomodoro?.sessions === 0 && hour >= 10) {
        nudges.push("No study sessions yet today!");
        replies.push("Start Pomodoro");
      }

      greeting += nudges.length > 0 ? nudges[0] : "How can I help you today?";
      replies.push("How am I doing today?");

      setMessages([{ role: "assistant", content: greeting, quickReplies: replies.slice(0, 3) }]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, appState]);

  const sendMessage = (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      const { text: responseText, quickReplies } = getResponse(text, appState);
      setMessages((prev) => [...prev, { role: "assistant", content: responseText, quickReplies }]);
      setIsTyping(false);
    }, 400 + Math.random() * 400);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-chatbotAccent text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open chat assistant"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] max-h-[520px] flex flex-col rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300 bg-[#0d0d14] border border-[#6366f1]">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#6366f1]/30 bg-[#0d0d14]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-white">Growth AI</h3>
                <p className="text-[9px] text-white/50">Your personal assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0 max-h-[360px] bg-[#0d0d14]">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i}>
                  <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
                      isUser
                        ? "bg-blue-900 text-white rounded-br-md"
                        : "rounded-bl-md bg-[#13131f] text-white/90"}`}>
                      {msg.content.split(/(\*\*.*?\*\*)/).map((part, j) => {
                        if (part.startsWith("**") && part.endsWith("**")) {
                          return <strong key={j}>{part.slice(2, -2)}</strong>;
                        }
                        return <span key={j}>{part}</span>;
                      })}
                    </div>
                  </div>
                  {msg.role === "assistant" && msg.quickReplies && msg.quickReplies.length > 0 && i === messages.length - 1 && !isTyping && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-1">
                      {msg.quickReplies.map((qr, j) => (
                        <button key={j} onClick={() => sendMessage(qr)} className="px-3 py-1.5 rounded-full bg-[#1a1a2e] border border-[#6366f1]/30 text-[10px] text-white/80 hover:bg-[#6366f1]/20 hover:border-[#6366f1]/50 transition-all">
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#13131f] rounded-2xl rounded-bl-md px-3 py-2 flex items-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }} />
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-[#6366f1]/30 bg-[#0d0d14]">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 rounded-xl px-3 py-2 text-xs placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-[#6366f1]/40 bg-[#13131f] text-white/90 border border-white/10"
                disabled={isTyping}
              />
              <button type="submit" disabled={!input.trim() || isTyping} className="p-2 rounded-xl bg-[#6366f1] text-white hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, X, Send, ArrowDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
  };
  todos?: {
    completed: number;
    total: number;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface QuickReply {
  text: string;
}

function parseQuickReplies(content: string): { cleanContent: string; quickReplies: QuickReply[] } {
  const lines = content.split("\n");
  const quickReplies: QuickReply[] = [];
  const contentLines: string[] = [];

  for (const line of lines) {
    if (line.trim().startsWith("QUICK_REPLY:")) {
      quickReplies.push({ text: line.trim().replace("QUICK_REPLY:", "").trim() });
    } else {
      contentLines.push(line);
    }
  }

  return { cleanContent: contentLines.join("\n").trim(), quickReplies };
}

function parseActions(content: string): { action: string | null; param: string | null } {
  const match = content.match(/ACTION:(\w+)(?::(.+))?/);
  if (match) return { action: match[1], param: match[2] || null };
  return { action: null, param: null };
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "800ms" }}
        />
      ))}
    </div>
  );
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

export default function GrowthChatbot({ appState, onAction }: { appState: AppState; onAction?: (action: string, param: string | null) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [hasGreeted, setHasGreeted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      // Generate contextual greeting
      const hour = new Date().getHours();
      let greeting = "Hey! 👋 I'm your Growth assistant. ";
      
      const nudges: string[] = [];
      if (appState.nutrition && appState.nutrition.mealsCount === 0) {
        nudges.push("You haven't logged any meals today — want to add breakfast?");
      }
      if (appState.habits && appState.habitsCompleted === 0) {
        nudges.push(`You have ${appState.habitsTotal} habits unchecked today.`);
      }
      if (appState.pomodoro && appState.pomodoro.sessions === 0 && hour >= 12) {
        nudges.push("You haven't studied today yet — want to start a Pomodoro?");
      }

      if (nudges.length > 0) {
        greeting += nudges[0];
      } else {
        greeting += "How can I help you today?";
      }

      const replies: QuickReply[] = [];
      if (appState.nutrition?.mealsCount === 0) replies.push({ text: "Log breakfast" });
      if (appState.pomodoro?.sessions === 0) replies.push({ text: "Start Pomodoro" });
      replies.push({ text: "How am I doing today?" });

      setMessages([{ role: "assistant", content: greeting }]);
      setQuickReplies(replies.slice(0, 3));
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted, appState]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setQuickReplies([]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length === updatedMessages.length + 1) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          appState,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse quick replies and actions from final content
      const { cleanContent, quickReplies: qr } = parseQuickReplies(assistantSoFar);
      const { action, param } = parseActions(assistantSoFar);

      // Update final message with clean content
      setMessages((prev) => prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: cleanContent } : m)));
      setQuickReplies(qr);

      if (action && onAction) {
        onAction(action, param);
      }
    } catch (e) {
      console.error("Chat error:", e);
      const errorMsg = e instanceof Error ? e.message : "Something went wrong";
      setMessages((prev) => [...prev, { role: "assistant", content: `⚠️ ${errorMsg}. Please try again.` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-accent text-accent-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
          aria-label="Open chat assistant"
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 w-[340px] sm:w-[380px] max-h-[520px] flex flex-col bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-foreground">Growth AI</h3>
                <p className="text-[9px] text-muted-foreground">Your personal assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0 max-h-[360px]">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-accent text-accent-foreground rounded-br-md"
                      : "bg-secondary/60 text-foreground rounded-bl-md"
                  }`}>
                    {isUser ? (
                      <p>{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm prose-invert max-w-none [&>p]:m-0 [&>p]:text-xs [&>ul]:text-xs [&>ol]:text-xs [&>ul]:my-1 [&>ol]:my-1 [&>li]:my-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && !isLoading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(qr.text)}
                  className="px-3 py-1.5 rounded-full bg-secondary/60 border border-border/40 text-[10px] text-foreground hover:bg-secondary hover:border-accent/40 transition-all"
                >
                  {qr.text}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="px-3 py-2.5 border-t border-border bg-secondary/20">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-secondary/50 border border-border/60 rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent/40"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 rounded-xl bg-accent text-accent-foreground hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

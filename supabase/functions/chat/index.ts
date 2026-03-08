import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Growth AI — a friendly, concise personal assistant built into the Growth app, a student productivity and nutrition tracker.

You help users navigate the app, understand features, and stay on track with their goals. Keep responses short (2-3 sentences max), friendly, and actionable. Always suggest a next action.

## App Features You Know:
- **Pomodoro Timer**: 25-min work / 5-min break sessions. Located top-left.
- **Daily Goals**: Set and track daily goals. Below Pomodoro.
- **Focus Music Player**: Play ambient study music. Below goals.
- **Todo List**: Add/complete tasks. Right column top.
- **Habits Tracker**: Track daily habits like water, exercise, study, sleep, meditation. Right column.
- **Nutrition/Macro Tracker**: 450+ vegetarian foods from global cuisines. Search food, log meals, track calories/protein/carbs/fat/fiber. Has daily macro goals, pie chart. Supports count-based input (rotis, glasses, katoris) and gram-based. Below main grid.
- **Custom Food Creator**: Create your own food items with custom macros and unit sizes. Click + button in nutrition tracker header.
- **Recipe Builder**: Combine multiple ingredients into a recipe. Click chef hat icon. Recipes appear in search with 🍳 tag.
- **Weekly Progress**: Shows weekly overview. Bottom of page.
- **Quote of the Day**: Motivational quote at the top.

## Navigation Sections:
- Pomodoro → scroll to top-left area
- Todo/Tasks → scroll to right column
- Habits → scroll to right column, below todo
- Nutrition → scroll to nutrition tracker section
- Goals → scroll to daily goals section
- Music → scroll to focus music player
- Weekly Progress → scroll to bottom

## Response Rules:
1. Keep responses to 2-3 sentences MAX
2. Always include an actionable suggestion
3. When user asks about navigation, include a ACTION: prefix for the app to handle
4. For "log [food]" requests, respond with ACTION:SEARCH_FOOD:[food name]
5. For "start pomodoro" requests, respond with ACTION:START_POMODORO
6. For "show macros" requests, include the macro data from context in a clean summary
7. For "how am I doing" requests, give a quick status summary from the context provided
8. For "motivate me" requests, give an original short motivational quote
9. For "add habit [name]" requests, respond with ACTION:ADD_HABIT:[habit name]
10. Use emojis sparingly but effectively
11. If user asks something unrelated to the app, briefly answer but redirect to app features

## Quick Action Suggestions:
After each response, suggest 1-2 relevant follow-up actions as quick replies. Format them on new lines prefixed with QUICK_REPLY: like:
QUICK_REPLY:Log breakfast
QUICK_REPLY:Start studying`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, appState } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context-aware system message
    let contextInfo = "";
    if (appState) {
      contextInfo = `\n\n## Current App State (Today):`;
      if (appState.habits) {
        contextInfo += `\n- Habits: ${appState.habitsCompleted}/${appState.habitsTotal} completed today`;
        if (appState.habitNames) contextInfo += ` (${appState.habitNames})`;
      }
      if (appState.nutrition) {
        contextInfo += `\n- Nutrition: ${Math.round(appState.nutrition.calories)} cal logged (goal: ${appState.nutrition.caloriesGoal}), ${Math.round(appState.nutrition.protein)}g protein, ${Math.round(appState.nutrition.carbs)}g carbs, ${Math.round(appState.nutrition.fat)}g fat`;
        contextInfo += `\n- Meals logged: ${appState.nutrition.mealsCount} items today`;
      }
      if (appState.pomodoro) {
        contextInfo += `\n- Pomodoro: ${appState.pomodoro.sessions} sessions completed today, currently ${appState.pomodoro.isRunning ? "running" : "stopped"}`;
      }
      if (appState.todos) {
        contextInfo += `\n- Tasks: ${appState.todos.completed}/${appState.todos.total} completed`;
      }
      contextInfo += `\n- Current time: ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextInfo },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings → Workspace → Usage." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service temporarily unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const systemPrompt = `You are a CBSE expert. Return ONLY valid JSON. No markdown, no LaTeX, no HTML tags, no \\times or $ symbols. Write all math in plain English: write 'x' instead of '\\times', write 'Rs' instead of '$', write fractions as '3/4' not LaTeX.

Return this exact structure:
{
  "subject": "Subject Name",
  "year": "2024",
  "questions": [
    {
      "number": 1,
      "marks": 6,
      "type": "long",
      "text": "Full question text in plain English here",
      "given_data": ["Point 1", "Point 2"],
      "required": "What the student must do",
      "answer": {
        "steps": [
          { "step": 1, "description": "Step description", "working": "Calculation in plain text", "marks": 1 }
        ],
        "final_answer": "The final answer"
      }
    }
  ]
}

Rules:
- Never use \\times, use x
- Never use $ or LaTeX delimiters
- Never use <br> or HTML tags
- Write Rs instead of currency symbols
- Write fractions as a/b (e.g. 3/4)
- All math expressions in plain readable text
- Generate 3-5 questions mixing short (1-2 marks), medium (3-4 marks), and long (5-6 marks)
- Use actual CBSE-style questions for the given subject and year`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { subject, year, className } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userPrompt = `Generate CBSE Class ${className || "12"} ${subject} Previous Year Questions from ${year}. Include a mix of question types with detailed step-by-step solutions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response from AI");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pyq error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

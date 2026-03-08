import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { exam_id, subject_id, topic, difficulty, count, exam_name, subject_name } = await req.json();

    if (!exam_id || !subject_id || !count) {
      return new Response(JSON.stringify({ error: "Missing required fields: exam_id, subject_id, count" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert question creator for Nigerian standardized exams (WAEC, JAMB UTME, NECO). Generate high-quality multiple-choice questions that are accurate, well-written, and appropriate for the specified exam level. Each question must have exactly 4 options (A, B, C, D) with one correct answer. Provide clear explanations for each answer.`;

    const userPrompt = `Generate ${count} ${difficulty || "Medium"} difficulty multiple-choice questions for the ${exam_name || "exam"} exam, subject: ${subject_name || "subject"}${topic ? `, topic: ${topic}` : ""}. Make questions diverse, realistic, and exam-appropriate.`;

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
        tools: [
          {
            type: "function",
            function: {
              name: "save_questions",
              description: "Save generated multiple-choice questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string", description: "The question text" },
                        option_a: { type: "string", description: "Option A" },
                        option_b: { type: "string", description: "Option B" },
                        option_c: { type: "string", description: "Option C" },
                        option_d: { type: "string", description: "Option D" },
                        correct_option: { type: "string", enum: ["A", "B", "C", "D"], description: "The correct answer letter" },
                        explanation: { type: "string", description: "Explanation of the correct answer" },
                        topic: { type: "string", description: "Specific topic of the question" },
                      },
                      required: ["text", "option_a", "option_b", "option_c", "option_d", "correct_option", "explanation"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_questions" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const generatedQuestions = parsed.questions;

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3 };

    const dbRows = generatedQuestions.map((q: any) => ({
      text: q.text,
      exam_id,
      subject_id,
      options: [q.option_a, q.option_b, q.option_c, q.option_d],
      correct_index: correctMap[q.correct_option] ?? 0,
      explanation: q.explanation || null,
      topic: q.topic || topic || null,
      difficulty: difficulty || "Medium",
      source: "ai-generated",
    }));

    // Insert in batches
    let saved = 0;
    let failed = 0;
    for (let i = 0; i < dbRows.length; i += 50) {
      const batch = dbRows.slice(i, i + 50);
      const { error } = await adminClient.from("questions").insert(batch);
      if (error) {
        console.error("Insert error:", error);
        failed += batch.length;
      } else {
        saved += batch.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, saved, failed, questions: generatedQuestions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-questions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, exam_type, amount } = await req.json();

    if (!subject) {
      return new Response(
        JSON.stringify({ error: "subject is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Map friendly subject names to ALOC API subject slugs
    const subjectMap: Record<string, string> = {
      "english language": "english",
      "english": "english",
      "mathematics": "mathematics",
      "biology": "biology",
      "chemistry": "chemistry",
      "physics": "physics",
      "economics": "economics",
      "government": "government",
      "literature in english": "literature",
      "literature": "literature",
      "commerce": "commerce",
      "crs": "crk",
      "christian religious studies": "crk",
      "civic education": "civic_education",
      "accounting": "accounting",
      "geography": "geography",
      "agricultural science": "agriculture",
      "history": "history",
      "computer studies": "computer",
      "insurance": "insurance",
    };

    const subjectSlug = subjectMap[subject.toLowerCase()] || subject.toLowerCase();
    const type = (exam_type || "utme").toLowerCase();
    const count = Math.min(amount || 10, 40);

    // ALOC API v2 endpoint
    const url = `https://questions.aloc.com.ng/api/v2/m/${count}?subject=${subjectSlug}&type=${type}`;

    console.log(`Fetching from ALOC: ${url}`);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ALOC API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ error: "Failed to fetch questions from provider", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    // Normalise ALOC response into a consistent shape
    const questions = (data.data || []).map((q: any, i: number) => {
      const options = [q.option?.a, q.option?.b, q.option?.c, q.option?.d, q.option?.e].filter(Boolean);
      const correctLetter = (q.answer || "").toLowerCase();
      const correctIndex = correctLetter.charCodeAt(0) - 97; // a=0, b=1, ...

      return {
        id: q.id || i + 1,
        text: q.question || "",
        options,
        correct: correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0,
        explanation: q.solution || "",
        topic: q.topic || "",
        year: q.examYear || null,
        section: q.section || "",
      };
    });

    return new Response(
      JSON.stringify({ questions, total: questions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

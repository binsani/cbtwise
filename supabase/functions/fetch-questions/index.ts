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
      "literature in english": "englishlit",
      "literature": "englishlit",
      "commerce": "commerce",
      "crs": "crk",
      "christian religious studies": "crk",
      "civic education": "civiledu",
      "civic_education": "civiledu",
      "civiledu": "civiledu",
      "accounting": "accounting",
      "geography": "geography",
      "agricultural science": "agriculture",
      "history": "history",
      "computer studies": "computer",
      "insurance": "insurance",
      "irk": "irk",
      "islamic religious studies": "irk",
      "currentaffairs": "currentaffairs",
      "current affairs": "currentaffairs",
    };

    const supportedSubjects = new Set([
      "english", "mathematics", "commerce", "accounting", "biology",
      "physics", "chemistry", "englishlit", "government", "crk",
      "geography", "economics", "irk", "civiledu", "insurance",
      "currentaffairs", "history",
    ]);

    const supportedExamTypes = new Set(["waec", "utme", "neco", "post-utme"]);

    const subjectSlug = subjectMap[subject.toLowerCase()] || subject.toLowerCase();
    const type = (exam_type || "utme").toLowerCase();
    const requestedAmount = Math.max(amount || 10, 1);

    if (!supportedSubjects.has(subjectSlug)) {
      return new Response(
        JSON.stringify({
          error: "unsupported_subject",
          message: `"${subject}" is not available for online practice yet. Please choose a different subject.`,
          subject,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!supportedExamTypes.has(type)) {
      return new Response(
        JSON.stringify({
          error: "unsupported_exam",
          message: `"${exam_type}" is not a supported exam type. Supported types: UTME, WAEC, NECO.`,
          exam_type,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ALOC API v2 endpoint — max 40 per request, randomized each call
    // Make multiple attempts to collect enough unique questions
    const ALOC_MAX = 40;
    const MAX_RETRIES = 5; // max rounds to try filling the requested amount

    console.log(`Fetching ${requestedAmount} questions for ${subjectSlug}`);

    const allQuestions: any[] = [];
    const seenIds = new Set<number>();

    for (let attempt = 0; attempt < MAX_RETRIES && allQuestions.length < requestedAmount; attempt++) {
      const url = `https://questions.aloc.com.ng/api/v2/m/${ALOC_MAX}?subject=${subjectSlug}&type=${type}`;
      console.log(`Fetching from ALOC: ${url}`);

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          AccessToken: alocApiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ALOC API error: ${response.status} - ${errorText}`);
        if (allQuestions.length > 0) break;
        return new Response(
          JSON.stringify({
            error: "provider_error",
            message: `Questions for "${subject}" could not be loaded right now. Please try again or pick a different subject.`,
          }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const data = await response.json();
      let newThisRound = 0;
      for (const q of (data.data || [])) {
        const qId = q.id || allQuestions.length + 1;
        if (!seenIds.has(qId)) {
          seenIds.add(qId);
          allQuestions.push(q);
          newThisRound++;
        }
      }
      console.log(`Attempt ${attempt + 1}: got ${newThisRound} new unique (total: ${allQuestions.length}/${requestedAmount})`);
      // If no new questions were found, the pool is exhausted
      if (newThisRound === 0) break;
    }

    // Normalise ALOC response into a consistent shape
    const questions = allQuestions.map((q: any, i: number) => {
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

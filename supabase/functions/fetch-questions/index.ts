import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const alocApiKey = Deno.env.get("ALOC_API_KEY");

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
  "currentaffairs", "history", "agriculture", "computer",
]);

const supportedExamTypes = new Set(["waec", "utme", "neco", "post-utme"]);

// Normalize subject input to a slug used by both local DB and ALOC
function resolveSubjectSlug(subject: string): string {
  const normalized = subject.toLowerCase().trim().replace(/[_\s]+/g, " ");
  return (
    subjectMap[normalized] ||
    subjectMap[normalized.replace(/\s+/g, "_")] ||
    normalized.replace(/\s+/g, "")
  );
}

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

    const subjectSlug = resolveSubjectSlug(subject);
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

    // ── Step 1: Query local database ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let localQuestions: any[] = [];
    try {
      // Find matching subject+exam in local DB
      // We match subject by slug and exam by slug
      const { data: subjectRows } = await supabase
        .from("subjects")
        .select("id, exam_id, slug")
        .eq("is_active", true);

      const { data: examRows } = await supabase
        .from("exams")
        .select("id, slug")
        .eq("slug", type)
        .eq("is_active", true);

      if (subjectRows && examRows && examRows.length > 0) {
        const examId = examRows[0].id;
        // Find subject that matches slug within this exam
        const matchedSubject = subjectRows.find(
          (s: any) => s.slug === subjectSlug && s.exam_id === examId
        );

        if (matchedSubject) {
          const { data: dbQuestions } = await supabase
            .from("questions")
            .select("id, text, options, correct_index, explanation, topic, year")
            .eq("subject_id", matchedSubject.id)
            .eq("exam_id", examId)
            .eq("is_active", true)
            .limit(requestedAmount)
            .order("created_at", { ascending: false }); // We'll shuffle client-side

          if (dbQuestions && dbQuestions.length > 0) {
            // Shuffle locally fetched questions
            for (let i = dbQuestions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [dbQuestions[i], dbQuestions[j]] = [dbQuestions[j], dbQuestions[i]];
            }
            localQuestions = dbQuestions.map((q: any, i: number) => {
              const opts = Array.isArray(q.options) ? q.options : [];
              return {
                id: q.id,
                text: q.text || "",
                options: opts,
                correct: q.correct_index,
                explanation: q.explanation || "",
                topic: q.topic || "",
                year: q.year || null,
                section: "",
                _source: "local",
              };
            });
          }
        }
      }
      console.log(`Local DB: found ${localQuestions.length} questions for ${subjectSlug}/${type}`);
    } catch (dbErr) {
      console.error("Local DB query failed, falling back to ALOC:", dbErr);
    }

    // ── Step 2: Calculate shortfall ──
    const remaining = requestedAmount - localQuestions.length;
    let alocQuestions: any[] = [];

    // ── Step 3: ALOC fallback ──
    if (remaining > 0 && alocApiKey) {
      console.log(`Need ${remaining} more from ALOC API`);
      const ALOC_MAX = 40;
      const MAX_RETRIES = 5;
      const allRaw: any[] = [];
      const seenIds = new Set<number>();

      for (let attempt = 0; attempt < MAX_RETRIES && allRaw.length < remaining; attempt++) {
        const url = `https://questions.aloc.com.ng/api/v2/m/${ALOC_MAX}?subject=${subjectSlug}&type=${type}`;
        try {
          const response = await fetch(url, {
            headers: { Accept: "application/json", AccessToken: alocApiKey },
          });

          if (!response.ok) {
            console.error(`ALOC error: ${response.status}`);
            if (allRaw.length > 0) break;
            if (localQuestions.length > 0) break; // We have local questions, don't fail
            continue;
          }

          const data = await response.json();
          let newCount = 0;
          for (const q of data.data || []) {
            const qId = q.id || allRaw.length + 1;
            if (!seenIds.has(qId)) {
              seenIds.add(qId);
              allRaw.push(q);
              newCount++;
            }
          }
          console.log(`ALOC attempt ${attempt + 1}: ${newCount} new (total: ${allRaw.length}/${remaining})`);
          if (newCount === 0) break;
        } catch (fetchErr) {
          console.error("ALOC fetch error:", fetchErr);
          break;
        }
      }

      // Normalize ALOC questions
      alocQuestions = allRaw.slice(0, remaining).map((q: any, i: number) => {
        const options = [q.option?.a, q.option?.b, q.option?.c, q.option?.d, q.option?.e].filter(Boolean);
        const correctLetter = (q.answer || "").toLowerCase();
        const correctIndex = correctLetter.charCodeAt(0) - 97;
        return {
          id: q.id || i + 1,
          text: q.question || "",
          options,
          correct: correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0,
          explanation: q.solution || "",
          topic: q.topic || "",
          year: q.examYear || null,
          section: q.section || "",
          _source: "aloc",
          _raw: q, // keep raw for caching
        };
      });

      // ── Step 3b: Auto-cache ALOC questions into local DB ──
      if (alocQuestions.length > 0) {
        try {
          // Find or skip caching if we can't resolve subject/exam IDs
          const { data: examRows } = await supabase
            .from("exams")
            .select("id")
            .eq("slug", type)
            .eq("is_active", true)
            .limit(1);

          if (examRows && examRows.length > 0) {
            const examId = examRows[0].id;
            const { data: subjectRows } = await supabase
              .from("subjects")
              .select("id")
              .eq("slug", subjectSlug)
              .eq("exam_id", examId)
              .limit(1);

            if (subjectRows && subjectRows.length > 0) {
              const subjectId = subjectRows[0].id;
              const toInsert = alocQuestions
                .filter((q: any) => q.text && q.options.length >= 2)
                .map((q: any) => ({
                  text: q.text,
                  options: q.options,
                  correct_index: q.correct,
                  explanation: q.explanation || null,
                  topic: q.topic || null,
                  year: q.year || null,
                  exam_id: examId,
                  subject_id: subjectId,
                  source: "aloc",
                  is_active: true,
                }));

              if (toInsert.length > 0) {
                // Use text+subject_id as a natural dedup key — skip conflicts
                // We insert in small batches; duplicates just fail silently
                const BATCH = 50;
                for (let b = 0; b < toInsert.length; b += BATCH) {
                  const batch = toInsert.slice(b, b + BATCH);
                  const { error: insertErr } = await supabase
                    .from("questions")
                    .insert(batch);
                  if (insertErr) {
                    // Likely duplicate or constraint error — that's OK
                    console.log(`Cache insert batch warning: ${insertErr.message}`);
                  }
                }
                console.log(`Cached ${toInsert.length} ALOC questions into local DB`);
              }
            }
          }
        } catch (cacheErr) {
          console.error("Auto-cache failed (non-fatal):", cacheErr);
        }
      }
    } else if (remaining > 0 && !alocApiKey) {
      console.warn("ALOC API key missing, skipping fallback");
    }

    // ── Step 4: Merge & return ──
    // Strip internal fields before returning
    const merged = [...localQuestions, ...alocQuestions].map(
      ({ _source, _raw, ...rest }) => rest
    );

    if (merged.length === 0) {
      return new Response(
        JSON.stringify({
          error: "provider_error",
          message: `No questions found for "${subject}". Please try a different subject or add questions via the admin panel.`,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ questions: merged, total: merged.length }),
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

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

function resolveSubjectSlug(subject: string): string {
  const normalized = subject.toLowerCase().trim().replace(/[_\s]+/g, " ");
  return (
    subjectMap[normalized] ||
    subjectMap[normalized.replace(/\s+/g, "_")] ||
    normalized.replace(/\s+/g, "")
  );
}

// Fetch with timeout helper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
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

    // ── Step 1: Query local database with random ordering ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let localQuestions: any[] = [];
    let localTotalAvailable = 0;
    try {
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
        const matchedSubject = subjectRows.find(
          (s: any) => s.slug === subjectSlug && s.exam_id === examId
        );

        if (matchedSubject) {
          // First get total count for threshold check
          const { count } = await supabase
            .from("questions")
            .select("id", { count: "exact", head: true })
            .eq("subject_id", matchedSubject.id)
            .eq("exam_id", examId)
            .eq("is_active", true);

          localTotalAvailable = count || 0;

          // Fetch more than needed, then shuffle & slice (Supabase doesn't support random order natively)
          const fetchLimit = Math.min(localTotalAvailable, Math.max(requestedAmount * 3, 200));
          const { data: dbQuestions } = await supabase
            .from("questions")
            .select("id, text, options, correct_index, explanation, topic, year")
            .eq("subject_id", matchedSubject.id)
            .eq("exam_id", examId)
            .eq("is_active", true)
            .limit(fetchLimit);

          if (dbQuestions && dbQuestions.length > 0) {
            // Fisher-Yates shuffle for true randomization
            for (let i = dbQuestions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [dbQuestions[i], dbQuestions[j]] = [dbQuestions[j], dbQuestions[i]];
            }
            // Slice to requested amount
            const sliced = dbQuestions.slice(0, requestedAmount);
            localQuestions = sliced.map((q: any) => {
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
      console.log(`Local DB: ${localQuestions.length}/${requestedAmount} (${localTotalAvailable} total available) for ${subjectSlug}/${type}`);
    } catch (dbErr) {
      console.error("Local DB query failed, falling back to ALOC:", dbErr);
    }

    // ── Step 2: Check if we need ALOC (skip if local has ≥80%) ──
    const remaining = requestedAmount - localQuestions.length;
    const coverageRatio = localQuestions.length / requestedAmount;
    let alocQuestions: any[] = [];

    // ── Step 3: ALOC fallback — only if local coverage < 80% ──
    if (remaining > 0 && coverageRatio < 0.8 && alocApiKey) {
      console.log(`Local coverage ${Math.round(coverageRatio * 100)}% < 80%, fetching ${remaining} from ALOC`);
      const ALOC_MAX = 40;
      const MAX_RETRIES = 5;
      const ALOC_TIMEOUT_MS = 3000;
      const allRaw: any[] = [];
      const seenIds = new Set<number>();

      for (let attempt = 0; attempt < MAX_RETRIES && allRaw.length < remaining; attempt++) {
        const url = `https://questions.aloc.com.ng/api/v2/m/${ALOC_MAX}?subject=${subjectSlug}&type=${type}`;
        try {
          const response = await fetchWithTimeout(url, {
            headers: { Accept: "application/json", AccessToken: alocApiKey },
          }, ALOC_TIMEOUT_MS);

          if (!response.ok) {
            console.error(`ALOC error: ${response.status}`);
            if (allRaw.length > 0 || localQuestions.length > 0) break;
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
          if (fetchErr instanceof DOMException && fetchErr.name === "AbortError") {
            console.warn(`ALOC timeout after ${ALOC_TIMEOUT_MS}ms on attempt ${attempt + 1}`);
          } else {
            console.error("ALOC fetch error:", fetchErr);
          }
          // If we have any local questions, stop retrying on timeout
          if (localQuestions.length > 0) break;
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
        };
      });

      // ── Auto-cache ALOC questions into local DB ──
      if (alocQuestions.length > 0) {
        try {
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
                const BATCH = 50;
                for (let b = 0; b < toInsert.length; b += BATCH) {
                  const batch = toInsert.slice(b, b + BATCH);
                  const { error: insertErr } = await supabase
                    .from("questions")
                    .insert(batch);
                  if (insertErr) {
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
    } else if (remaining > 0 && coverageRatio >= 0.8) {
      console.log(`Local coverage ${Math.round(coverageRatio * 100)}% ≥ 80%, skipping ALOC`);
    } else if (remaining > 0 && !alocApiKey) {
      console.warn("ALOC API key missing, skipping fallback");
    }

    // ── Step 4: Merge & return ──
    const merged = [...localQuestions, ...alocQuestions].map(
      ({ _source, ...rest }) => rest
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

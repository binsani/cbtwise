import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const alocApiKey = Deno.env.get("ALOC_API_KEY");

const subjectSlugs = [
  "english", "mathematics", "commerce", "accounting", "biology",
  "physics", "chemistry", "englishlit", "government", "crk",
  "geography", "economics", "irk", "civiledu", "insurance",
  "currentaffairs", "history", "agriculture", "computer",
];

const examTypes = ["utme", "waec", "neco"];

const ALOC_BATCH_SIZES = [40, 25, 15];
const ALOC_RETRIES_PER_SIZE = 3;
const ALOC_TIMEOUT_BASE_MS = 8000;
const ALOC_TIMEOUT_MAX_MS = 18000;
const ALOC_RETRY_DELAYS_MS = [500, 1500, 3000];

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchAlocBatch(subjectSlug: string, examSlug: string, batchNumber: number) {
  let lastError = `Batch ${batchNumber}: no response`;

  for (const batchSize of ALOC_BATCH_SIZES) {
    for (let attempt = 1; attempt <= ALOC_RETRIES_PER_SIZE; attempt++) {
      const timeoutMs = Math.min(ALOC_TIMEOUT_BASE_MS * attempt, ALOC_TIMEOUT_MAX_MS);
      const url = `https://questions.aloc.com.ng/api/v2/m/${batchSize}?subject=${subjectSlug}&type=${examSlug}`;
      const startedAt = Date.now();

      try {
        const response = await fetchWithTimeout(url, {
          headers: { Accept: "application/json", AccessToken: alocApiKey! },
        }, timeoutMs);

        const latencyMs = Date.now() - startedAt;
        if (!response.ok) {
          lastError = `Batch ${batchNumber}: HTTP ${response.status}`;
          console.warn(`[bulk-fetch-aloc] ${subjectSlug}/${examSlug} batch=${batchNumber} size=${batchSize} attempt=${attempt} failed: ${response.status} (${latencyMs}ms)`);

          // Retry transient errors quickly, otherwise try next (smaller) batch size
          if ((response.status === 429 || response.status >= 500) && attempt < ALOC_RETRIES_PER_SIZE) {
            await sleep(ALOC_RETRY_DELAYS_MS[Math.min(attempt - 1, ALOC_RETRY_DELAYS_MS.length - 1)]);
            continue;
          }
          break;
        }

        const data = await response.json();
        const rows = Array.isArray(data?.data) ? data.data : [];
        console.log(`[bulk-fetch-aloc] ${subjectSlug}/${examSlug} batch=${batchNumber} size=${batchSize} attempt=${attempt} ok: ${rows.length} rows (${latencyMs}ms)`);
        return { rows, error: null as string | null };
      } catch (err) {
        const isTimeout = err instanceof DOMException && err.name === "AbortError";
        lastError = isTimeout
          ? `Batch ${batchNumber}: timeout`
          : `Batch ${batchNumber}: ${String(err)}`;

        console.warn(`[bulk-fetch-aloc] ${subjectSlug}/${examSlug} batch=${batchNumber} size=${batchSize} attempt=${attempt} error: ${lastError}`);

        if (attempt < ALOC_RETRIES_PER_SIZE) {
          await sleep(ALOC_RETRY_DELAYS_MS[Math.min(attempt - 1, ALOC_RETRY_DELAYS_MS.length - 1)]);
        }
      }
    }
  }

  return { rows: [] as any[], error: lastError };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check - admin only
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify user is admin
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(token);
  if (claimsErr || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = claimsData.claims.sub as string;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Check admin role
  const { data: roleCheck } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!roleCheck) {
    return new Response(JSON.stringify({ error: "Admin access required" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!alocApiKey) {
    return new Response(JSON.stringify({ error: "ALOC_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Parse optional filters
  let body: any = {};
  try { body = await req.json(); } catch {}
  const filterSubjects: string[] = body.subjects || subjectSlugs;
  const filterExams: string[] = body.exam_types || examTypes;
  const batchesPerSubject = Math.min(body.batches || 3, 10); // max 10 batches per subject

  // Load exams and subjects from DB
  const { data: allExams } = await supabase.from("exams").select("id, slug").eq("is_active", true);
  const { data: allSubjects } = await supabase.from("subjects").select("id, slug, exam_id, name").eq("is_active", true);

  if (!allExams || !allSubjects) {
    return new Response(JSON.stringify({ error: "Failed to load exams/subjects from DB" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: any[] = [];

  for (const exam of allExams) {
    if (!filterExams.includes(exam.slug)) continue;

    const examSubjects = allSubjects.filter(
      (s: any) => s.exam_id === exam.id && filterSubjects.includes(s.slug)
    );

    for (const subject of examSubjects) {
      const entry: any = {
        exam: exam.slug,
        subject: subject.name,
        slug: subject.slug,
        fetched: 0,
        cached: 0,
        duplicates: 0,
        errors: [],
      };

      const allRaw: any[] = [];
      const seenIds = new Set<number>();

      for (let batch = 0; batch < batchesPerSubject; batch++) {
        const { rows, error: batchError } = await fetchAlocBatch(subject.slug, exam.slug, batch + 1);

        if (batchError && rows.length === 0) {
          entry.errors.push(batchError);
          break;
        }

        let newCount = 0;
        for (const q of rows) {
          const qId = q.id || allRaw.length + 1;
          if (!seenIds.has(qId)) {
            seenIds.add(qId);
            allRaw.push(q);
            newCount++;
          }
        }

        if (newCount === 0) break; // no new questions, stop

        // Short throttle to reduce upstream rate-limit pressure on free ALOC plan
        await sleep(200);
      }

      entry.fetched = allRaw.length;

      // Normalize and insert
      if (allRaw.length > 0) {
        const toInsert = allRaw
          .map((q: any) => {
            const options = [q.option?.a, q.option?.b, q.option?.c, q.option?.d, q.option?.e].filter(Boolean);
            const correctLetter = (q.answer || "").toLowerCase();
            const correctIndex = correctLetter.charCodeAt(0) - 97;
            const text = (q.question || "").trim();
            if (!text || options.length < 2) return null;
            return {
              text,
              options,
              correct_index: correctIndex >= 0 && correctIndex < options.length ? correctIndex : 0,
              explanation: q.solution || null,
              topic: q.topic || null,
              year: q.examYear || null,
              exam_id: exam.id,
              subject_id: subject.id,
              source: "aloc",
              is_active: true,
            };
          })
          .filter(Boolean);

        // Batch insert with conflict handling (uses unique index on subject_id, md5(text))
        const BATCH_SIZE = 50;
        let insertedCount = 0;
        for (let b = 0; b < toInsert.length; b += BATCH_SIZE) {
          const chunk = toInsert.slice(b, b + BATCH_SIZE);
          const { data: inserted, error: insertErr } = await supabase
            .from("questions")
            .insert(chunk as any[])
            .select("id");

          if (insertErr) {
            // Likely duplicate — try one-by-one for this batch
            for (const item of chunk) {
              const { error: singleErr } = await supabase.from("questions").insert(item as any);
              if (!singleErr) insertedCount++;
              else entry.duplicates++;
            }
          } else {
            insertedCount += (inserted || []).length;
          }
        }
        entry.cached = insertedCount;
        entry.duplicates = entry.fetched - entry.cached;
      }

      results.push(entry);
    }
  }

  const totalFetched = results.reduce((s, r) => s + r.fetched, 0);
  const totalCached = results.reduce((s, r) => s + r.cached, 0);

  return new Response(
    JSON.stringify({
      summary: { totalFetched, totalCached, subjects: results.length },
      results,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});



## Hybrid Question Sourcing Plan

### Problem
The ALOC API has limited pools per subject (~100-150 unique questions), a 40-per-request cap, and adds latency with retry loops. You need a reliable way to always deliver the requested question count.

### Solution: Local DB First, ALOC Fallback

The `fetch-questions` edge function will query your local `questions` table first, then only call the ALOC API if more questions are needed.

### Changes

**1. Update `fetch-questions` edge function**
- Accept `subject`, `exam_type`, `amount` as before
- **Step 1 — Local DB query**: Use the Supabase service role client to query `questions` table joined with `subjects` and `exams` to match the subject slug and exam type. Select active questions, randomize with `ORDER BY random()`, limit to `amount`.
- **Step 2 — Check shortfall**: If local DB returned fewer than `amount`, calculate `remaining = amount - localCount`.
- **Step 3 — ALOC fallback**: Only if `remaining > 0`, call the ALOC API with the existing retry loop logic for the remaining count.
- **Step 4 — Merge & return**: Combine local + ALOC questions into the same normalized shape, deduplicate, and return.

**2. Normalize local DB questions to match the existing API shape**
- Local questions use `options` (JSONB array) and `correct_index` (integer) — map these to the same `{ id, text, options, correct, explanation, topic, year }` format the client expects.
- ALOC questions continue using the existing normalization.

**3. Auto-cache ALOC questions (bonus)**
- After fetching from ALOC, optionally insert new questions into the local `questions` table with `source = 'aloc'` so the local pool grows over time. This uses an upsert keyed on a hash of the question text + subject to avoid duplicates.
- This means over time, fewer and fewer ALOC API calls are needed.

**4. No client-side changes needed**
- `questions-api.ts` and all exam pages stay the same — the edge function returns the same response shape.

### Architecture Flow

```text
Client request (subject, exam_type, amount)
        │
        ▼
  Edge Function
        │
        ├─► Query local DB (questions table)
        │   Got N questions
        │
        ├─► If N < amount:
        │     Call ALOC API for (amount - N)
        │     Cache new ALOC questions into DB
        │
        └─► Return merged results (same shape)
```

### Key Details
- Uses `SUPABASE_SERVICE_ROLE_KEY` (already available as a secret) in the edge function to bypass RLS when querying/inserting questions
- Local questions marked `source = 'aloc'` vs `source = 'manual'` to distinguish origins
- No migration needed — the `questions` table already has the right schema including `source` column
- The admin CSV import and manual question management continue to work unchanged


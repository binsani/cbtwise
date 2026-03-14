

# Best Solution for ALOC API Delay

## The Problem

Right now your question fetching is slow because:

1. **ALOC API is the bottleneck** — it's an external Nigerian API with high latency (~2-5s per request), and the 40-question limit means multiple sequential requests for larger amounts
2. **Multiple subjects = multiple edge function calls** — a mock exam with 4 subjects fires 4 parallel edge function calls, each potentially hitting ALOC multiple times
3. **Your local DB is nearly empty** — only 7 subjects with 38-75 questions each (all UTME). WAEC and NECO have zero local questions. So nearly every request falls through to ALOC.

## The Best Solution: Build a Large Local Question Bank

The fastest, most reliable fix is to **eliminate ALOC dependency entirely** by filling your local database with enough questions. Local DB queries take ~50ms vs ALOC's 2-5 seconds per batch.

### How to do it (using the ChatGPT CSV workflow you already have):

**Target**: 500+ questions per subject per exam type. This covers even the largest mock exam requests (200 questions across 4 subjects = 50 per subject).

**Priority order**:
1. **WAEC** — zero questions currently, and you have the syllabus PDFs
2. **NECO** — zero questions currently
3. **UTME** — top up from 75 to 500+ per subject

**Per subject, run 5 ChatGPT batches** of 100 questions each = 500 questions. Upload each CSV via Admin → Questions → CSV Import.

### Immediate Code Improvement (complementary)

While you build the bank, we can also optimize the edge function:

1. **Randomize local DB queries properly** — currently using `ORDER BY created_at DESC` which always returns the same questions. Switch to random ordering so students get variety even with a smaller bank.

2. **Skip ALOC entirely when local DB has enough** — the current code already does this, but the threshold is exact match. We could add a "good enough" threshold (e.g., if local has 80%+ of requested, skip ALOC).

3. **Add a timeout to ALOC calls** — if ALOC doesn't respond in 3 seconds, return whatever local questions we have instead of waiting.

4. **Cache ALOC results more aggressively** — already implemented but we can add a dedup index on `(text, subject_id)` to prevent duplicate insert failures from slowing things down.

## Summary

| Approach | Speed Impact | Effort |
|---|---|---|
| Fill local DB to 500+/subject via CSV | Eliminates delay entirely | Medium (ChatGPT batches + upload) |
| Add ALOC timeout (3s) | Prevents worst-case waits | Small code change |
| Fix random ordering in DB query | Better question variety | Small code change |
| Skip ALOC when local ≥ 80% | Fewer external calls | Small code change |

**Recommendation**: Do all four. The CSV upload is the real fix — the code changes are safety nets. Want me to implement the three code improvements?


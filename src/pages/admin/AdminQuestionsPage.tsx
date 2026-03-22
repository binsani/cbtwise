import { useEffect, useState, useRef } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Loader2, Upload, Download, CheckCircle2, XCircle, FileSpreadsheet, Square, CheckSquare, MinusSquare, Sparkles, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Question = Tables<"questions">;
interface ExamOption { id: string; name: string; slug: string }
interface SubjectOption { id: string; name: string; exam_id: string; slug: string }

const defaultForm = {
  text: "", exam_id: "", subject_id: "", options: ["", "", "", ""],
  correct_index: 0, explanation: "", topic: "", difficulty: "Medium", year: new Date().getFullYear(),
};

interface CsvRow {
  row: number;
  text: string;
  exam_slug: string;
  subject_slug: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation: string;
  topic: string;
  difficulty: string;
  year: string;
}

interface ValidatedRow {
  row: number;
  valid: boolean;
  errors: string[];
  payload?: {
    text: string;
    exam_id: string;
    subject_id: string;
    options: string[];
    correct_index: number;
    explanation: string | null;
    topic: string | null;
    difficulty: string;
    year: number | null;
  };
  original: CsvRow;
}

function parseCSV(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => { obj[h] = (values[idx] ?? "").trim(); });
    rows.push({
      row: i + 1,
      text: obj.text || obj.question || obj.question_text || "",
      exam_slug: obj.exam_slug || obj.exam || "",
      subject_slug: obj.subject_slug || obj.subject || "",
      option_a: obj.option_a || obj.a || "",
      option_b: obj.option_b || obj.b || "",
      option_c: obj.option_c || obj.c || "",
      option_d: obj.option_d || obj.d || "",
      correct_option: obj.correct_option || obj.correct || obj.answer || "",
      explanation: obj.explanation || "",
      topic: obj.topic || "",
      difficulty: obj.difficulty || "Medium",
      year: obj.year || "",
    });
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        result.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

const TEMPLATE_CSV = `text,exam_slug,subject_slug,option_a,option_b,option_c,option_d,correct_option,explanation,topic,difficulty,year
"What is the capital of Nigeria?",utme,geography,Lagos,Abuja,Kano,Ibadan,B,"Abuja has been the capital since 1991.",Capitals,Easy,2024
"Solve: 2x + 4 = 10",utme,mathematics,x=2,x=3,x=4,x=5,B,"2x = 6, so x = 3.",Algebra,Medium,2024`;

const PAGE_SIZE = 50;

const AdminQuestionsPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterExam, setFilterExam] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // CSV import state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvStep, setCsvStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [csvValidated, setCsvValidated] = useState<ValidatedRow[]>([]);
  const [importResult, setImportResult] = useState({ success: 0, failed: 0 });
  const [importFailedRows, setImportFailedRows] = useState<{ row: number; text: string; error: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI generator state
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiForm, setAiForm] = useState({ exam_id: "", subject_id: "", topic: "", difficulty: "Medium", count: 5 });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<{ saved: number; failed: number; questions: any[] } | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [filterExam]);

  useEffect(() => { fetchAll(); }, [currentPage, debouncedSearch, filterExam]);

  // Load exams/subjects once
  const [metaLoaded, setMetaLoaded] = useState(false);
  useEffect(() => {
    (async () => {
      const [eRes, sRes] = await Promise.all([
        supabase.from("exams").select("id, name, slug"),
        supabase.from("subjects").select("id, name, exam_id, slug"),
      ]);
      setExams((eRes.data ?? []) as ExamOption[]);
      setSubjects((sRes.data ?? []) as SubjectOption[]);
      setMetaLoaded(true);
    })();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("questions").select("*", { count: "exact" }).order("created_at", { ascending: false });

    // Server-side exam filter
    if (filterExam !== "all") {
      const exam = exams.find(e => e.slug === filterExam);
      if (exam) query = query.eq("exam_id", exam.id);
    }

    // Server-side search
    if (debouncedSearch.trim()) {
      query = query.ilike("text", `%${debouncedSearch.trim()}%`);
    }

    const { data, count } = await query.range(from, to);
    setQuestions(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  };

  const examMap = Object.fromEntries(exams.map((e) => [e.id, e]));
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const examBySlug = Object.fromEntries(exams.map((e) => [e.slug.toLowerCase(), e]));
  const subjectBySlugAndExam = new Map<string, SubjectOption>();
  subjects.forEach((s) => {
    subjectBySlugAndExam.set(`${s.exam_id}::${s.slug.toLowerCase()}`, s);
    subjectBySlugAndExam.set(`${s.exam_id}::${s.name.toLowerCase()}`, s);
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const filteredSubjects = form.exam_id ? subjects.filter((s) => s.exam_id === form.exam_id) : subjects;

  const openAdd = () => { setEditing(null); setForm(defaultForm); setDialogOpen(true); };
  const openEdit = (q: Question) => {
    setEditing(q);
    const opts = Array.isArray(q.options) ? (q.options as string[]) : ["", "", "", ""];
    setForm({
      text: q.text, exam_id: q.exam_id, subject_id: q.subject_id,
      options: opts.length >= 4 ? opts.slice(0, 4) : [...opts, ...Array(4 - opts.length).fill("")],
      correct_index: q.correct_index, explanation: q.explanation ?? "",
      topic: q.topic ?? "", difficulty: q.difficulty ?? "Medium", year: q.year ?? new Date().getFullYear(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.text || !form.exam_id || !form.subject_id || form.options.some((o) => !o.trim())) {
      toast.error("Please fill all required fields and all 4 options."); return;
    }
    setSaving(true);
    const payload = {
      text: form.text, exam_id: form.exam_id, subject_id: form.subject_id, options: form.options,
      correct_index: form.correct_index, explanation: form.explanation || null,
      topic: form.topic || null, difficulty: form.difficulty, year: form.year,
    };
    if (editing) {
      const { error } = await supabase.from("questions").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Question updated.");
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Question added.");
    }
    setSaving(false); setDialogOpen(false); fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("questions").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message); else { toast.success("Question deleted."); fetchAll(); }
    setDeleteTarget(null);
  };

  // CSV import logic
  const openCsvDialog = () => {
    setCsvStep("upload");
    setCsvValidated([]);
    setImportResult({ success: 0, failed: 0 });
    setImportFailedRows([]);
    setCsvDialogOpen(true);
  };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "questions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file."); return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No data rows found in CSV."); return;
      }
      // Fetch existing question texts + patterns for duplicate detection
      const { data: existingQuestions } = await supabase
        .from("questions")
        .select("text")
        .eq("is_active", true)
        .limit(10000);
      const existingTexts = new Set(
        (existingQuestions ?? []).map((q) => q.text.trim().toLowerCase())
      );
      // Build pattern counts from existing DB questions
      const existingPatterns = new Map<string, number>();
      for (const q of existingQuestions ?? []) {
        const pk = q.text.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);
        existingPatterns.set(pk, (existingPatterns.get(pk) || 0) + 1);
      }
      const validated = validateRows(rows, existingTexts, existingPatterns);
      setCsvValidated(validated);
      setCsvStep("preview");
    };
    reader.readAsText(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const validateRows = (rows: CsvRow[], existingTexts?: Set<string>, existingPatterns?: Map<string, number>): ValidatedRow[] => {
    const seenInCsv = new Set<string>();
    const seenPatternsInCsv = new Map<string, number>();

    // Build a normalized pattern key (first 60 chars, lowered, whitespace-collapsed)
    const patternKey = (text: string) =>
      text.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 60);

    // Common slug aliases for flexibility
    const slugAliases: Record<string, string> = {
      "crs": "crk", "christian_religious_studies": "crk", "christian_religious_knowledge": "crk",
      "irs": "irk", "islamic_religious_studies": "irk", "islamic_religious_knowledge": "irk",
      "maths": "mathematics", "math": "mathematics",
      "eng": "english", "english_language": "english",
      "lit": "literature", "literature_in_english": "literature", "englishlit": "literature",
      "phy": "physics", "chem": "chemistry", "bio": "biology",
      "govt": "government", "gov": "government",
      "geo": "geography", "econs": "economics", "econ": "economics",
      "acct": "accounting", "comm": "commerce",
      "civic_edu": "civic_education", "civics": "civic_education", "civiledu": "civic_education",
      "computer_science": "computer", "comp": "computer",
      "agric": "agriculture", "current_affairs": "currentaffairs",
    };

    const normalizeSlug = (raw: string) => {
      const s = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
      return slugAliases[s] || s;
    };

    const normalizeDifficulty = (raw: string): string => {
      const d = raw.trim().toLowerCase();
      if (d === "easy" || d === "e" || d === "1") return "easy";
      if (d === "medium" || d === "m" || d === "2" || d === "moderate") return "medium";
      if (d === "hard" || d === "h" || d === "3" || d === "difficult") return "hard";
      return d || "medium";
    };

    // First pass: count patterns in CSV to detect template-style duplicates
    for (const r of rows) {
      const pk = patternKey(r.text);
      if (pk) seenPatternsInCsv.set(pk, (seenPatternsInCsv.get(pk) || 0) + 1);
    }
    // Reset for second pass
    const csvPatternCounts = new Map(seenPatternsInCsv);
    seenPatternsInCsv.clear();

    return rows.map((r) => {
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!r.text.trim()) errors.push("Missing question text");
      if (!r.option_a.trim() || !r.option_b.trim()) {
        errors.push("At least options A and B required");
      }

      // Exact duplicate checks
      const normalizedText = r.text.trim().toLowerCase();
      if (normalizedText && existingTexts?.has(normalizedText)) {
        errors.push("Duplicate: already exists in database");
      }
      if (normalizedText && seenInCsv.has(normalizedText)) {
        errors.push("Duplicate: repeated in CSV");
      }
      seenInCsv.add(normalizedText);

      // Template-style near-duplicate detection
      const pk = patternKey(r.text);
      if (pk) {
        const csvCount = csvPatternCounts.get(pk) || 0;
        const dbCount = existingPatterns?.get(pk) || 0;
        if (csvCount > 3) {
          errors.push(`Template duplicate: ${csvCount} similar questions in CSV (pattern: "${pk.slice(0, 40)}…")`);
        } else if (dbCount >= 3) {
          errors.push(`Template duplicate: ${dbCount} similar questions already in DB (pattern: "${pk.slice(0, 40)}…")`);
        }
      }

      // Accept A/B/C/D or 1/2/3/4 for correct answer
      const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, "1": 0, "2": 1, "3": 2, "4": 3 };
      const correctKey = r.correct_option.trim().toUpperCase();
      if (!(correctKey in correctMap)) errors.push("correct_option must be A/B/C/D or 1/2/3/4");

      const examSlug = normalizeSlug(r.exam_slug);
      const exam = examBySlug[examSlug];
      if (!exam) errors.push(`Unknown exam: "${r.exam_slug}"`);

      let subject: SubjectOption | undefined;
      if (exam) {
        const subjectSlug = normalizeSlug(r.subject_slug);
        subject = subjectBySlugAndExam.get(`${exam.id}::${subjectSlug}`);
        if (!subject) errors.push(`Unknown subject: "${r.subject_slug}" for exam "${r.exam_slug}"`);
      }

      const difficulty = normalizeDifficulty(r.difficulty);
      if (!["easy", "medium", "hard"].includes(difficulty)) errors.push(`Invalid difficulty: "${r.difficulty}" (allowed: easy, medium, hard)`);

      const year = r.year ? parseInt(r.year, 10) : null;
      if (r.year && (isNaN(year!) || year! < 1960 || year! > 2100)) errors.push(`Invalid year: "${r.year}"`);

      const options = [r.option_a.trim(), r.option_b.trim(), r.option_c.trim(), r.option_d.trim()].filter(Boolean);

      const valid = errors.length === 0;
      return {
        row: r.row,
        valid,
        errors,
        original: r,
        ...(valid && exam && subject
          ? {
              payload: {
                text: r.text.trim(),
                exam_id: exam.id,
                subject_id: subject.id,
                options,
                correct_index: correctMap[correctKey],
                explanation: r.explanation.trim() || null,
                topic: r.topic.trim() || null,
                difficulty,
                year,
              },
            }
          : {}),
      };
    });
  };

  const validRows = csvValidated.filter((r) => r.valid);
  const invalidRows = csvValidated.filter((r) => !r.valid);

  const handleBulkImport = async () => {
    if (validRows.length === 0) { toast.error("No valid rows to import."); return; }
    setCsvStep("importing");
    setImportFailedRows([]);

    let success = 0;
    let failed = 0;
    const failedDetails: { row: number; text: string; error: string }[] = [];

    // Insert row-by-row for precise error tracking
    for (const r of validRows) {
      const { error } = await supabase.from("questions").insert(r.payload!);
      if (error) {
        failed++;
        failedDetails.push({ row: r.row, text: r.original.text.slice(0, 80), error: error.message });
      } else {
        success++;
      }
    }

    setImportResult({ success, failed });
    setImportFailedRows(failedDetails);
    setCsvStep("done");
    if (success > 0) fetchAll();
  };

  const downloadFailedReport = () => {
    if (importFailedRows.length === 0) return;
    const header = "row,question_text,error";
    const lines = importFailedRows.map(
      (r) => `${r.row},"${r.text.replace(/"/g, '""')}","${r.error.replace(/"/g, '""')}"`
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed_import_rows.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Bulk selection helpers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === questions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(questions.map((q) => q.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    const ids = Array.from(selectedIds);
    let deleted = 0;
    // Delete in batches of 50
    for (let i = 0; i < ids.length; i += 50) {
      const batch = ids.slice(i, i + 50);
      const { error } = await supabase.from("questions").delete().in("id", batch);
      if (!error) deleted += batch.length;
    }
    toast.success(`Deleted ${deleted} question${deleted !== 1 ? "s" : ""}.`);
    setSelectedIds(new Set());
    setBulkDeleting(false);
    setBulkDeleteOpen(false);
    fetchAll();
  };

  const allSelected = questions.length > 0 && selectedIds.size === questions.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < questions.length;

  // AI generator
  const openAiDialog = () => {
    setAiForm({ exam_id: "", subject_id: "", topic: "", difficulty: "Medium", count: 5 });
    setAiResult(null);
    setAiDialogOpen(true);
  };

  const aiFilteredSubjects = aiForm.exam_id ? subjects.filter((s) => s.exam_id === aiForm.exam_id) : [];

  const handleAiGenerate = async () => {
    if (!aiForm.exam_id || !aiForm.subject_id) {
      toast.error("Please select an exam and subject."); return;
    }
    setAiGenerating(true);
    setAiResult(null);
    try {
      const examName = examMap[aiForm.exam_id]?.name || "";
      const subjectName = subjectMap[aiForm.subject_id]?.name || "";
      const { data, error } = await supabase.functions.invoke("generate-questions", {
        body: {
          exam_id: aiForm.exam_id,
          subject_id: aiForm.subject_id,
          topic: aiForm.topic || undefined,
          difficulty: aiForm.difficulty,
          count: aiForm.count,
          exam_name: examName,
          subject_name: subjectName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiResult({ saved: data.saved, failed: data.failed, questions: data.questions });
      toast.success(`Generated and saved ${data.saved} question${data.saved !== 1 ? "s" : ""}!`);
      fetchAll();
    } catch (err: any) {
      toast.error(err.message || "AI generation failed");
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <AdminLayout
      title="Questions"
      description={`${totalCount} questions in bank`}
      actions={
        <div className="flex gap-2">
          <Button onClick={openAiDialog} size="sm" variant="secondary">
            <Sparkles className="mr-1 h-4 w-4" /> AI Generate
          </Button>
          <Button onClick={openCsvDialog} size="sm" variant="outline">
            <Upload className="mr-1 h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={openAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Question
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {["all", ...exams.map((e) => e.slug)].map((slug) => (
            <button key={slug} onClick={() => setFilterExam(slug)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${filterExam === slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              {slug === "all" ? "All" : slug.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <span className="text-sm font-medium">{selectedIds.size} question{selectedIds.size !== 1 ? "s" : ""} selected</span>
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete Selected
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="w-10 px-3 py-3">
                      <Checkbox
                        checked={allSelected ? true : someSelected ? "indeterminate" : false}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-semibold">Question</th>
                    <th className="px-4 py-3 text-left font-semibold">Exam</th>
                    <th className="px-4 py-3 text-left font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left font-semibold">Year</th>
                    <th className="px-4 py-3 text-left font-semibold">Difficulty</th>
                    <th className="px-4 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {questions.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No questions found.</td></tr>
                  ) : (
                    questions.map((q) => (
                      <tr key={q.id} className={`hover:bg-muted/30 ${selectedIds.has(q.id) ? "bg-primary/5" : ""}`}>
                        <td className="px-3 py-3">
                          <Checkbox
                            checked={selectedIds.has(q.id)}
                            onCheckedChange={() => toggleSelect(q.id)}
                            aria-label={`Select question`}
                          />
                        </td>
                        <td className="px-4 py-3 max-w-[200px] truncate">{q.text}</td>
                        <td className="px-4 py-3"><span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{examMap[q.exam_id]?.slug?.toUpperCase() ?? "—"}</span></td>
                        <td className="px-4 py-3">{subjectMap[q.subject_id]?.name ?? "—"}</td>
                        <td className="px-4 py-3">{q.year ?? "—"}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-medium ${q.difficulty === "Easy" ? "text-primary" : q.difficulty === "Medium" ? "text-accent" : "text-destructive"}`}>{q.difficulty ?? "—"}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(q)} className="rounded p-1.5 hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteTarget(q)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount} questions
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(1)}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-3 text-sm font-medium">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{editing ? "Edit Question" : "Add Question"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Question Text *</Label><Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Exam *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: e.target.value, subject_id: "" })}>
                  <option value="">Select exam</option>{exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div><Label>Subject *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Select subject</option>{filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {form.options.map((opt, i) => (
              <div key={i}>
                <Label className="flex items-center gap-2">Option {String.fromCharCode(65 + i)} *{form.correct_index === i && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Correct</span>}</Label>
                <div className="flex gap-2">
                  <Input className="flex-1" value={opt} onChange={(e) => { const o = [...form.options]; o[i] = e.target.value; setForm({ ...form, options: o }); }} />
                  <Button type="button" variant={form.correct_index === i ? "default" : "outline"} size="sm" onClick={() => setForm({ ...form, correct_index: i })}>✓</Button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Difficulty</Label><select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{["Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}</select></div>
              <div><Label>Year</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></div>
              <div><Label>Topic</Label><Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} /></div>
            </div>
            <div><Label>Explanation</Label><Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{editing ? "Update" : "Add"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={(open) => { if (!open && csvStep !== "importing") setCsvDialogOpen(false); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Bulk Import Questions
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to import multiple questions at once.
            </DialogDescription>
          </DialogHeader>

          {csvStep === "upload" && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                <Upload className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="mb-1 font-medium">Drop your CSV file here or click to browse</p>
                <p className="mb-4 text-xs text-muted-foreground">
                  Columns: text, exam_slug, subject_slug, option_a, option_b, option_c, option_d, correct_option, explanation, topic, difficulty, year
                </p>
                <div className="flex justify-center gap-3">
                  <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-1 h-4 w-4" /> Choose File
                  </Button>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-1 h-4 w-4" /> Download Template
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h4 className="mb-2 text-sm font-semibold">CSV Format Guide</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>• <strong>text</strong> — The question text (required)</li>
                  <li>• <strong>exam_slug</strong> — Exam identifier, e.g. <code>utme</code>, <code>waec</code>, <code>neco</code> (required)</li>
                  <li>• <strong>subject_slug</strong> — Subject slug or name, e.g. <code>mathematics</code> (required)</li>
                  <li>• <strong>option_a, option_b, option_c, option_d</strong> — Four answer options (required)</li>
                  <li>• <strong>correct_option</strong> — A, B, C, or D (required)</li>
                  <li>• <strong>explanation</strong> — Answer explanation (optional)</li>
                  <li>• <strong>topic, difficulty, year</strong> — Additional metadata (optional)</li>
                </ul>
              </div>
            </div>
          )}

          {csvStep === "preview" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-4">
                <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                  <div className="font-display text-2xl font-bold">{csvValidated.length}</div>
                  <div className="text-xs text-muted-foreground">Total Rows</div>
                </div>
                <div className="flex-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <div className="font-display text-2xl font-bold text-primary">{validRows.length}</div>
                  <div className="text-xs text-muted-foreground">Valid</div>
                </div>
                {invalidRows.length > 0 && (
                  <div className="flex-1 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                    <div className="font-display text-2xl font-bold text-destructive">{invalidRows.length}</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                )}
              </div>

              {/* Error details */}
              {invalidRows.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <h4 className="mb-2 text-sm font-semibold text-destructive">Rows with Errors (will be skipped)</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {invalidRows.map((r) => (
                      <div key={r.row} className="flex items-start gap-2 text-xs">
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                        <span>
                          <strong>Row {r.row}:</strong> {r.errors.join("; ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-2 py-2 text-left">Row</th>
                        <th className="px-2 py-2 text-left">Status</th>
                        <th className="px-2 py-2 text-left">Question</th>
                        <th className="px-2 py-2 text-left">Exam</th>
                        <th className="px-2 py-2 text-left">Subject</th>
                        <th className="px-2 py-2 text-left">Answer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {csvValidated.slice(0, 50).map((r) => (
                        <tr key={r.row} className={r.valid ? "hover:bg-muted/30" : "bg-destructive/5"}>
                          <td className="px-2 py-1.5">{r.row}</td>
                          <td className="px-2 py-1.5">
                            {r.valid
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                              : <XCircle className="h-3.5 w-3.5 text-destructive" />}
                          </td>
                          <td className="px-2 py-1.5 max-w-[200px] truncate">{r.original.text}</td>
                          <td className="px-2 py-1.5">{r.original.exam_slug.toUpperCase()}</td>
                          <td className="px-2 py-1.5">{r.original.subject_slug}</td>
                          <td className="px-2 py-1.5">{r.original.correct_option.toUpperCase()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvValidated.length > 50 && (
                  <div className="border-t border-border p-2 text-center text-xs text-muted-foreground">
                    Showing first 50 of {csvValidated.length} rows
                  </div>
                )}
              </div>
            </div>
          )}

          {csvStep === "importing" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="mb-4 h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Importing {validRows.length} questions...</p>
              <p className="text-xs text-muted-foreground">This may take a moment.</p>
            </div>
          )}

          {csvStep === "done" && (
            <div className="flex flex-col items-center py-6">
              <CheckCircle2 className="mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 font-display text-lg font-bold">Import Complete</h3>
              <div className="flex gap-6 text-center mb-4">
                <div>
                  <div className="font-display text-2xl font-bold text-primary">{importResult.success}</div>
                  <div className="text-xs text-muted-foreground">Imported</div>
                </div>
                {importResult.failed > 0 && (
                  <div>
                    <div className="font-display text-2xl font-bold text-destructive">{importResult.failed}</div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </div>
                )}
              </div>
              {importFailedRows.length > 0 && (
                <div className="w-full space-y-3">
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <h4 className="mb-2 text-sm font-semibold text-destructive">Failed Rows</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importFailedRows.map((r) => (
                        <div key={r.row} className="flex items-start gap-2 text-xs">
                          <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                          <span><strong>Row {r.row}:</strong> {r.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={downloadFailedReport} className="w-full">
                    <Download className="mr-1 h-4 w-4" /> Download Failed Rows Report
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {csvStep === "upload" && (
              <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>Cancel</Button>
            )}
            {csvStep === "preview" && (
              <>
                <Button variant="outline" onClick={() => setCsvStep("upload")}>Back</Button>
                <Button onClick={handleBulkImport} disabled={validRows.length === 0}>
                  <Upload className="mr-1 h-4 w-4" /> Import {validRows.length} Questions
                </Button>
              </>
            )}
            {csvStep === "done" && (
              <Button onClick={() => setCsvDialogOpen(false)}>Done</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Question?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={(open) => !open && !bulkDeleting && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Question{selectedIds.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {selectedIds.size} selected question{selectedIds.size !== 1 ? "s" : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Delete {selectedIds.size} Question{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Question Generator
            </DialogTitle>
            <DialogDescription>
              Generate practice questions using AI. Select an exam, subject, and optionally a topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Exam *</Label>
              <Select value={aiForm.exam_id} onValueChange={(v) => setAiForm({ ...aiForm, exam_id: v, subject_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger>
                <SelectContent>
                  {exams.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Subject *</Label>
              <Select value={aiForm.subject_id} onValueChange={(v) => setAiForm({ ...aiForm, subject_id: v })} disabled={!aiForm.exam_id}>
                <SelectTrigger><SelectValue placeholder={aiForm.exam_id ? "Select subject" : "Select exam first"} /></SelectTrigger>
                <SelectContent>
                  {aiFilteredSubjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Topic (optional)</Label>
              <Input
                placeholder="e.g. Photosynthesis, Algebra, Civil War..."
                value={aiForm.topic}
                onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label>Difficulty</Label>
                <Select value={aiForm.difficulty} onValueChange={(v) => setAiForm({ ...aiForm, difficulty: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label>Count</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={aiForm.count}
                  onChange={(e) => setAiForm({ ...aiForm, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) })}
                />
              </div>
            </div>

            {aiResult && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm">
                <p className="font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {aiResult.saved} question{aiResult.saved !== 1 ? "s" : ""} saved
                  {aiResult.failed > 0 && <span className="text-destructive ml-2">({aiResult.failed} failed)</span>}
                </p>
                <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {aiResult.questions.map((q: any, i: number) => (
                    <li key={i} className="text-xs text-muted-foreground truncate">• {q.text}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Close</Button>
            <Button onClick={handleAiGenerate} disabled={aiGenerating || !aiForm.exam_id || !aiForm.subject_id}>
              {aiGenerating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-1 h-4 w-4" /> Generate</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminQuestionsPage;

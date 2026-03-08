import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import ExamBreadcrumb from "@/components/ExamBreadcrumb";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, BookOpen, ListChecks, GraduationCap, Shuffle, Play, Info, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Subject {
  id: string;
  name: string;
  slug: string;
}

interface Exam {
  id: string;
  slug: string;
  name: string;
}

const QUESTION_OPTIONS = [10, 20, 40, 60, 100, 120, 150, 180, 200];
const TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hr 30 min" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2 hr 30 min" },
  { value: 180, label: "3 hours" },
];

const YEAR_OPTIONS = [
  { value: "all", label: "All Years" },
  ...Array.from({ length: 2025 - 2000 + 1 }, (_, i) => {
    const y = 2025 - i;
    return { value: String(y), label: String(y) };
  }),
];

type Mode = "practice" | "study" | "mock";

const MODE_OPTIONS: { value: Mode; label: string; description: string }[] = [
  { value: "practice", label: "Practice", description: "Answer questions with instant feedback after each" },
  { value: "study", label: "Study", description: "See answers & explanations as you go" },
  { value: "mock", label: "Mock Exam", description: "Timed exam — no feedback until you submit" },
];

const MockExamSetup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedExam = searchParams.get("exam") || "";

  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedExam, setSelectedExam] = useState(preselectedExam);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [questionCount, setQuestionCount] = useState(100);
  const [timeMins, setTimeMins] = useState(120);
  const [year, setYear] = useState("all");
  const [mode, setMode] = useState<Mode>("mock");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);

  // Load exams
  useEffect(() => {
    supabase
      .from("exams")
      .select("id, slug, name")
      .eq("is_active", true)
      .order("created_at")
      .then(({ data }) => {
        setExams(data || []);
        if (!preselectedExam && data && data.length > 0) {
          setSelectedExam(data[0].slug);
        }
        setLoading(false);
      });
  }, [preselectedExam]);

  // Load subjects when exam changes
  useEffect(() => {
    if (!selectedExam) return;
    const loadSubjects = async () => {
      const { data: exam } = await supabase
        .from("exams")
        .select("id")
        .eq("slug", selectedExam)
        .single();

      if (exam) {
        const { data: subs } = await supabase
          .from("subjects")
          .select("id, name, slug")
          .eq("exam_id", exam.id)
          .eq("is_active", true)
          .order("name");
        setSubjects(subs || []);
      }
      setSelectedSubjects(new Set());
    };
    loadSubjects();
  }, [selectedExam]);

  const toggleSubject = (name: string) => {
    const next = new Set(selectedSubjects);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelectedSubjects(next);
  };

  const selectAll = () => {
    if (selectedSubjects.size === subjects.length) {
      setSelectedSubjects(new Set());
    } else {
      setSelectedSubjects(new Set(subjects.map((s) => s.name)));
    }
  };

  const isMock = mode === "mock";
  const minSubjects = isMock ? 4 : 1;
  const minQuestions = isMock ? 100 : 10;
  const minTime = isMock ? 60 : 15;

  const canStart =
    selectedSubjects.size >= minSubjects &&
    questionCount >= minQuestions &&
    timeMins >= minTime &&
    selectedExam;

  const handleStart = () => {
    const subjectsParam = Array.from(selectedSubjects).join(",");
    const params = new URLSearchParams({
      exam: selectedExam,
      subjects: subjectsParam,
      questions: String(questionCount),
      time: String(timeMins),
      mode,
      year,
      shuffleQ: String(shuffleQuestions),
      shuffleO: String(shuffleOptions),
    });

    if (mode === "practice" || mode === "study") {
      navigate(`/practice?${params.toString()}`);
    } else {
      navigate(`/mock-exam?${params.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-3xl py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <ExamBreadcrumb items={[{ label: "Exams", href: "/exams" }, { label: "Setup" }]} />
          <h1 className="font-display text-3xl font-bold mb-1">Configure Your Session</h1>
          <p className="text-muted-foreground mb-8">Customize your practice or mock exam settings.</p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Exam Type */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  Exam Type
                </label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select exam type" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.slug}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode Selection */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
                  <Play className="h-4 w-4 text-primary" />
                  Select Mode
                </label>
                <div className="space-y-2">
                  {MODE_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setMode(m.value)}
                      className={`w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-all ${
                        mode === m.value
                          ? "border-2 border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          mode === m.value ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}
                      >
                        {mode === m.value && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                      </div>
                      <div>
                        <span className="text-sm font-semibold">{m.label}</span>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subjects */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-2 font-display text-sm font-bold">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Select Subjects
                    <span className="text-xs font-normal text-muted-foreground">(min {minSubjects})</span>
                  </label>
                  <button onClick={selectAll} className="text-xs text-primary font-medium hover:underline">
                    {selectedSubjects.size === subjects.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  {selectedSubjects.size} selected
                  {selectedSubjects.size < minSubjects && (
                    <span className="text-destructive ml-1">— select at least {minSubjects - selectedSubjects.size} more</span>
                  )}
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {subjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSubject(s.name)}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-all text-left ${
                        selectedSubjects.has(s.name)
                          ? "border-2 border-primary bg-primary/5 font-semibold"
                          : "border-border bg-background hover:border-primary/30"
                      }`}
                    >
                      <Checkbox
                        checked={selectedSubjects.has(s.name)}
                        onCheckedChange={() => toggleSubject(s.name)}
                        className="pointer-events-none"
                      />
                      <span className="truncate">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Year Filter */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
                  <Info className="h-4 w-4 text-primary" />
                  Year
                </label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {YEAR_OPTIONS.map((y) => (
                      <SelectItem key={y.value} value={y.value}>
                        {y.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Question Count */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
                  <ListChecks className="h-4 w-4 text-primary" />
                  No. of Questions
                  <span className="text-xs font-normal text-muted-foreground">(min {minQuestions})</span>
                </label>
                <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_OPTIONS.filter((q) => q >= minQuestions).map((q) => (
                      <SelectItem key={q} value={String(q)}>
                        {q} questions
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Exam Duration */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
                  <Clock className="h-4 w-4 text-primary" />
                  Exam Duration
                  <span className="text-xs font-normal text-muted-foreground">(min {minTime} min)</span>
                </label>
                <Select value={String(timeMins)} onValueChange={(v) => setTimeMins(Number(v))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.filter((t) => t.value >= minTime).map((t) => (
                      <SelectItem key={t.value} value={String(t.value)}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Options Card */}
              <div className="rounded-xl border border-border bg-card p-4">
                <label className="flex items-center gap-2 font-display text-sm font-bold mb-4">
                  <Shuffle className="h-4 w-4 text-primary" />
                  Options
                </label>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label htmlFor="shuffle-q" className="text-sm font-medium cursor-pointer">Shuffle Questions</label>
                    <Switch id="shuffle-q" checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
                  </div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="shuffle-o" className="text-sm font-medium cursor-pointer">Shuffle Options</label>
                    <Switch id="shuffle-o" checked={shuffleOptions} onCheckedChange={setShuffleOptions} />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <h3 className="font-display text-sm font-bold mb-3">Session Summary</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Exam:</span>
                  <span className="font-medium">{exams.find((e) => e.slug === selectedExam)?.name || "—"}</span>
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium capitalize">{mode === "mock" ? "Mock Exam" : mode}</span>
                  <span className="text-muted-foreground">Subjects:</span>
                  <span className="font-medium">{selectedSubjects.size > 0 ? selectedSubjects.size : "—"}</span>
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium">{questionCount}</span>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{TIME_OPTIONS.find((t) => t.value === timeMins)?.label}</span>
                  <span className="text-muted-foreground">Year:</span>
                  <span className="font-medium">{year === "all" ? "All Years" : year}</span>
                </div>
              </div>

              <Button size="lg" className="w-full" disabled={!canStart} onClick={handleStart}>
                <Play className="mr-2 h-4 w-4" />
                {canStart
                  ? `Start ${mode === "mock" ? "Mock Exam" : mode === "study" ? "Study Session" : "Practice"}`
                  : `Select at least ${minSubjects} subject${minSubjects > 1 ? "s" : ""}`}
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default MockExamSetup;

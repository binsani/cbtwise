import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Clock, BookOpen, ListChecks, GraduationCap } from "lucide-react";
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

const QUESTION_OPTIONS = [100, 120, 150, 180, 200];
const TIME_OPTIONS = [
  { value: 60, label: "1 hour" },
  { value: 90, label: "1 hour 30 min" },
  { value: 120, label: "2 hours" },
  { value: 150, label: "2 hours 30 min" },
  { value: 180, label: "3 hours" },
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
  const [timeMins, setTimeMins] = useState(60);

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

  const canStart = selectedSubjects.size >= 4 && questionCount >= 100 && timeMins >= 60 && selectedExam;

  const handleStart = () => {
    const subjectsParam = Array.from(selectedSubjects).join(",");
    navigate(
      `/mock-exam?exam=${selectedExam}&subjects=${encodeURIComponent(subjectsParam)}&questions=${questionCount}&time=${timeMins}`
    );
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
      <main className="container max-w-2xl py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="font-display text-3xl font-bold mb-2">Configure Mock Exam</h1>
          <p className="text-muted-foreground mb-8">Set up your exam preferences before you begin.</p>

          {/* Exam Type */}
          <div className="mb-8">
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

          {/* Subjects */}
          <div className="mb-8">
            <label className="flex items-center gap-2 font-display text-sm font-bold mb-1">
              <BookOpen className="h-4 w-4 text-primary" />
              Select Subjects
              <span className="text-xs font-normal text-muted-foreground">(minimum 4)</span>
            </label>
            <p className="text-xs text-muted-foreground mb-3">
              {selectedSubjects.size} selected
              {selectedSubjects.size < 4 && (
                <span className="text-destructive ml-1">— select at least {4 - selectedSubjects.size} more</span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => toggleSubject(s.name)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm transition-all text-left ${
                    selectedSubjects.has(s.name)
                      ? "border-2 border-primary bg-primary/5 font-semibold"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    checked={selectedSubjects.has(s.name)}
                    onCheckedChange={() => toggleSubject(s.name)}
                    className="pointer-events-none"
                  />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="mb-8">
            <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
              <ListChecks className="h-4 w-4 text-primary" />
              Number of Questions
              <span className="text-xs font-normal text-muted-foreground">(minimum 100)</span>
            </label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_OPTIONS.map((q) => (
                  <SelectItem key={q} value={String(q)}>
                    {q} questions
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time */}
          <div className="mb-8">
            <label className="flex items-center gap-2 font-display text-sm font-bold mb-3">
              <Clock className="h-4 w-4 text-primary" />
              Exam Duration
              <span className="text-xs font-normal text-muted-foreground">(minimum 1 hour)</span>
            </label>
            <Select value={String(timeMins)} onValueChange={(v) => setTimeMins(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={String(t.value)}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary & Start */}
          <div className="rounded-xl border border-border bg-card p-5 mb-6">
            <h3 className="font-display text-sm font-bold mb-3">Exam Summary</h3>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Exam:</span>
              <span className="font-medium">{exams.find((e) => e.slug === selectedExam)?.name || "—"}</span>
              <span className="text-muted-foreground">Subjects:</span>
              <span className="font-medium">{selectedSubjects.size > 0 ? Array.from(selectedSubjects).join(", ") : "—"}</span>
              <span className="text-muted-foreground">Questions:</span>
              <span className="font-medium">{questionCount}</span>
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{TIME_OPTIONS.find((t) => t.value === timeMins)?.label}</span>
            </div>
          </div>

          <Button size="lg" className="w-full" disabled={!canStart} onClick={handleStart}>
            {canStart ? "Start Mock Exam" : `Select at least 4 subjects to begin`}
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default MockExamSetup;

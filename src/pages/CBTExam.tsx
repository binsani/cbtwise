import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, Loader2, CheckCircle2, Calculator, TriangleAlert } from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { saveAttempt } from "@/lib/save-attempt";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import UpgradeGate from "@/components/UpgradeGate";
import ExamCalculator from "@/components/ExamCalculator";
import ReportQuestionModal from "@/components/ReportQuestionModal";

interface TaggedQuestion extends Question {
  _subject: string;
}

const CBTExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exam = searchParams.get("exam") || "utme";

  const subjectsParam = searchParams.get("subjects") || searchParams.get("subject") || "mathematics";
  const subjectList = subjectsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const totalQuestions = Math.max(Number(searchParams.get("questions")) || 20, 10);
  const totalTimeMins = Math.max(Number(searchParams.get("time")) || 30, 1);
  const shuffleQ = searchParams.get("shuffleQ") !== "false";
  const shuffleO = searchParams.get("shuffleO") !== "false";

  const gate = useSubscriptionGate();

  const [questions, setQuestions] = useState<TaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSubjects, setFailedSubjects] = useState<string[]>([]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(totalTimeMins * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [started, setStarted] = useState(false);
  const [activeSubjectTab, setActiveSubjectTab] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Build subject → question index map
  const subjectQuestionMap = useMemo(() => {
    const map: Record<string, number[]> = {};
    questions.forEach((q, i) => {
      if (!map[q._subject]) map[q._subject] = [];
      map[q._subject].push(i);
    });
    return map;
  }, [questions]);

  const loadedSubjects = useMemo(() => Object.keys(subjectQuestionMap), [subjectQuestionMap]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFailedSubjects([]);

    const perSubject = Math.ceil(totalQuestions / subjectList.length);

    Promise.allSettled(subjectList.map((sub) => fetchQuestions(sub, exam, perSubject)))
      .then((results) => {
        const failed: string[] = [];
        let combined: TaggedQuestion[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            const tagged = result.value.map((q) => ({ ...q, _subject: subjectList[idx] }));
            combined = combined.concat(tagged);
          } else {
            failed.push(subjectList[idx]);
          }
        });
        setFailedSubjects(failed);
        if (combined.length === 0) {
          setError(failed.length > 0
            ? `Could not load questions for: ${failed.join(", ")}. Please try different subjects.`
            : "No questions available. Please try another subject.");
          return;
        }
        if (shuffleQ) combined = combined.sort(() => Math.random() - 0.5);
        if (shuffleO) {
          combined = combined.map((q) => {
            const indices = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
            return {
              ...q,
              options: indices.map((i) => q.options[i]),
              correct: indices.indexOf(q.correct),
            };
          });
        }
        const shuffled = combined.slice(0, totalQuestions);
        setQuestions(shuffled);
        setStarted(true);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectsParam, exam, totalQuestions]);

  const handleSubmit = useCallback(async () => {
    if (questions.length === 0) return;
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    const elapsed = totalTimeMins * 60 - timeLeft;
    await saveAttempt({
      examSlug: exam,
      subject: subjectList.join(", "),
      mode: "mock",
      totalQuestions: questions.length,
      correctAnswers: score,
      timeSpentSeconds: elapsed,
      answers,
    });
    navigate(
      `/results?score=${score}&total=${questions.length}&exam=${exam}&subject=${encodeURIComponent(subjectList.join(", "))}&mode=mock&time=${elapsed}`
    );
  }, [answers, navigate, exam, subjectList, questions, timeLeft, totalTimeMins]);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, handleSubmit]);

  // Keyboard shortcuts: Arrow keys navigate, A-E/1-5 select options, F flags
  useEffect(() => {
    if (!started || questions.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showSubmitModal || showCalculator || showReport) return;
      switch (e.key) {
        case "ArrowRight": case "ArrowDown":
          e.preventDefault();
          setCurrent((c) => Math.min(questions.length - 1, c + 1));
          break;
        case "ArrowLeft": case "ArrowUp":
          e.preventDefault();
          setCurrent((c) => Math.max(0, c - 1));
          break;
        case "a": case "A": case "1":
          if (questions[current]?.options.length > 0) setAnswers((a) => ({ ...a, [current]: 0 }));
          break;
        case "b": case "B": case "2":
          if (questions[current]?.options.length > 1) setAnswers((a) => ({ ...a, [current]: 1 }));
          break;
        case "c": case "C": case "3":
          if (questions[current]?.options.length > 2) setAnswers((a) => ({ ...a, [current]: 2 }));
          break;
        case "d": case "D": case "4":
          if (questions[current]?.options.length > 3) setAnswers((a) => ({ ...a, [current]: 3 }));
          break;
        case "e": case "E": case "5":
          if (questions[current]?.options.length > 4) setAnswers((a) => ({ ...a, [current]: 4 }));
          break;
        case "f": case "F":
          setFlagged((prev) => {
            const s = new Set(prev);
            if (s.has(current)) s.delete(current); else s.add(current);
            return s;
          });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [started, current, questions, showSubmitModal, showCalculator, showReport]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (gate.loading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading exam questions…</p>
        </div>
      </div>
    );
  }

  if (!gate.canStartMock) {
    return (
      <UpgradeGate
        title="Mock Exam Limit Reached"
        message={`Free users can take ${gate.monthlyMocksLimit} mock exams per month. Upgrade to Premium for unlimited access.`}
        used={gate.monthlyMocksUsed}
        limit={gate.monthlyMocksLimit}
        unit="Mock exams"
      />
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-destructive font-medium">{error || "No questions found."}</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 300;

  // Filter grid questions by active subject tab
  const gridIndices = activeSubjectTab && subjectQuestionMap[activeSubjectTab]
    ? subjectQuestionMap[activeSubjectTab]
    : questions.map((_, i) => i);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <div>
              <div className="font-display text-sm font-bold">{exam.toUpperCase()} Mock Exam</div>
              {failedSubjects.length > 0 && (
                <div className="text-xs text-accent font-medium">⚠ {failedSubjects.join(", ")} unavailable</div>
              )}
            </div>
            <button
              onClick={() => {
                const s = new Set(flagged);
                if (s.has(current)) s.delete(current);
                else s.add(current);
                setFlagged(s);
              }}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                flagged.has(current) ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Flag className={`h-3.5 w-3.5 ${flagged.has(current) ? "fill-accent" : ""}`} />
              {flagged.has(current) ? "Flagged" : "Flag"}
            </button>
            <button
              onClick={() => setShowCalculator((v) => !v)}
              className={`hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                showCalculator ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
              Calculator
            </button>
            <button
              onClick={() => setShowReport(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <TriangleAlert className="h-3.5 w-3.5" />
              Report
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
              {answeredCount}/{questions.length} answered
            </span>
            <div className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold ${
              isUrgent ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
            }`}>
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left Sidebar: Subject Tabs + Question Grid */}
        <div className="order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-border bg-card p-4 lg:w-72">
          {/* Subject Tabs */}
          {loadedSubjects.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveSubjectTab(null)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  !activeSubjectTab
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                All
              </button>
              {loadedSubjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setActiveSubjectTab(sub)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeSubjectTab === sub
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Attempt Counter */}
          <div className="mb-3 flex items-center justify-between">
            <span className="font-display text-sm font-bold">
              {activeSubjectTab || "All Questions"}
            </span>
            <span className="text-xs font-bold text-primary">
              Attempt: {
                activeSubjectTab
                  ? (subjectQuestionMap[activeSubjectTab] || []).filter((i) => answers[i] !== undefined).length
                  : answeredCount
              }/{gridIndices.length}
            </span>
          </div>

          {/* 7-Column Question Grid */}
          <div className="grid grid-cols-7 gap-1.5 max-h-[60vh] overflow-y-auto">
            {gridIndices.map((qIdx) => (
              <button
                key={qIdx}
                onClick={() => setCurrent(qIdx)}
                className={`flex h-9 w-full items-center justify-center rounded text-xs font-bold transition-all ${
                  qIdx === current
                    ? "ring-2 ring-primary bg-primary text-primary-foreground"
                    : answers[qIdx] !== undefined
                    ? "bg-primary/20 text-primary"
                    : flagged.has(qIdx)
                    ? "bg-accent/20 text-accent ring-1 ring-accent"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {qIdx + 1}
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-primary/20" /> Answered</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-muted border border-border" /> Unanswered</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-primary" /> Current</div>
            <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-accent/20 ring-1 ring-accent" /> Flagged</div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="order-1 lg:order-2 flex-1 px-4 py-6 lg:px-12 pb-24 lg:pb-6">
          <div className="mx-auto max-w-2xl">
            {/* Question header */}
            <div className="mb-2 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-muted-foreground">
                Question: {current + 1}/{questions.length}
              </span>
              {q._subject && (
                <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                  {q._subject}
                </span>
              )}
            </div>

            {q.section && (
              <p className="mb-2 text-sm italic text-muted-foreground">
                {q.section}
              </p>
            )}

            <p className="mb-8 text-base font-medium leading-relaxed lg:text-lg">{q.text}</p>

            {/* Options — radio-style like TestDriller */}
            <div className="space-y-3">
              {q.options.map((opt, idx) => {
                const isSelected = answers[current] === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setAnswers({ ...answers, [current]: idx })}
                    className={`group w-full text-left flex items-center gap-4 rounded-xl border p-4 text-sm transition-all ${
                      isSelected
                        ? "border-2 border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <span className="font-display text-sm font-bold text-muted-foreground w-5 shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className={isSelected ? "font-medium" : ""}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile toolbar */}
            <div className="mt-4 flex sm:hidden items-center gap-4">
              <button
                onClick={() => {
                  const s = new Set(flagged);
                  if (s.has(current)) s.delete(current);
                  else s.add(current);
                  setFlagged(s);
                }}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  flagged.has(current) ? "text-accent" : "text-muted-foreground"
                }`}
              >
                <Flag className={`h-3.5 w-3.5 ${flagged.has(current) ? "fill-accent" : ""}`} />
                {flagged.has(current) ? "Flagged" : "Flag"}
              </button>
              <button
                onClick={() => setShowCalculator((v) => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium ${
                  showCalculator ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                Calculator
              </button>
              <button
                onClick={() => setShowReport(true)}
                className={`flex items-center gap-1.5 text-xs font-medium text-muted-foreground`}
              >
                <TriangleAlert className="h-3.5 w-3.5" />
                Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="min-w-[110px]"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowSubmitModal(true)}
            className="min-w-[110px]"
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Submit
          </Button>
          <Button
            onClick={() => setCurrent(Math.min(questions.length - 1, current + 1))}
            disabled={current === questions.length - 1}
            className="min-w-[110px]"
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calculator */}
      {showCalculator && <ExamCalculator onClose={() => setShowCalculator(false)} />}

      {/* Report Question Modal */}
      {showReport && (
        <ReportQuestionModal
          questionText={q.text}
          subject={q._subject}
          examSlug={exam}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-accent" />
              <h3 className="font-display text-lg font-bold">Submit Exam?</h3>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              You have answered {answeredCount} of {questions.length} questions.
            </p>
            {answeredCount < questions.length && (
              <p className="mb-4 text-sm text-destructive font-medium">
                {questions.length - answeredCount} question(s) unanswered!
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Go Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTExam;

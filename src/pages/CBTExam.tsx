import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { saveAttempt } from "@/lib/save-attempt";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import UpgradeGate from "@/components/UpgradeGate";

const CBTExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exam = searchParams.get("exam") || "utme";

  // Support multi-subject via comma-separated "subjects" param, fallback to single "subject"
  const subjectsParam = searchParams.get("subjects") || searchParams.get("subject") || "mathematics";
  const subjectList = subjectsParam.split(",").map((s) => s.trim()).filter(Boolean);

  const totalQuestions = Math.max(Number(searchParams.get("questions")) || 20, 10);
  const totalTimeMins = Math.max(Number(searchParams.get("time")) || 30, 1);
  const shuffleQ = searchParams.get("shuffleQ") !== "false";
  const shuffleO = searchParams.get("shuffleO") !== "false";

  const gate = useSubscriptionGate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSubjects, setFailedSubjects] = useState<string[]>([]);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(totalTimeMins * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [started, setStarted] = useState(false);

  // Fetch questions for all selected subjects
  useEffect(() => {
    setLoading(true);
    setError(null);

    const perSubject = Math.ceil(totalQuestions / subjectList.length);

    Promise.all(subjectList.map((sub) => fetchQuestions(sub, exam, perSubject)))
      .then((results) => {
        // Combine, shuffle, and trim to exact count
        let combined = results.flat();
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
        if (shuffled.length === 0) {
          setError("No questions available. Please try another subject.");
        } else {
          setQuestions(shuffled);
          setStarted(true);
        }
      })
      .catch((err) => setError(err.message))
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-sm font-bold">{exam.toUpperCase()} Mock Exam</div>
            <div className="text-xs text-muted-foreground">{subjectList.length} subjects · {questions.length} questions</div>
          </div>
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Question Area */}
        <div className="flex-1 px-4 py-6 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="font-display text-sm font-bold text-muted-foreground">
                  Question {current + 1} of {questions.length}
                </span>
                {q.section && (
                  <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">{q.section}</span>
                )}
              </div>
              <button
                onClick={() => {
                  const s = new Set(flagged);
                  if (s.has(current)) s.delete(current);
                  else s.add(current);
                  setFlagged(s);
                }}
                className={`flex items-center gap-1 text-xs font-medium ${flagged.has(current) ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
              >
                <Flag className={`h-4 w-4 ${flagged.has(current) ? "fill-accent" : ""}`} />
                {flagged.has(current) ? "Flagged" : "Flag for review"}
              </button>
            </div>

            <p className="mb-8 text-lg font-medium leading-relaxed">{q.text}</p>

            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [current]: idx })}
                  className={`w-full text-left flex items-center gap-3 rounded-xl border p-4 text-sm transition-all ${
                    answers[current] === idx
                      ? "border-2 border-primary bg-primary/5 font-semibold"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    answers[current] === idx ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              {current === questions.length - 1 ? (
                <Button onClick={() => setShowSubmitModal(true)}>Submit Exam</Button>
              ) : (
                <Button onClick={() => setCurrent(current + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="border-t lg:border-t-0 lg:border-l border-border bg-card p-4 lg:w-64">
          <h3 className="mb-3 font-display text-sm font-bold">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-2 max-h-80 overflow-y-auto">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  i === current
                    ? "bg-primary text-primary-foreground"
                    : answers[i] !== undefined
                    ? "bg-primary/20 text-primary"
                    : flagged.has(i)
                    ? "bg-accent/20 text-accent border border-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary/20" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted" /> Unanswered ({questions.length - answeredCount})</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-accent bg-accent/20" /> Flagged ({flagged.size})</div>
          </div>
          <Button className="mt-4 w-full" onClick={() => setShowSubmitModal(true)}>
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
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

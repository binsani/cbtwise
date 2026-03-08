import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { saveAttempt } from "@/lib/save-attempt";

const CBTExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exam = searchParams.get("exam") || "utme";
  const subject = searchParams.get("subject") || "mathematics";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchQuestions(subject, exam, 20)
      .then((qs) => {
        if (qs.length === 0) {
          setError("No questions available. Please try another subject.");
        } else {
          setQuestions(qs);
          setStarted(true);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subject, exam]);

  const handleSubmit = useCallback(() => {
    if (questions.length === 0) return;
    const score = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    navigate(`/results?score=${score}&total=${questions.length}&exam=${exam}`);
  }, [answers, navigate, exam, questions]);

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
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading exam questions…</p>
        </div>
      </div>
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
          <div className="font-display text-sm font-bold">{exam.toUpperCase()} Mock Exam</div>
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
              <span className="font-display text-sm font-bold text-muted-foreground">
                Question {current + 1} of {questions.length}
              </span>
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
          <div className="grid grid-cols-5 gap-2">
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

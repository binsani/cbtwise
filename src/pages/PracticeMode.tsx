import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { saveAttempt } from "@/lib/save-attempt";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import UpgradeGate from "@/components/UpgradeGate";

const PracticeMode = () => {
  const [searchParams] = useSearchParams();
  const exam = searchParams.get("exam") || "utme";
  const subject = searchParams.get("subject") || "Biology";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchQuestions(subject, exam, 10)
      .then((qs) => {
        if (qs.length === 0) {
          setError("No questions available for this subject yet.");
        } else {
          setQuestions(qs);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [subject, exam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex max-w-2xl flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading questions…</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container max-w-2xl py-12 text-center">
          <p className="text-destructive font-medium">{error || "No questions found."}</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to={`/exams/${exam}/subjects`}>← Back to subjects</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const q = questions[current];
  const answered = selected[current] !== undefined;

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected({ ...selected, [current]: optIdx });
    setShowExplanation(true);
  };

  const next = () => {
    if (current < questions.length - 1) {
      setCurrent(current + 1);
      setShowExplanation(false);
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setShowExplanation(selected[current - 1] !== undefined);
    }
  };

  const toggleBookmark = () => {
    const newSet = new Set(bookmarked);
    if (newSet.has(q.id)) newSet.delete(q.id);
    else newSet.add(q.id);
    setBookmarked(newSet);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <div className="mb-6">
          <Link to={`/exams/${exam}/subjects`} className="text-sm text-primary hover:underline">← Back to subjects</Link>
          <h1 className="mt-2 font-display text-xl font-bold">{subject} — Practice</h1>
          <p className="text-xs text-muted-foreground">
            {exam.toUpperCase()} · {q.topic || "General"}{q.year ? ` · ${q.year}` : ""}
          </p>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Question {current + 1} of {questions.length}
            </span>
            <button onClick={toggleBookmark} className="text-muted-foreground hover:text-accent">
              <Bookmark className={`h-5 w-5 ${bookmarked.has(q.id) ? "fill-accent text-accent" : ""}`} />
            </button>
          </div>

          <p className="mb-6 text-base font-medium leading-relaxed">{q.text}</p>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let optionClass = "rounded-xl border border-border bg-background p-4 text-sm transition-all cursor-pointer hover:border-primary/50";
              if (answered) {
                if (idx === q.correct) optionClass = "rounded-xl border-2 border-success bg-success/5 p-4 text-sm";
                else if (idx === selected[current] && idx !== q.correct) optionClass = "rounded-xl border-2 border-destructive bg-destructive/5 p-4 text-sm";
                else optionClass = "rounded-xl border border-border bg-background p-4 text-sm opacity-60";
              } else if (selected[current] === idx) {
                optionClass = "rounded-xl border-2 border-primary bg-primary/5 p-4 text-sm";
              }

              return (
                <button
                  key={idx}
                  className={`${optionClass} w-full text-left flex items-center gap-3`}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                  {answered && idx === q.correct && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-success shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && q.explanation && (
            <div className="mt-6 rounded-xl bg-muted p-4">
              <h4 className="mb-1 font-display text-sm font-bold">Explanation</h4>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          {current === questions.length - 1 && Object.keys(selected).length === questions.length ? (
            <Button onClick={async () => {
              const score = Object.entries(selected).filter(([i, a]) => a === questions[Number(i)].correct).length;
              await saveAttempt({
                examSlug: exam,
                subject,
                mode: "practice",
                totalQuestions: questions.length,
                correctAnswers: score,
                answers: selected,
              });
              window.location.href = `/results?score=${score}&total=${questions.length}&exam=${exam}&subject=${encodeURIComponent(subject)}&mode=practice`;
            }}>
              View Results
            </Button>
          ) : (
            <Button onClick={next} disabled={current === questions.length - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PracticeMode;

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ExamBreadcrumb from "@/components/ExamBreadcrumb";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { saveAttempt } from "@/lib/save-attempt";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import UpgradeGate from "@/components/UpgradeGate";

const PracticeMode = () => {
  const [searchParams] = useSearchParams();
  const exam = searchParams.get("exam") || "utme";
  const subjectsParam = searchParams.get("subjects") || searchParams.get("subject") || "Biology";
  const subjectList = subjectsParam.split(",").map((s) => s.trim()).filter(Boolean);
  const subject = subjectList[0]; // display name
  const totalQuestions = Math.max(Number(searchParams.get("questions")) || 10, 5);
  const shuffleQ = searchParams.get("shuffleQ") !== "false";
  const shuffleO = searchParams.get("shuffleO") !== "false";
  const gate = useSubscriptionGate();

  interface TaggedQuestion extends Question {
    _subject: string;
  }

  const [questions, setQuestions] = useState<TaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSubjects, setFailedSubjects] = useState<string[]>([]);

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());


  useEffect(() => {
    setLoading(true);
    setError(null);
    setFailedSubjects([]);
    const perSubject = Math.ceil(totalQuestions / subjectList.length);
    Promise.allSettled(subjectList.map((s) => fetchQuestions(s, exam, perSubject)))
      .then((results) => {
        const failed: string[] = [];
        let combined: TaggedQuestion[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            combined = combined.concat(result.value.map((q) => ({ ...q, _subject: subjectList[idx] })));
          } else {
            failed.push(subjectList[idx]);
          }
        });
        setFailedSubjects(failed);
        if (combined.length === 0) {
          setError(failed.length > 0
            ? `Could not load questions for: ${failed.join(", ")}. Please try different subjects.`
            : "No questions available for the selected subject(s).");
          return;
        }
        if (shuffleQ) combined = combined.sort(() => Math.random() - 0.5);
        if (shuffleO) {
          combined = combined.map((q) => {
            const indices = q.options.map((_, i) => i).sort(() => Math.random() - 0.5);
            return { ...q, options: indices.map((i) => q.options[i]), correct: indices.indexOf(q.correct) };
          });
        }
        setQuestions(combined.slice(0, totalQuestions));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectsParam, exam, totalQuestions]);

  if (gate.loading || loading) {
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

  if (!gate.canStartPractice) {
    return (
      <UpgradeGate
        title="Daily Question Limit Reached"
        message={`Free users can practice ${gate.dailyQuestionsLimit} questions per day. Upgrade to Premium for unlimited access.`}
        used={gate.dailyQuestionsUsed}
        limit={gate.dailyQuestionsLimit}
        unit="Questions"
      />
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
          <ExamBreadcrumb items={[
            { label: "Exams", href: "/exams" },
            { label: "Setup", href: `/mock-setup?exam=${exam}` },
            { label: `${subject} — Practice` },
          ]} />
          <h1 className="font-display text-xl font-bold">{subject} — Practice</h1>
          <p className="text-xs text-muted-foreground">
            {exam.toUpperCase()} · {q.topic || "General"}{q.year ? ` · ${q.year}` : ""}
          </p>
        </div>

        {failedSubjects.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium">Some subjects couldn't be loaded</p>
              <p className="text-xs text-muted-foreground">
                Questions for <span className="font-semibold">{failedSubjects.join(", ")}</span> were unavailable.
                Continuing with {questions.length} questions from the remaining subjects.
              </p>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                Question {current + 1} of {questions.length}
              </span>
              {q._subject && (
                <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {q._subject}
                </span>
              )}
            </div>
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

import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ExamBreadcrumb from "@/components/ExamBreadcrumb";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertTriangle,
  LogOut,
  Eye,
  EyeOff,
  BookOpen,
} from "lucide-react";
import { fetchQuestions, type Question } from "@/lib/questions-api";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import UpgradeGate from "@/components/UpgradeGate";

interface TaggedQuestion extends Question {
  _subject: string;
}

const StudyMode = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exam = searchParams.get("exam") || "utme";
  const subjectsParam =
    searchParams.get("subjects") || searchParams.get("subject") || "Biology";
  const subjectList = subjectsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const subject = subjectList[0];
  const totalQuestions = Math.max(
    Number(searchParams.get("questions")) || 20,
    5
  );
  const shuffleQ = searchParams.get("shuffleQ") !== "false";
  const shuffleO = searchParams.get("shuffleO") !== "false";
  const gate = useSubscriptionGate();

  const [questions, setQuestions] = useState<TaggedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [failedSubjects, setFailedSubjects] = useState<string[]>([]);

  const [current, setCurrent] = useState(0);
  const [showAnswer, setShowAnswer] = useState(true);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [showEndModal, setShowEndModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setFailedSubjects([]);
    const perSubject = Math.ceil(totalQuestions / subjectList.length);
    Promise.allSettled(
      subjectList.map((s) => fetchQuestions(s, exam, perSubject))
    )
      .then((results) => {
        const failed: string[] = [];
        let combined: TaggedQuestion[] = [];
        results.forEach((result, idx) => {
          if (result.status === "fulfilled") {
            combined = combined.concat(
              result.value.map((q) => ({ ...q, _subject: subjectList[idx] }))
            );
          } else {
            failed.push(subjectList[idx]);
          }
        });
        setFailedSubjects(failed);
        if (combined.length === 0) {
          setError(
            failed.length > 0
              ? `Could not load questions for: ${failed.join(", ")}.`
              : "No questions available."
          );
          return;
        }
        if (shuffleQ) combined = combined.sort(() => Math.random() - 0.5);
        if (shuffleO) {
          combined = combined.map((q) => {
            const indices = q.options
              .map((_, i) => i)
              .sort(() => Math.random() - 0.5);
            return {
              ...q,
              options: indices.map((i) => q.options[i]),
              correct: indices.indexOf(q.correct),
            };
          });
        }
        setQuestions(combined.slice(0, totalQuestions));
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectsParam, exam, totalQuestions]);

  // Keyboard navigation
  useEffect(() => {
    if (questions.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (showEndModal) return;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          if (current < questions.length - 1) setCurrent(current + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          if (current > 0) setCurrent(current - 1);
          break;
        case "s":
        case "S":
          setShowAnswer((v) => !v);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [current, questions, showEndModal]);

  if (gate.loading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex max-w-2xl flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Loading study material…
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!gate.canStartPractice) {
    return (
      <UpgradeGate
        title="Daily Question Limit Reached"
        message={`Free users can study ${gate.dailyQuestionsLimit} questions per day. Upgrade to Premium for unlimited access.`}
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
          <p className="text-destructive font-medium">
            {error || "No questions found."}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <ExamBreadcrumb
              items={[
                { label: "Exams", href: "/exams" },
                { label: "Setup", href: `/mock-setup?exam=${exam}` },
                { label: `${subject} — Study` },
              ]}
            />
            <button
              onClick={() => setShowEndModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              End Study
            </button>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="font-display text-xl font-bold">
              Study Mode — {subject}
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {exam.toUpperCase()} · Browse at your own pace · No time limit
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>
              Question {current + 1} of {questions.length}
            </span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {failedSubjects.length > 0 && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-medium">
                Some subjects couldn't be loaded
              </p>
              <p className="text-xs text-muted-foreground">
                Questions for{" "}
                <span className="font-semibold">
                  {failedSubjects.join(", ")}
                </span>{" "}
                were unavailable.
              </p>
            </div>
          </div>
        )}

        {/* Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">
                Q{current + 1}
              </span>
              {q._subject && (
                <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {q._subject}
                </span>
              )}
              {q.topic && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {q.topic}
                </span>
              )}
              {q.year && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {q.year}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAnswer((v) => !v)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  showAnswer
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {showAnswer ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
                {showAnswer ? "Hide Answer" : "Show Answer"}
              </button>
              <button
                onClick={() => {
                  const s = new Set(bookmarked);
                  if (s.has(current)) s.delete(current);
                  else s.add(current);
                  setBookmarked(s);
                }}
                className="text-muted-foreground hover:text-accent"
              >
                <Bookmark
                  className={`h-5 w-5 ${
                    bookmarked.has(current) ? "fill-accent text-accent" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {q.section && (
            <p className="mb-2 text-sm italic text-muted-foreground">
              {q.section}
            </p>
          )}

          <p className="mb-6 text-base font-medium leading-relaxed">
            {q.text}
          </p>

          {/* Options with correct answer always highlighted */}
          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              const isCorrect = idx === q.correct;
              let optionClass =
                "rounded-xl border border-border bg-background p-4 text-sm w-full text-left flex items-center gap-3";

              if (showAnswer && isCorrect) {
                optionClass =
                  "rounded-xl border-2 border-green-500 bg-green-500/5 p-4 text-sm w-full text-left flex items-center gap-3";
              }

              return (
                <div key={idx} className={optionClass}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className={showAnswer && isCorrect ? "font-medium" : ""}>
                    {opt}
                  </span>
                  {showAnswer && isCorrect && (
                    <span className="ml-auto text-xs font-semibold text-green-600">
                      ✓ Correct
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation — always visible in study mode */}
          {showAnswer && q.explanation && (
            <div className="mt-6 rounded-xl bg-muted p-4">
              <h4 className="mb-1 font-display text-sm font-bold">
                Explanation
              </h4>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}

          {/* No explanation available */}
          {showAnswer && !q.explanation && (
            <div className="mt-6 rounded-xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground italic">
                No explanation available for this question.
              </p>
            </div>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              ←
            </kbd>{" "}
            /{" "}
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              →
            </kbd>{" "}
            Navigate
          </span>
          <span>
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              S
            </kbd>{" "}
            Toggle answer
          </span>
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => current > 0 && setCurrent(current - 1)}
            disabled={current === 0}
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          <span className="text-sm font-medium text-muted-foreground">
            {current + 1} / {questions.length}
          </span>
          <Button
            onClick={() =>
              current < questions.length - 1 && setCurrent(current + 1)
            }
            disabled={current === questions.length - 1}
          >
            Next <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </main>
      <Footer />

      {/* End Study Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <LogOut className="h-6 w-6 text-destructive" />
              <h3 className="font-display text-lg font-bold">End Study Session?</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              You've reviewed {current + 1} of {questions.length} questions. Are
              you sure you want to leave?
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEndModal(false)}
              >
                Continue
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => navigate(-1)}
              >
                End Study
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyMode;

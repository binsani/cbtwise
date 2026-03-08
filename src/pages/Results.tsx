import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RotateCcw, BarChart3, Home } from "lucide-react";
import { motion } from "framer-motion";

const Results = () => {
  const [searchParams] = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0");
  const total = parseInt(searchParams.get("total") || "20");
  const exam = searchParams.get("exam") || "utme";
  const subject = searchParams.get("subject") || "";
  const mode = searchParams.get("mode") || "mock";
  const timeSpent = parseInt(searchParams.get("time") || "0");
  const percentage = Math.round((score / total) * 100);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const getGrade = () => {
    if (percentage >= 80) return { label: "Excellent! 🎉", color: "text-success" };
    if (percentage >= 60) return { label: "Good job! 👍", color: "text-primary" };
    if (percentage >= 40) return { label: "Keep practising 💪", color: "text-accent" };
    return { label: "Needs improvement 📚", color: "text-destructive" };
  };

  const grade = getGrade();

  const subjectBreakdown = [
    { subject: "English", correct: 4, total: 5, pct: 80 },
    { subject: "Mathematics", correct: 3, total: 5, pct: 60 },
    { subject: "Biology", correct: 4, total: 5, pct: 80 },
    { subject: "Physics", correct: 3, total: 5, pct: 60 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-2xl border border-border bg-card p-8 text-center"
        >
          <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${percentage >= 60 ? "bg-primary/10" : "bg-destructive/10"}`}>
            {percentage >= 60 ? (
              <CheckCircle2 className="h-10 w-10 text-primary" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
          </div>
          <h1 className="mb-2 font-display text-3xl font-bold">{percentage}%</h1>
          <p className={`mb-1 text-lg font-semibold ${grade.color}`}>{grade.label}</p>
          <p className="text-sm text-muted-foreground">
            You scored {score} out of {total} questions correctly.
          </p>
          <p className="text-xs text-muted-foreground mt-1">{exam.toUpperCase()} Mock Exam · Time: 24:35</p>
        </motion.div>

        {/* Subject Breakdown */}
        <div className="mb-8 rounded-2xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Performance Breakdown
            </h2>
          </div>
          <div className="divide-y divide-border">
            {subjectBreakdown.map((s) => (
              <div key={s.subject} className="p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold">{s.subject}</span>
                  <span className="text-muted-foreground">{s.correct}/{s.total} ({s.pct}%)</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${s.pct >= 70 ? "bg-primary" : s.pct >= 50 ? "bg-accent" : "bg-destructive"}`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" asChild>
            <Link to="/dashboard"><Home className="mr-1 h-4 w-4" /> Dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to={`/mock-exam?exam=${exam}`}><RotateCcw className="mr-1 h-4 w-4" /> Retake Exam</Link>
          </Button>
          <Button asChild>
            <Link to="/analytics"><BarChart3 className="mr-1 h-4 w-4" /> View Analytics</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Results;

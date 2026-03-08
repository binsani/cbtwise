import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrendingUp, TrendingDown, BarChart3, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Attempt {
  exam_slug: string;
  subject: string;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  time_spent_seconds: number | null;
}

const Analytics = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_attempts")
      .select("exam_slug, subject, correct_answers, total_questions, completed_at, time_spent_seconds")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setAttempts(data || []);
        setLoading(false);
      });
  }, [user]);

  const totalTests = attempts.length;
  const overallAvg = totalTests > 0
    ? Math.round(attempts.reduce((s, a) => s + (a.correct_answers / a.total_questions) * 100, 0) / totalTests)
    : 0;

  // Subject aggregation
  const subjectMap: Record<string, { scores: number[]; total: number }> = {};
  attempts.forEach(a => {
    if (!subjectMap[a.subject]) subjectMap[a.subject] = { scores: [], total: 0 };
    subjectMap[a.subject].scores.push((a.correct_answers / a.total_questions) * 100);
    subjectMap[a.subject].total++;
  });

  const subjectData = Object.entries(subjectMap)
    .map(([subject, d]) => {
      const avg = Math.round(d.scores.reduce((s, v) => s + v, 0) / d.scores.length);
      // Trend: compare last attempt to average
      const lastScore = d.scores[0];
      const trend = lastScore >= avg ? "up" : "down";
      return { subject, avg, tests: d.total, trend };
    })
    .sort((a, b) => b.tests - a.tests);

  const bestSubject = subjectData.length > 0
    ? subjectData.reduce((best, s) => s.avg > best.avg ? s : best).subject
    : "—";

  // Streak
  const getStreak = () => {
    if (attempts.length === 0) return 0;
    const days = new Set(attempts.map(a => new Date(a.completed_at).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) streak++;
      else if (i > 0) break;
    }
    return streak;
  };

  // Recent scores for bar chart (last 10)
  const recentScores = attempts.slice(0, 10).reverse().map(a =>
    Math.round((a.correct_answers / a.total_questions) * 100)
  );

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

  const overviewCards = [
    { label: "Overall Average", value: `${overallAvg}%`, color: "text-primary" },
    { label: "Tests Taken", value: String(totalTests), color: "text-secondary" },
    { label: "Best Subject", value: bestSubject, color: "text-primary" },
    { label: "Study Streak", value: `${getStreak()} days`, color: "text-accent" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="mb-2 font-display text-2xl font-bold md:text-3xl">Performance Analytics</h1>
        <p className="mb-8 text-muted-foreground">Track your progress across subjects and exams.</p>

        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {overviewCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score Trend */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Recent Score Trend
          </h2>
          {recentScores.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Complete some tests to see your score trend.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {recentScores.map((score, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all"
                    style={{ height: `${score}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Performance */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Subject Performance</h2>
          </div>
          {subjectData.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No data yet. Start practicing to see subject breakdowns.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {subjectData.map((s) => (
                <div key={s.subject} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{s.subject}</div>
                    <div className="text-xs text-muted-foreground">{s.tests} tests taken</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${s.avg >= 70 ? "bg-primary" : s.avg >= 50 ? "bg-accent" : "bg-destructive"}`}
                          style={{ width: `${s.avg}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right font-display text-sm font-bold">{s.avg}%</span>
                    {s.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-primary" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;

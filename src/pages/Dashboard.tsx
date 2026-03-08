import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, BarChart3, Trophy, Flame, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useSubscriptionGate } from "@/hooks/use-subscription-gate";
import { formatDistanceToNow } from "date-fns";

interface Attempt {
  exam_slug: string;
  subject: string;
  correct_answers: number;
  total_questions: number;
  time_spent_seconds: number | null;
  completed_at: string;
  mode: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const gate = useSubscriptionGate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: attemptsData }, { data: profileData }] = await Promise.all([
        supabase
          .from("user_attempts")
          .select("exam_slug, subject, correct_answers, total_questions, time_spent_seconds, completed_at, mode")
          .eq("user_id", user.id)
          .order("completed_at", { ascending: false })
          .limit(50),
        supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single(),
      ]);
      setAttempts(attemptsData || []);
      setProfile(profileData);
      setLoading(false);
    };
    load();
  }, [user]);

  const totalTests = attempts.length;
  const avgScore = totalTests > 0
    ? Math.round(attempts.reduce((sum, a) => sum + (a.correct_answers / a.total_questions) * 100, 0) / totalTests)
    : 0;
  const totalSeconds = attempts.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);
  const totalHours = totalSeconds > 0 ? `${(totalSeconds / 3600).toFixed(1)} hrs` : "0 hrs";

  // Study streak: count consecutive days with attempts
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

  const streak = getStreak();
  const recentTests = attempts.slice(0, 5);

  // Find weakest subjects
  const subjectScores: Record<string, { total: number; correct: number; count: number }> = {};
  attempts.forEach(a => {
    if (!subjectScores[a.subject]) subjectScores[a.subject] = { total: 0, correct: 0, count: 0 };
    subjectScores[a.subject].total += a.total_questions;
    subjectScores[a.subject].correct += a.correct_answers;
    subjectScores[a.subject].count++;
  });
  const weakTopics = Object.entries(subjectScores)
    .map(([subject, d]) => ({ subject, score: Math.round((d.correct / d.total) * 100) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const firstName = profile?.full_name?.split(" ")[0] || "Student";

  const stats = [
    { label: "Tests Taken", value: String(totalTests), icon: BookOpen },
    { label: "Avg. Score", value: `${avgScore}%`, icon: Trophy },
    { label: "Study Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, icon: Flame },
    { label: "Time Spent", value: totalHours, icon: Clock },
  ];

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
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Welcome back, {firstName}! 👋</h1>
          <p className="text-muted-foreground">Here's your study progress.</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <Button asChild>
                <Link to="/exams">Continue Practicing <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link to="/mock-exam">Take Mock Exam</Link>
              </Button>
            </div>

            {/* Recent Tests */}
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-lg font-bold">Recent Tests</h2>
              </div>
              {recentTests.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No tests taken yet. Start practicing to see your results here!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTests.map((t, i) => {
                    const pct = Math.round((t.correct_answers / t.total_questions) * 100);
                    return (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div>
                          <div className="text-sm font-semibold">{t.subject}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.exam_slug.toUpperCase()} · {t.mode} · {formatDistanceToNow(new Date(t.completed_at), { addSuffix: true })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display text-lg font-bold text-primary">{pct}%</div>
                          <div className="text-xs text-muted-foreground">{t.correct_answers}/{t.total_questions}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Weak Topics */}
          <div>
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-lg font-bold">Focus Areas</h2>
                <p className="text-xs text-muted-foreground">Subjects that need attention</p>
              </div>
              {weakTopics.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Complete some tests to see focus areas.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {weakTopics.map((t, i) => (
                    <div key={i} className="p-4">
                      <div className="mb-1 text-sm font-semibold">{t.subject}</div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${t.score >= 70 ? "bg-primary" : t.score >= 50 ? "bg-accent" : "bg-destructive"}`} style={{ width: `${t.score}%` }} />
                      </div>
                      <div className={`mt-1 text-xs font-medium ${t.score >= 70 ? "text-primary" : t.score >= 50 ? "text-accent" : "text-destructive"}`}>{t.score}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {weakTopics.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="font-display text-sm font-bold">Recommendation</h3>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Focus on {weakTopics[0].subject} — your average is {weakTopics[0].score}%. Try more practice questions today.
                </p>
                <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                  <Link to={`/practice?subject=${encodeURIComponent(weakTopics[0].subject)}`}>Practice {weakTopics[0].subject}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

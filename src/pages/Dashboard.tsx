import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, BarChart3, Trophy, Flame, ArrowRight } from "lucide-react";

const stats = [
  { label: "Tests Taken", value: "24", icon: BookOpen },
  { label: "Avg. Score", value: "72%", icon: Trophy },
  { label: "Study Streak", value: "5 days", icon: Flame },
  { label: "Time Spent", value: "18 hrs", icon: Clock },
];

const recentTests = [
  { exam: "UTME", subject: "Mathematics", score: 78, total: 40, date: "Today" },
  { exam: "WAEC", subject: "English", score: 65, total: 60, date: "Yesterday" },
  { exam: "UTME", subject: "Biology", score: 82, total: 40, date: "2 days ago" },
  { exam: "NECO", subject: "Physics", score: 60, total: 60, date: "3 days ago" },
];

const weakTopics = [
  { subject: "Mathematics", topic: "Logarithms", score: 40 },
  { subject: "Chemistry", topic: "Organic Chemistry", score: 45 },
  { subject: "Physics", topic: "Electromagnetic Induction", score: 50 },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Welcome back, Chioma! 👋</h1>
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
          {/* Quick Actions */}
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
              <div className="divide-y divide-border">
                {recentTests.map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-4">
                    <div>
                      <div className="text-sm font-semibold">{t.subject}</div>
                      <div className="text-xs text-muted-foreground">{t.exam} · {t.date}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-primary">{t.score}%</div>
                      <div className="text-xs text-muted-foreground">{Math.round(t.total * t.score / 100)}/{t.total}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Weak Topics */}
          <div>
            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-display text-lg font-bold">Focus Areas</h2>
                <p className="text-xs text-muted-foreground">Topics that need attention</p>
              </div>
              <div className="divide-y divide-border">
                {weakTopics.map((t, i) => (
                  <div key={i} className="p-4">
                    <div className="mb-1 text-sm font-semibold">{t.topic}</div>
                    <div className="mb-2 text-xs text-muted-foreground">{t.subject}</div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-destructive" style={{ width: `${t.score}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-destructive font-medium">{t.score}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="font-display text-sm font-bold">Recommendation</h3>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Focus on Logarithms in Mathematics — you scored 40% on your last attempt. Try 20 more questions today.
              </p>
              <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                <Link to="/practice">Practice Logarithms</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;

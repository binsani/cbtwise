import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

const subjectData = [
  { subject: "Mathematics", avg: 62, tests: 8, trend: "up" },
  { subject: "English", avg: 78, tests: 6, trend: "up" },
  { subject: "Biology", avg: 71, tests: 5, trend: "down" },
  { subject: "Physics", avg: 55, tests: 7, trend: "up" },
  { subject: "Chemistry", avg: 48, tests: 4, trend: "down" },
];

const recentScores = [72, 65, 78, 60, 82, 70, 75, 68, 80, 74];

const Analytics = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="mb-2 font-display text-2xl font-bold md:text-3xl">Performance Analytics</h1>
        <p className="mb-8 text-muted-foreground">Track your progress across subjects and exams.</p>

        {/* Overview Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Overall Average", value: "68%", color: "text-primary" },
            { label: "Tests Taken", value: "30", color: "text-secondary" },
            { label: "Best Subject", value: "English", color: "text-primary" },
            { label: "Study Streak", value: "5 days", color: "text-accent" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className={`font-display text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score Trend (simple visual) */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-bold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Recent Score Trend
          </h2>
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
        </div>

        {/* Subject Performance */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Subject Performance</h2>
          </div>
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Analytics;

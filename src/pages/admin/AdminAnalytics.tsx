import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(152,55%,32%)", "hsl(215,65%,48%)", "hsl(38,92%,50%)", "hsl(0,72%,51%)", "hsl(280,60%,50%)"];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [examBreakdown, setExamBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [modeBreakdown, setModeBreakdown] = useState<{ name: string; value: number }[]>([]);
  const [dailyAttempts, setDailyAttempts] = useState<{ date: string; count: number }[]>([]);
  const [topSubjects, setTopSubjects] = useState<{ name: string; attempts: number }[]>([]);
  const [avgScore, setAvgScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    const { data: attempts } = await supabase
      .from("user_attempts")
      .select("exam_slug, subject, mode, completed_at, score_percent, total_questions")
      .order("completed_at", { ascending: false })
      .limit(1000);

    if (!attempts) { setLoading(false); return; }

    setTotalAttempts(attempts.length);

    // Avg score
    const scores = attempts.filter((a) => a.score_percent != null).map((a) => Number(a.score_percent));
    setAvgScore(scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0);

    // Exam breakdown
    const examCounts: Record<string, number> = {};
    const modeCounts: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};

    attempts.forEach((a) => {
      examCounts[a.exam_slug.toUpperCase()] = (examCounts[a.exam_slug.toUpperCase()] || 0) + 1;
      modeCounts[a.mode] = (modeCounts[a.mode] || 0) + 1;
      subjectCounts[a.subject] = (subjectCounts[a.subject] || 0) + 1;
      const date = new Date(a.completed_at).toISOString().slice(0, 10);
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    setExamBreakdown(Object.entries(examCounts).map(([name, value]) => ({ name, value })));
    setModeBreakdown(Object.entries(modeCounts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })));
    setTopSubjects(
      Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, attempts]) => ({ name, attempts }))
    );

    const last14 = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([date, count]) => ({ date: date.slice(5), count }));
    setDailyAttempts(last14);

    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics" description="Platform usage analytics">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" description="Platform usage analytics">
      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Total Attempts</div>
          <div className="font-display text-2xl font-bold">{totalAttempts.toLocaleString()}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Avg Score</div>
          <div className="font-display text-2xl font-bold">{avgScore}%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Exams Tracked</div>
          <div className="font-display text-2xl font-bold">{examBreakdown.length}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily attempts */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-display font-bold">Daily Attempts (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyAttempts}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="hsl(152,55%,32%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Exam breakdown */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-display font-bold">Attempts by Exam</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={examBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name} (${e.value})`}>
                {examBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top subjects */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-display font-bold">Top Subjects</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topSubjects} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="attempts" fill="hsl(215,65%,48%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mode breakdown */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-display font-bold">Practice vs Mock</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={modeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name} (${e.value})`}>
                {modeBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;

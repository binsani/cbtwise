import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, FileQuestion, BarChart3, Plus, TrendingUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  totalQuestions: number;
  totalAttempts: number;
}

interface Activity {
  user: string;
  action: string;
  time: string;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, subsRes, questionsRes, attemptsRes, recentAttemptsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("user_attempts").select("id", { count: "exact", head: true }),
        supabase.from("user_attempts").select("user_id, exam_slug, subject, mode, completed_at, total_questions").order("completed_at", { ascending: false }).limit(5),
      ]);

      setStats({
        totalUsers: profilesRes.count ?? 0,
        activeSubscribers: subsRes.count ?? 0,
        totalQuestions: questionsRes.count ?? 0,
        totalAttempts: attemptsRes.count ?? 0,
      });

      if (recentAttemptsRes.data) {
        const items: Activity[] = recentAttemptsRes.data.map((a) => {
          const ago = getTimeAgo(new Date(a.completed_at));
          return {
            user: a.user_id.slice(0, 8) + "…",
            action: `${a.mode === "mock" ? "Mock exam" : "Practice"}: ${a.subject} (${a.exam_slug.toUpperCase()}) — ${a.total_questions} questions`,
            time: ago,
          };
        });
        setActivity(items);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, change: "Registered accounts" },
        { label: "Active Subscribers", value: stats.activeSubscribers.toLocaleString(), icon: TrendingUp, change: "Paid plans" },
        { label: "Total Questions", value: stats.totalQuestions.toLocaleString(), icon: FileQuestion, change: "In database" },
        { label: "Tests Taken", value: stats.totalAttempts.toLocaleString(), icon: BarChart3, change: "All time" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Overview of CBTWise platform</p>
          </div>
          <Button asChild>
            <Link to="/admin/questions"><Plus className="mr-1 h-4 w-4" /> Manage Questions</Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {statCards.map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="font-display text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-xs text-primary">{s.change}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-4">
                  <h2 className="font-display text-lg font-bold">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  {[
                    { label: "Add Questions", icon: FileQuestion, to: "/admin/questions" },
                    { label: "Manage Exams", icon: BookOpen, to: "/admin/questions" },
                    { label: "View Users", icon: Users, to: "/admin" },
                    { label: "Analytics", icon: BarChart3, to: "/admin" },
                  ].map((action) => (
                    <Link
                      key={action.label}
                      to={action.to}
                      className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <action.icon className="h-4 w-4 text-primary" />
                      {action.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card">
                <div className="border-b border-border p-4">
                  <h2 className="font-display text-lg font-bold">Recent Activity</h2>
                </div>
                <div className="divide-y divide-border">
                  {activity.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">No recent activity yet.</div>
                  ) : (
                    activity.map((a, i) => (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div>
                          <div className="text-sm font-semibold">{a.user}</div>
                          <div className="text-xs text-muted-foreground">{a.action}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{a.time}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default AdminDashboard;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { Users, BookOpen, FileQuestion, BarChart3, TrendingUp, Loader2, CreditCard, MessageSquare, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface Stats {
  totalUsers: number;
  activeSubscribers: number;
  totalQuestions: number;
  totalAttempts: number;
  totalMessages: number;
}

interface Activity {
  user: string;
  action: string;
  time: string;
}

interface SubjectCoverage {
  name: string;
  examName: string;
  count: number;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [coverage, setCoverage] = useState<SubjectCoverage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, subsRes, questionsRes, attemptsRes, messagesRes, recentAttemptsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("questions").select("id", { count: "exact", head: true }),
        supabase.from("user_attempts").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("user_attempts").select("user_id, exam_slug, subject, mode, completed_at, total_questions").order("completed_at", { ascending: false }).limit(8),
      ]);

      setStats({
        totalUsers: profilesRes.count ?? 0,
        activeSubscribers: subsRes.count ?? 0,
        totalQuestions: questionsRes.count ?? 0,
        totalAttempts: attemptsRes.count ?? 0,
        totalMessages: messagesRes.count ?? 0,
      });

      if (recentAttemptsRes.data && recentAttemptsRes.data.length > 0) {
        // Fetch user names for recent attempts
        const userIds = [...new Set(recentAttemptsRes.data.map((a) => a.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);
        const nameMap: Record<string, string> = {};
        profiles?.forEach((p) => { nameMap[p.user_id] = p.full_name || "Unknown User"; });

        setActivity(
          recentAttemptsRes.data.map((a) => ({
            user: nameMap[a.user_id] || "Unknown User",
            action: `${a.mode === "mock" ? "Mock" : "Practice"}: ${a.subject} (${a.exam_slug.toUpperCase()}) — ${a.total_questions}q`,
            time: getTimeAgo(new Date(a.completed_at)),
          }))
        );
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, sub: "Registered accounts", to: "/admin/users" },
        { label: "Subscribers", value: stats.activeSubscribers.toLocaleString(), icon: TrendingUp, sub: "Active paid plans", to: "/admin/subscriptions" },
        { label: "Questions", value: stats.totalQuestions.toLocaleString(), icon: FileQuestion, sub: "In question bank", to: "/admin/questions" },
        { label: "Tests Taken", value: stats.totalAttempts.toLocaleString(), icon: BarChart3, sub: "All time", to: "/admin/analytics" },
        { label: "Messages", value: stats.totalMessages.toLocaleString(), icon: MessageSquare, sub: "Contact submissions", to: "/admin/messages" },
      ]
    : [];

  const quickActions = [
    { label: "Manage Questions", icon: FileQuestion, to: "/admin/questions" },
    { label: "Exams & Subjects", icon: BookOpen, to: "/admin/exams" },
    { label: "View Users", icon: Users, to: "/admin/users" },
    { label: "Subscriptions", icon: CreditCard, to: "/admin/subscriptions" },
    { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
    { label: "Messages", icon: MessageSquare, to: "/admin/messages" },
  ];

  if (loading) {
    return (
      <AdminLayout title="Dashboard" description="Overview of CBTWise platform">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" description="Overview of CBTWise platform">
      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {statCards.map((s) => (
          <Link key={s.label} to={s.to} className="rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="font-display text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="mt-1 text-xs text-primary">{s.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center gap-2 rounded-lg border border-border p-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                <a.icon className="h-4 w-4 text-primary" />
                {a.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-bold">Recent Activity</h2>
          </div>
          <div className="divide-y divide-border">
            {activity.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">No recent activity yet.</div>
            ) : (
              activity.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-3">
                  <div>
                    <div className="text-sm font-semibold">{a.user}</div>
                    <div className="text-xs text-muted-foreground">{a.action}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{a.time}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminOverview;

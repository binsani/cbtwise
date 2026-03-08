import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, FileQuestion, BarChart3, Plus, TrendingUp } from "lucide-react";

const stats = [
  { label: "Total Users", value: "2,847", icon: Users, change: "+124 this week" },
  { label: "Active Subscribers", value: "456", icon: TrendingUp, change: "+32 this month" },
  { label: "Total Questions", value: "11,200", icon: FileQuestion, change: "Across 3 exams" },
  { label: "Tests Taken", value: "18,340", icon: BarChart3, change: "+2,100 this week" },
];

const recentActivity = [
  { user: "Emeka O.", action: "Completed UTME Mathematics mock", time: "5 min ago" },
  { user: "Fatima M.", action: "Signed up for Premium", time: "12 min ago" },
  { user: "Adaobi K.", action: "Practised WAEC Biology (45 questions)", time: "28 min ago" },
  { user: "Chidi N.", action: "Submitted NECO English mock", time: "1 hr ago" },
  { user: "Aisha B.", action: "Created new account", time: "2 hrs ago" },
];

const AdminDashboard = () => {
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

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="font-display text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-1 text-xs text-primary">{s.change}</div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Quick Actions */}
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

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card">
            <div className="border-b border-border p-4">
              <h2 className="font-display text-lg font-bold">Recent Activity</h2>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-sm font-semibold">{a.user}</div>
                    <div className="text-xs text-muted-foreground">{a.action}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

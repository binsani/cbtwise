import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Subscription = Tables<"subscriptions">;

const AdminSubscriptions = () => {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchSubs();
  }, []);

  const fetchSubs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .order("created_at", { ascending: false });
    setSubs(data ?? []);
    setLoading(false);
  };

  const filtered = subs.filter((s) => {
    const matchSearch = s.user_id.toLowerCase().includes(search.toLowerCase()) || s.plan.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = {
    all: subs.length,
    active: subs.filter((s) => s.status === "active").length,
    expired: subs.filter((s) => s.status === "expired").length,
    cancelled: subs.filter((s) => s.status === "cancelled").length,
  };

  return (
    <AdminLayout title="Subscriptions" description={`${subs.length} total subscriptions`}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by user ID or plan..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(["all", "active", "expired", "cancelled"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                filterStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({statusCounts[status]})
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">User ID</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Starts</th>
                  <th className="px-4 py-3 text-left font-semibold">Ends</th>
                  <th className="px-4 py-3 text-left font-semibold">Payment Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No subscriptions found.</td></tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.user_id.slice(0, 12)}…</td>
                      <td className="px-4 py-3 font-medium capitalize">{s.plan}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                          s.status === "active"
                            ? "bg-primary/10 text-primary"
                            : s.status === "expired"
                            ? "bg-muted text-muted-foreground"
                            : "bg-destructive/10 text-destructive"
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{new Date(s.starts_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-xs">{s.ends_at ? new Date(s.ends_at).toLocaleDateString() : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.payment_reference || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border p-3 text-center text-xs text-muted-foreground">
            Showing {filtered.length} of {subs.length} subscriptions
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSubscriptions;

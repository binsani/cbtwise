import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  user_id: string;
  question_text: string;
  subject: string;
  exam_slug: string;
  reason: string;
  details: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
}

const AdminReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Report | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("question_reports" as any)
      .select("*")
      .order("created_at", { ascending: false }) as any;
    if (!error && data) setReports(data);
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = reports.filter((r) =>
    [r.question_text, r.subject, r.reason, r.exam_slug, r.status]
      .join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const updateStatus = async (id: string, status: string) => {
    setUpdating(true);
    const update: any = { status, admin_notes: adminNotes.trim() || null };
    if (status === "resolved" || status === "dismissed") update.resolved_at = new Date().toISOString();

    const { error } = await supabase
      .from("question_reports" as any)
      .update(update)
      .eq("id", id) as any;

    setUpdating(false);
    if (error) {
      toast.error("Failed to update");
    } else {
      toast.success(`Report ${status}`);
      setSelected(null);
      fetchReports();
    }
  };

  const statusColor = (s: string) => {
    if (s === "resolved") return "default";
    if (s === "dismissed") return "secondary";
    return "destructive";
  };

  return (
    <AdminLayout title="Question Reports" description="Review student-reported question errors">
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reports…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="outline">{reports.filter(r => r.status === "pending").length} pending</Badge>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No reports found.</p>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Question</th>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Reason</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 max-w-[200px] truncate">{r.question_text}</td>
                  <td className="px-4 py-3 capitalize">{r.subject}</td>
                  <td className="px-4 py-3">{r.reason}</td>
                  <td className="px-4 py-3"><Badge variant={statusColor(r.status)}>{r.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" onClick={() => { setSelected(r); setAdminNotes(r.admin_notes || ""); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Question</p>
                <p className="text-sm bg-muted rounded-lg p-3">{selected.question_text}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Subject:</span> <span className="capitalize">{selected.subject}</span></div>
                <div><span className="text-muted-foreground">Exam:</span> {selected.exam_slug.toUpperCase()}</div>
                <div><span className="text-muted-foreground">Reason:</span> {selected.reason}</div>
                <div><span className="text-muted-foreground">Status:</span> <Badge variant={statusColor(selected.status)}>{selected.status}</Badge></div>
              </div>
              {selected.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Student's details</p>
                  <p className="text-sm bg-muted rounded-lg p-3">{selected.details}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Admin notes</p>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} placeholder="Add resolution notes…" />
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => updateStatus(selected.id, "dismissed")} disabled={updating}>
                    <XCircle className="mr-1 h-4 w-4" /> Dismiss
                  </Button>
                  <Button className="flex-1" onClick={() => updateStatus(selected.id, "resolved")} disabled={updating}>
                    {updating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminReports;

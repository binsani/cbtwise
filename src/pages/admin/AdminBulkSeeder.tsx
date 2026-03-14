import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2, CheckCircle2, AlertTriangle, Database } from "lucide-react";
import { toast } from "sonner";

interface SubjectResult {
  exam: string;
  subject: string;
  slug: string;
  fetched: number;
  cached: number;
  duplicates: number;
  errors: string[];
}

interface BulkResult {
  summary: { totalFetched: number; totalCached: number; subjects: number };
  results: SubjectResult[];
}

const AdminBulkSeeder = () => {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [batches, setBatches] = useState(3);

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("bulk-fetch-aloc", {
        body: { batches },
      });

      if (error) {
        let msg = "Bulk fetch failed";
        try {
          const ctx = error.context as Response | undefined;
          if (ctx && typeof ctx.json === "function") {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        toast.error(msg);
        return;
      }

      setResult(data);
      toast.success(`Fetched ${data.summary.totalFetched} questions, cached ${data.summary.totalCached} new`);
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Question Seeder</h1>
          <p className="text-muted-foreground">
            Fetch questions from ALOC API for all subjects and cache them locally. Once your local bank is large enough, ALOC will no longer be needed.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Batches per subject</label>
              <select
                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={batches}
                onChange={(e) => setBatches(Number(e.target.value))}
                disabled={running}
              >
                {[1, 2, 3, 5, 7, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} batches (~{n * 40} questions/subject)
                  </option>
                ))}
              </select>
            </div>
            <Button onClick={handleRun} disabled={running} className="gap-2">
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fetching... (this may take a few minutes)
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Start Bulk Fetch
                </>
              )}
            </Button>
          </div>

          {running && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Processing all subjects across all exams. Please wait...
              </p>
              <Progress value={undefined} className="h-2" />
            </div>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Database className="mx-auto h-6 w-6 text-primary mb-2" />
                <p className="text-2xl font-bold">{result.summary.totalFetched}</p>
                <p className="text-sm text-muted-foreground">Total Fetched</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <CheckCircle2 className="mx-auto h-6 w-6 text-green-500 mb-2" />
                <p className="text-2xl font-bold">{result.summary.totalCached}</p>
                <p className="text-sm text-muted-foreground">New Cached</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <AlertTriangle className="mx-auto h-6 w-6 text-yellow-500 mb-2" />
                <p className="text-2xl font-bold">
                  {result.summary.totalFetched - result.summary.totalCached}
                </p>
                <p className="text-sm text-muted-foreground">Duplicates Skipped</p>
              </div>
            </div>

            {/* Per-subject results */}
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Subject</th>
                    <th className="px-4 py-3 text-left font-medium">Exam</th>
                    <th className="px-4 py-3 text-right font-medium">Fetched</th>
                    <th className="px-4 py-3 text-right font-medium">New</th>
                    <th className="px-4 py-3 text-right font-medium">Dupes</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {result.results.map((r, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2 font-medium">{r.subject}</td>
                      <td className="px-4 py-2 uppercase">
                        <Badge variant="outline">{r.exam}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{r.fetched}</td>
                      <td className="px-4 py-2 text-right text-green-600 font-medium">{r.cached}</td>
                      <td className="px-4 py-2 text-right text-muted-foreground">{r.duplicates}</td>
                      <td className="px-4 py-2">
                        {r.errors.length > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {r.errors[0]}
                          </Badge>
                        ) : r.cached > 0 ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-200">✓ OK</Badge>
                        ) : (
                          <Badge variant="secondary">No new</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBulkSeeder;

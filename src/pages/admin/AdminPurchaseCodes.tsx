import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Copy, Check, X, Download } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PurchaseCode = Tables<"purchase_codes">;

const AdminPurchaseCodes = () => {
  const [codes, setCodes] = useState<PurchaseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("purchase_codes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load purchase codes");
      console.error(error);
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const segments = [4, 4, 4];
    const code = segments
      .map((len) =>
        Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
      )
      .join("-");
    return `CBT-${code}`;
  };

  const escapeCsvValue = (value: string | number | null) => {
    const stringValue = value == null ? "" : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleDownloadCsv = () => {
    if (codes.length === 0) {
      toast.error("No purchase codes to export");
      return;
    }

    const headers = ["Code", "Duration Days", "Status", "Created At", "Used At", "Used By", "Notes"];

    const rows = codes.map((code) => [
      escapeCsvValue(code.code),
      escapeCsvValue(code.duration_days),
      escapeCsvValue(code.status),
      escapeCsvValue(code.created_at),
      escapeCsvValue(code.used_at),
      escapeCsvValue(code.used_by),
      escapeCsvValue(code.notes),
    ]);

    const csvContent = [headers.map(escapeCsvValue).join(","), ...rows.map((row) => row.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const datePart = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `purchase-codes-${datePart}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Purchase codes exported as CSV");
  };

  const handleGenerateCodes = async () => {
    if (quantity < 1 || quantity > 100) {
      toast.error("Quantity must be between 1 and 100");
      return;
    }

    if (duration < 1) {
      toast.error("Duration must be at least 1 day");
      return;
    }

    setGeneratingCodes(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const newCodes = Array.from({ length: quantity }, () => ({
        code: generateCode(),
        duration_days: duration,
        created_by: user.id,
        notes: notes || null,
      }));

      const { error } = await supabase.from("purchase_codes").insert(newCodes);

      if (error) {
        toast.error("Failed to generate codes");
        console.error(error);
      } else {
        toast.success(`Generated ${quantity} purchase code${quantity > 1 ? "s" : ""}`);
        setOpen(false);
        setQuantity(1);
        setDuration(30);
        setNotes("");
        fetchCodes();
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setGeneratingCodes(false);
    }
  };

  const handleCancelCode = async (id: string) => {
    const { error } = await supabase
      .from("purchase_codes")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      toast.error("Failed to cancel code");
      console.error(error);
    } else {
      toast.success("Code cancelled successfully");
      fetchCodes();
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "used":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "cancelled":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20";
      default:
        return "";
    }
  };

  const stats = {
    total: codes.length,
    active: codes.filter((c) => c.status === "active").length,
    used: codes.filter((c) => c.status === "used").length,
    cancelled: codes.filter((c) => c.status === "cancelled").length,
  };

  return (
    <AdminLayout title="Purchase Codes" description="Generate and manage purchase codes for premium access">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadCsv} disabled={loading || codes.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download as CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generate Codes
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Purchase Codes</DialogTitle>
                  <DialogDescription>
                    Create new purchase codes for students to activate premium access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max="100"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Maximum 100 codes per batch</p>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (Days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      How many days of premium access (e.g., 30, 90, 365)
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      placeholder="e.g., Batch for bank transfer payments"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateCodes} disabled={generatingCodes}>
                    {generatingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Codes</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active</CardDescription>
              <CardTitle className="text-3xl text-green-500">{stats.active}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Used</CardDescription>
              <CardTitle className="text-3xl text-blue-500">{stats.used}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cancelled</CardDescription>
              <CardTitle className="text-3xl text-destructive">{stats.cancelled}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Purchase Codes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Used By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No purchase codes generated yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      codes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-muted px-2 py-1 text-sm font-mono">
                                {code.code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(code.code)}
                              >
                                {copiedCode === code.code ? (
                                  <Check className="h-3 w-3" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{code.duration_days} days</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getStatusColor(code.status)}>
                              {code.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {code.used_by ? (
                              <span className="text-sm text-muted-foreground">
                                {code.used_by.slice(0, 8)}...
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(code.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {code.notes ? (
                              <span className="text-sm text-muted-foreground">{code.notes}</span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {code.status === "active" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancelCode(code.id)}
                              >
                                <X className="mr-1 h-3 w-3" />
                                Cancel
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPurchaseCodes;

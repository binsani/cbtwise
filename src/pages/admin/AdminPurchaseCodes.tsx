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
import { Loader2, Plus, Copy, Check, X, Download, Eye, EyeOff } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type PurchaseCode = Tables<"purchase_codes">;

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const generateEmailFromName = (name: string) => {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ".")
      .replace(/[^a-z0-9.]/g, "") +
    "@cbtwise.com.ng"
  );
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

const AdminPurchaseCodes = () => {
  const [codes, setCodes] = useState<PurchaseCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  // Form states
  const [studentName, setStudentName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");

  // Preview of generated email
  const previewEmail = studentName.trim() ? generateEmailFromName(studentName) : "";

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

  const escapeCsvValue = (value: string | number | null) => {
    const stringValue = value == null ? "" : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleDownloadCsv = () => {
    if (codes.length === 0) {
      toast.error("No purchase codes to export");
      return;
    }

    const headers = ["Student Name", "Email", "Password", "Code", "Duration Days", "Status", "Created At", "Used At", "Notes"];

    const rows = codes.map((code) => [
      escapeCsvValue(code.assigned_name),
      escapeCsvValue(code.assigned_email),
      escapeCsvValue(code.assigned_password),
      escapeCsvValue(code.code),
      escapeCsvValue(code.duration_days),
      escapeCsvValue(code.status),
      escapeCsvValue(code.created_at),
      escapeCsvValue(code.used_at),
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
    if (!studentName.trim() && quantity === 1) {
      toast.error("Please enter the student's full name");
      return;
    }

    if (quantity > 1 && studentName.trim()) {
      toast.error("For bulk generation, leave the name empty");
      return;
    }

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

      const newCodes = Array.from({ length: quantity }, (_, i) => {
        const name = studentName.trim() || `Student ${i + 1}`;
        const baseEmail = generateEmailFromName(name);
        // Add suffix for bulk to avoid collisions
        const assignedEmail = quantity > 1
          ? baseEmail.replace("@", `${i + 1}@`)
          : baseEmail;
        return {
          code: generateCode(),
          duration_days: duration,
          created_by: user.id,
          notes: notes || null,
          assigned_name: name,
          assigned_email: assignedEmail,
          assigned_password: generatePassword(),
        };
      });

      const { error } = await supabase.from("purchase_codes").insert(newCodes);

      if (error) {
        toast.error("Failed to generate codes");
        console.error(error);
      } else {
        toast.success(`Generated ${quantity} purchase code${quantity > 1 ? "s" : ""}`);
        setOpen(false);
        setStudentName("");
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

  const copyToClipboard = (text: string, label = "Code") => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
                  Generate Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                {!showConfirm ? (
                  <>
                    <DialogHeader>
                      <DialogTitle>Generate Purchase Code</DialogTitle>
                      <DialogDescription>
                        Enter the student's name — email and password will be auto-generated
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="studentName">Student Full Name</Label>
                        <Input
                          id="studentName"
                          type="text"
                          placeholder="e.g. John Doe"
                          value={studentName}
                          onChange={(e) => setStudentName(e.target.value)}
                        />
                        {previewEmail && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Email will be: <span className="font-mono font-medium text-foreground">{previewEmail}</span>
                          </p>
                        )}
                      </div>
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
                        <p className="mt-1 text-xs text-muted-foreground">
                          {quantity > 1 ? "Bulk mode: sequential emails will be generated" : "Maximum 100 codes per batch"}
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="duration">Duration (Days)</Label>
                        <div className="flex items-center gap-2 mt-1 mb-2">
                          {[
                            { label: "30 days", value: 30 },
                            { label: "90 days", value: 90 },
                            { label: "180 days", value: 180 },
                            { label: "1 year", value: 365 },
                          ].map((preset) => (
                            <Button
                              key={preset.value}
                              type="button"
                              variant={duration === preset.value ? "default" : "outline"}
                              size="sm"
                              onClick={() => setDuration(preset.value)}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                        <Input
                          id="duration"
                          type="number"
                          min="1"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                          Select a preset or enter a custom number of days
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Input
                          id="notes"
                          placeholder="e.g. Batch for bank transfer payments"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          if (!studentName.trim() && quantity === 1) {
                            toast.error("Please enter the student's full name");
                            return;
                          }
                          if (quantity > 1 && studentName.trim()) {
                            toast.error("For bulk generation, leave the name empty");
                            return;
                          }
                          if (quantity < 1 || quantity > 100) {
                            toast.error("Quantity must be between 1 and 100");
                            return;
                          }
                          if (duration < 1) {
                            toast.error("Duration must be at least 1 day");
                            return;
                          }
                          setShowConfirm(true);
                        }}
                      >
                        Review & Confirm
                      </Button>
                    </DialogFooter>
                  </>
                ) : (
                  <>
                    <DialogHeader>
                      <DialogTitle>Confirm Purchase Code Generation</DialogTitle>
                      <DialogDescription>
                        Please review the details below before generating
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 rounded-lg border border-border bg-muted/50 p-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Student Name</span>
                        <span className="text-sm font-medium">{studentName.trim() || `Bulk (${quantity} students)`}</span>
                      </div>
                      {studentName.trim() && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Email</span>
                          <span className="text-sm font-mono font-medium">{previewEmail}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Quantity</span>
                        <span className="text-sm font-medium">{quantity} code{quantity > 1 ? "s" : ""}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Duration</span>
                        <span className="text-sm font-medium">{duration} day{duration > 1 ? "s" : ""}</span>
                      </div>
                      {notes && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Notes</span>
                          <span className="text-sm font-medium max-w-[200px] text-right">{notes}</span>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowConfirm(false)}>
                        Back
                      </Button>
                      <Button onClick={handleGenerateCodes} disabled={generatingCodes}>
                        {generatingCodes && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Confirm & Generate
                      </Button>
                    </DialogFooter>
                  </>
                )}
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
            <CardDescription>Each code has auto-generated login credentials tied to cbtwise.com.ng</CardDescription>
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
                      <TableHead>Student</TableHead>
                      <TableHead>Credentials</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No purchase codes generated yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      codes.map((code) => (
                        <TableRow key={code.id}>
                          <TableCell>
                            <span className="font-medium">{code.assigned_name || "-"}</span>
                          </TableCell>
                          <TableCell>
                            {code.assigned_email ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-xs">{code.assigned_email}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => copyToClipboard(code.assigned_email!, "Email")}
                                  >
                                    {copiedCode === code.assigned_email ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="font-mono text-xs">
                                    {visiblePasswords.has(code.id)
                                      ? code.assigned_password
                                      : "••••••••••"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => togglePasswordVisibility(code.id)}
                                  >
                                    {visiblePasswords.has(code.id) ? (
                                      <EyeOff className="h-3 w-3" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </Button>
                                  {visiblePasswords.has(code.id) && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5"
                                      onClick={() => copyToClipboard(code.assigned_password!, "Password")}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
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

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tables } from "@/integrations/supabase/types";

type Exam = Tables<"exams">;
type Subject = Tables<"subjects">;

const AdminExams = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Exam dialog
  const [examDialog, setExamDialog] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState({ name: "", slug: "", description: "", color: "" });
  const [saving, setSaving] = useState(false);

  // Subject dialog
  const [subjectDialog, setSubjectDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState({ name: "", slug: "", exam_id: "" });

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<{ type: "exam" | "subject"; id: string; name: string } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [eRes, sRes] = await Promise.all([
      supabase.from("exams").select("*").order("name"),
      supabase.from("subjects").select("*").order("name"),
    ]);
    setExams(eRes.data ?? []);
    setSubjects(sRes.data ?? []);
    setLoading(false);
  };

  // Exam CRUD
  const openAddExam = () => { setEditingExam(null); setExamForm({ name: "", slug: "", description: "", color: "" }); setExamDialog(true); };
  const openEditExam = (e: Exam) => {
    setEditingExam(e);
    setExamForm({ name: e.name, slug: e.slug, description: e.description || "", color: e.color || "" });
    setExamDialog(true);
  };
  const saveExam = async () => {
    if (!examForm.name || !examForm.slug) { toast.error("Name and slug are required."); return; }
    setSaving(true);
    const payload = { name: examForm.name, slug: examForm.slug, description: examForm.description || null, color: examForm.color || null };
    if (editingExam) {
      const { error } = await supabase.from("exams").update(payload).eq("id", editingExam.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Exam updated.");
    } else {
      const { error } = await supabase.from("exams").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Exam created.");
    }
    setSaving(false); setExamDialog(false); fetchAll();
  };

  // Subject CRUD
  const openAddSubject = () => { setEditingSubject(null); setSubjectForm({ name: "", slug: "", exam_id: exams[0]?.id || "" }); setSubjectDialog(true); };
  const openEditSubject = (s: Subject) => {
    setEditingSubject(s);
    setSubjectForm({ name: s.name, slug: s.slug, exam_id: s.exam_id });
    setSubjectDialog(true);
  };
  const saveSubject = async () => {
    if (!subjectForm.name || !subjectForm.slug || !subjectForm.exam_id) { toast.error("All fields required."); return; }
    setSaving(true);
    const payload = { name: subjectForm.name, slug: subjectForm.slug, exam_id: subjectForm.exam_id };
    if (editingSubject) {
      const { error } = await supabase.from("subjects").update(payload).eq("id", editingSubject.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Subject updated.");
    } else {
      const { error } = await supabase.from("subjects").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Subject created.");
    }
    setSaving(false); setSubjectDialog(false); fetchAll();
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = deleteTarget.type === "exam"
      ? await supabase.from("exams").delete().eq("id", deleteTarget.id)
      : await supabase.from("subjects").delete().eq("id", deleteTarget.id);
    if (error) toast.error(error.message); else { toast.success(`${deleteTarget.name} deleted.`); fetchAll(); }
    setDeleteTarget(null);
  };

  const examMap = Object.fromEntries(exams.map((e) => [e.id, e]));

  if (loading) {
    return (
      <AdminLayout title="Exams & Subjects">
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Exams & Subjects" description="Manage exam types and their subjects">
      <Tabs defaultValue="exams">
        <TabsList>
          <TabsTrigger value="exams">Exams ({exams.length})</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({subjects.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={openAddExam} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Exam</Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Slug</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Subjects</th>
                  <th className="px-4 py-3 text-left font-semibold">Active</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exams.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.slug}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{e.description || "—"}</td>
                    <td className="px-4 py-3 text-sm">{subjects.filter((s) => s.exam_id === e.id).length}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${e.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {e.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditExam(e)} className="rounded p-1.5 hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ type: "exam", id: e.id, name: e.name })} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="subjects" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={openAddSubject} size="sm"><Plus className="mr-1 h-4 w-4" /> Add Subject</Button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Slug</th>
                  <th className="px-4 py-3 text-left font-semibold">Exam</th>
                  <th className="px-4 py-3 text-left font-semibold">Questions</th>
                  <th className="px-4 py-3 text-left font-semibold">Active</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{s.slug}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {examMap[s.exam_id]?.slug?.toUpperCase() ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{s.question_count ?? 0}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${s.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {s.is_active ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => openEditSubject(s)} className="rounded p-1.5 hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteTarget({ type: "subject", id: s.id, name: s.name })} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Exam Dialog */}
      <Dialog open={examDialog} onOpenChange={setExamDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Add Exam"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} /></div>
            <div><Label>Slug *</Label><Input value={examForm.slug} onChange={(e) => setExamForm({ ...examForm, slug: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={examForm.description} onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} /></div>
            <div><Label>Color</Label><Input value={examForm.color} onChange={(e) => setExamForm({ ...examForm, color: e.target.value })} placeholder="e.g. #10b981" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialog(false)}>Cancel</Button>
            <Button onClick={saveExam} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{editingExam ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subject Dialog */}
      <Dialog open={subjectDialog} onOpenChange={setSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} /></div>
            <div><Label>Slug *</Label><Input value={subjectForm.slug} onChange={(e) => setSubjectForm({ ...subjectForm, slug: e.target.value })} /></div>
            <div>
              <Label>Exam *</Label>
              <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={subjectForm.exam_id} onChange={(e) => setSubjectForm({ ...subjectForm, exam_id: e.target.value })}>
                <option value="">Select exam</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSubjectDialog(false)}>Cancel</Button>
            <Button onClick={saveSubject} disabled={saving}>{saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}{editingSubject ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Related data may also be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminExams;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Tables } from "@/integrations/supabase/types";

type Question = Tables<"questions">;

interface ExamOption { id: string; name: string; slug: string }
interface SubjectOption { id: string; name: string; exam_id: string }

const defaultForm = {
  text: "",
  exam_id: "",
  subject_id: "",
  options: ["", "", "", ""],
  correct_index: 0,
  explanation: "",
  topic: "",
  difficulty: "Medium",
  year: new Date().getFullYear(),
};

const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [qRes, eRes, sRes] = await Promise.all([
      supabase.from("questions").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("exams").select("id, name, slug"),
      supabase.from("subjects").select("id, name, exam_id"),
    ]);
    setQuestions(qRes.data ?? []);
    setExams(eRes.data ?? []);
    setSubjects(sRes.data ?? []);
    setLoading(false);
  };

  const examMap = Object.fromEntries(exams.map((e) => [e.id, e]));
  const subjectMap = Object.fromEntries(subjects.map((s) => [s.id, s]));

  const filtered = questions.filter((q) => {
    const matchSearch =
      q.text.toLowerCase().includes(search.toLowerCase()) ||
      (subjectMap[q.subject_id]?.name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchExam = filterExam === "all" || examMap[q.exam_id]?.slug === filterExam;
    return matchSearch && matchExam;
  });

  const filteredSubjects = form.exam_id
    ? subjects.filter((s) => s.exam_id === form.exam_id)
    : subjects;

  const openAdd = () => {
    setEditing(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    const opts = Array.isArray(q.options) ? (q.options as string[]) : ["", "", "", ""];
    setForm({
      text: q.text,
      exam_id: q.exam_id,
      subject_id: q.subject_id,
      options: opts.length >= 4 ? opts.slice(0, 4) : [...opts, ...Array(4 - opts.length).fill("")],
      correct_index: q.correct_index,
      explanation: q.explanation ?? "",
      topic: q.topic ?? "",
      difficulty: q.difficulty ?? "Medium",
      year: q.year ?? new Date().getFullYear(),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.text || !form.exam_id || !form.subject_id || form.options.some((o) => !o.trim())) {
      toast.error("Please fill all required fields and all 4 options.");
      return;
    }
    setSaving(true);
    const payload = {
      text: form.text,
      exam_id: form.exam_id,
      subject_id: form.subject_id,
      options: form.options,
      correct_index: form.correct_index,
      explanation: form.explanation || null,
      topic: form.topic || null,
      difficulty: form.difficulty,
      year: form.year,
    };

    if (editing) {
      const { error } = await supabase.from("questions").update(payload).eq("id", editing.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Question updated.");
    } else {
      const { error } = await supabase.from("questions").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success("Question added.");
    }
    setSaving(false);
    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("questions").delete().eq("id", deleteTarget.id);
    if (error) { toast.error(error.message); } else { toast.success("Question deleted."); fetchAll(); }
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin" className="text-sm text-primary hover:underline">← Back to Admin</Link>
            <h1 className="mt-1 font-display text-2xl font-bold">Question Management</h1>
          </div>
          <Button onClick={openAdd}><Plus className="mr-1 h-4 w-4" /> Add Question</Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search questions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {["all", ...exams.map((e) => e.slug)].map((slug) => (
              <button
                key={slug}
                onClick={() => setFilterExam(slug)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filterExam === slug ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {slug === "all" ? "All" : slug.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold">Question</th>
                      <th className="px-4 py-3 text-left font-semibold">Exam</th>
                      <th className="px-4 py-3 text-left font-semibold">Subject</th>
                      <th className="px-4 py-3 text-left font-semibold">Year</th>
                      <th className="px-4 py-3 text-left font-semibold">Difficulty</th>
                      <th className="px-4 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No questions found.</td></tr>
                    ) : (
                      filtered.map((q) => (
                        <tr key={q.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 max-w-[200px] truncate">{q.text}</td>
                          <td className="px-4 py-3">
                            <span className="rounded px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                              {examMap[q.exam_id]?.slug?.toUpperCase() ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{subjectMap[q.subject_id]?.name ?? "—"}</td>
                          <td className="px-4 py-3">{q.year ?? "—"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-medium ${
                              q.difficulty === "Easy" ? "text-primary" : q.difficulty === "Medium" ? "text-accent" : "text-destructive"
                            }`}>
                              {q.difficulty ?? "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button onClick={() => openEdit(q)} className="rounded p-1.5 hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                              <button onClick={() => setDeleteTarget(q)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Showing {filtered.length} of {questions.length} questions
            </div>
          </>
        )}
      </main>
      <Footer />

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Question" : "Add Question"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question Text *</Label>
              <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Exam *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.exam_id} onChange={(e) => setForm({ ...form, exam_id: e.target.value, subject_id: "" })}>
                  <option value="">Select exam</option>
                  {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <Label>Subject *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Select subject</option>
                  {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            {form.options.map((opt, i) => (
              <div key={i}>
                <Label className="flex items-center gap-2">
                  Option {String.fromCharCode(65 + i)} *
                  {form.correct_index === i && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">Correct</span>}
                </Label>
                <div className="flex gap-2">
                  <Input
                    className="flex-1"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...form.options];
                      newOpts[i] = e.target.value;
                      setForm({ ...form, options: newOpts });
                    }}
                  />
                  <Button
                    type="button"
                    variant={form.correct_index === i ? "default" : "outline"}
                    size="sm"
                    onClick={() => setForm({ ...form, correct_index: i })}
                  >
                    ✓
                  </Button>
                </div>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Difficulty</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                  {["Easy", "Medium", "Hard"].map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <Label>Year</Label>
                <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Topic</Label>
                <Input value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Explanation</Label>
              <Textarea value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminQuestions;

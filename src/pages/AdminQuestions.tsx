import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Edit, Trash2 } from "lucide-react";

const sampleQuestions = [
  { id: 1, exam: "UTME", subject: "Biology", topic: "Plant Biology", text: "The process by which green plants manufacture...", year: 2023, difficulty: "Medium", status: "Active" },
  { id: 2, exam: "UTME", subject: "Mathematics", topic: "Algebra", text: "What is the value of x if 2x + 5 = 15?", year: 2022, difficulty: "Easy", status: "Active" },
  { id: 3, exam: "WAEC", subject: "English", topic: "Comprehension", text: "Read the passage below and answer...", year: 2023, difficulty: "Medium", status: "Active" },
  { id: 4, exam: "NECO", subject: "Physics", topic: "Mechanics", text: "A body of mass 5kg is acted upon...", year: 2022, difficulty: "Hard", status: "Active" },
  { id: 5, exam: "UTME", subject: "Chemistry", topic: "Organic Chemistry", text: "The IUPAC name for CH3CH2OH is...", year: 2023, difficulty: "Easy", status: "Draft" },
  { id: 6, exam: "WAEC", subject: "Economics", topic: "Demand & Supply", text: "The law of demand states that...", year: 2021, difficulty: "Medium", status: "Active" },
];

const AdminQuestions = () => {
  const [search, setSearch] = useState("");
  const [filterExam, setFilterExam] = useState("all");

  const filtered = sampleQuestions.filter((q) => {
    const matchSearch = q.text.toLowerCase().includes(search.toLowerCase()) || q.subject.toLowerCase().includes(search.toLowerCase());
    const matchExam = filterExam === "all" || q.exam === filterExam;
    return matchSearch && matchExam;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link to="/admin" className="text-sm text-primary hover:underline">← Back to Admin</Link>
            <h1 className="mt-1 font-display text-2xl font-bold">Question Management</h1>
          </div>
          <Button><Plus className="mr-1 h-4 w-4" /> Add Question</Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search questions..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {["all", "UTME", "WAEC", "NECO"].map((exam) => (
              <button
                key={exam}
                onClick={() => setFilterExam(exam)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  filterExam === exam ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {exam === "all" ? "All" : exam}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
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
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 max-w-[200px] truncate">{q.text}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        q.exam === "UTME" ? "bg-exam-utme/10 text-exam-utme" :
                        q.exam === "WAEC" ? "bg-exam-waec/10 text-exam-waec" :
                        "bg-exam-neco/10 text-exam-neco"
                      }`}>
                        {q.exam}
                      </span>
                    </td>
                    <td className="px-4 py-3">{q.subject}</td>
                    <td className="px-4 py-3">{q.year}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${
                        q.difficulty === "Easy" ? "text-primary" : q.difficulty === "Medium" ? "text-accent" : "text-destructive"
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        q.status === "Active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="rounded p-1.5 hover:bg-muted"><Edit className="h-3.5 w-3.5" /></button>
                        <button className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Showing {filtered.length} of {sampleQuestions.length} questions
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminQuestions;

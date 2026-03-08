import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ExamBreadcrumb from "@/components/ExamBreadcrumb";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Subject {
  id: string;
  name: string;
  slug: string;
  topic_count: number | null;
  question_count: number | null;
}

const SubjectSelection = () => {
  const { examId } = useParams<{ examId: string }>();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [examName, setExamName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch exam info
      const { data: exam } = await supabase
        .from("exams")
        .select("id, name")
        .eq("slug", examId || "utme")
        .single();

      if (exam) {
        setExamName(exam.name);

        const { data: subs } = await supabase
          .from("subjects")
          .select("id, name, slug, topic_count, question_count")
          .eq("exam_id", exam.id)
          .eq("is_active", true)
          .order("name");

        setSubjects(subs || []);
      }
      setLoading(false);
    };
    load();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <ExamBreadcrumb items={[{ label: "Exams", href: "/exams" }, { label: examName }]} />
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{examName} Subjects</h1>
          <p className="text-muted-foreground">Choose a subject to start practising.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, i) => (
            <motion.div
              key={subject.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/practice?exam=${examId}&subject=${encodeURIComponent(subject.name)}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/30"
              >
                <div>
                  <h3 className="font-display text-base font-bold">{subject.name}</h3>
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    {subject.topic_count != null && <span>{subject.topic_count} topics</span>}
                    {subject.question_count != null && <span>{subject.question_count} questions</span>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="secondary" size="lg" asChild>
            <Link to={`/mock-setup?exam=${examId}`}>Take Full Mock Exam <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubjectSelection;

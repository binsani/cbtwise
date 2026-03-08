import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import ExamBreadcrumb from "@/components/ExamBreadcrumb";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Exam {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color: string | null;
}

const ExamSelection = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("exams")
        .select("id, slug, name, description, color")
        .eq("is_active", true)
        .order("created_at");
      setExams(data || []);
      setLoading(false);
    };
    load();
  }, []);

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
        <div className="mx-auto max-w-2xl text-center mb-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl mb-2">Select an Exam</h1>
          <p className="text-muted-foreground">Choose the exam you're preparing for to get started.</p>
        </div>

        <div className="mx-auto max-w-3xl grid gap-6">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
                <Link
                to={`/mock-setup?exam=${exam.slug}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
              >
                <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full ${exam.color ? `bg-${exam.color}` : "bg-primary"} shrink-0`} />
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold">{exam.name}</h2>
                  {exam.description && <p className="text-sm text-muted-foreground">{exam.description}</p>}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExamSelection;

import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const exams = [
  {
    id: "utme",
    name: "UTME (JAMB)",
    description: "Practice for the Unified Tertiary Matriculation Examination",
    subjects: 24,
    questions: "5,000+",
    color: "bg-exam-utme",
  },
  {
    id: "waec",
    name: "WAEC",
    description: "Prepare for the West African Senior School Certificate Examination",
    subjects: 20,
    questions: "3,500+",
    color: "bg-exam-waec",
  },
  {
    id: "neco",
    name: "NECO",
    description: "Get ready for the National Examinations Council exam",
    subjects: 18,
    questions: "2,500+",
    color: "bg-exam-neco",
  },
];

const ExamSelection = () => {
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
                to={`/exams/${exam.id}/subjects`}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:border-primary/30"
              >
                <div className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full ${exam.color} shrink-0`} />
                <div className="flex-1">
                  <h2 className="font-display text-xl font-bold">{exam.name}</h2>
                  <p className="text-sm text-muted-foreground">{exam.description}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{exam.subjects} subjects</span>
                    <span>{exam.questions} questions</span>
                  </div>
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

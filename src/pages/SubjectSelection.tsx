import { Link, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const subjectsByExam: Record<string, { name: string; topics: number; questions: number }[]> = {
  utme: [
    { name: "English Language", topics: 12, questions: 600 },
    { name: "Mathematics", topics: 15, questions: 800 },
    { name: "Biology", topics: 18, questions: 700 },
    { name: "Chemistry", topics: 14, questions: 650 },
    { name: "Physics", topics: 16, questions: 700 },
    { name: "Economics", topics: 10, questions: 500 },
    { name: "Government", topics: 12, questions: 450 },
    { name: "Literature in English", topics: 8, questions: 350 },
    { name: "Commerce", topics: 9, questions: 300 },
    { name: "CRS", topics: 10, questions: 350 },
  ],
  waec: [
    { name: "English Language", topics: 10, questions: 500 },
    { name: "Mathematics", topics: 14, questions: 700 },
    { name: "Biology", topics: 16, questions: 600 },
    { name: "Chemistry", topics: 12, questions: 550 },
    { name: "Physics", topics: 14, questions: 600 },
    { name: "Economics", topics: 9, questions: 400 },
    { name: "Civic Education", topics: 8, questions: 350 },
    { name: "Commerce", topics: 7, questions: 300 },
  ],
  neco: [
    { name: "English Language", topics: 10, questions: 400 },
    { name: "Mathematics", topics: 13, questions: 600 },
    { name: "Biology", topics: 15, questions: 500 },
    { name: "Chemistry", topics: 11, questions: 450 },
    { name: "Physics", topics: 13, questions: 500 },
    { name: "Economics", topics: 8, questions: 350 },
    { name: "Civic Education", topics: 7, questions: 300 },
  ],
};

const examNames: Record<string, string> = {
  utme: "UTME (JAMB)",
  waec: "WAEC",
  neco: "NECO",
};

const SubjectSelection = () => {
  const { examId } = useParams<{ examId: string }>();
  const subjects = subjectsByExam[examId || "utme"] || subjectsByExam.utme;
  const examName = examNames[examId || "utme"] || "UTME (JAMB)";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-12">
        <div className="mb-2">
          <Link to="/exams" className="text-sm text-primary hover:underline">← Back to Exams</Link>
        </div>
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold md:text-4xl">{examName} Subjects</h1>
          <p className="text-muted-foreground">Choose a subject to start practising.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, i) => (
            <motion.div
              key={subject.name}
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
                    <span>{subject.topics} topics</span>
                    <span>{subject.questions} questions</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="secondary" size="lg" asChild>
            <Link to={`/mock-exam?exam=${examId}`}>Take Full Mock Exam <ArrowRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SubjectSelection;

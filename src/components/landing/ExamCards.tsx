import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const exams = [
  {
    name: "UTME (JAMB)",
    slug: "utme",
    description: "Unified Tertiary Matriculation Examination — your gateway to university admission in Nigeria.",
    subjects: "English, Mathematics, Physics, Chemistry, Biology, Economics, Government & more",
    color: "bg-exam-utme",
    questions: "5,000+",
  },
  {
    name: "WAEC",
    slug: "waec",
    description: "West African Examinations Council — O'Level certification recognised across West Africa.",
    subjects: "English, Mathematics, Physics, Chemistry, Biology, Commerce, Literature & more",
    color: "bg-exam-waec",
    questions: "3,500+",
  },
  {
    name: "NECO",
    slug: "neco",
    description: "National Examinations Council — Nigeria's national senior school certificate examination.",
    subjects: "English, Mathematics, Physics, Chemistry, Biology, Civic Education & more",
    color: "bg-exam-neco",
    questions: "2,500+",
  },
];

const ExamCards = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">Choose Your Exam</h2>
          <p className="text-muted-foreground">
            We focus exclusively on the three exams that matter most to Nigerian students.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {exams.map((exam, i) => (
            <motion.div
              key={exam.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className={`mb-4 h-2 w-16 rounded-full ${exam.color}`} />
              <h3 className="mb-2 font-display text-xl font-bold">{exam.name}</h3>
              <p className="mb-3 text-sm text-muted-foreground">{exam.description}</p>
              <p className="mb-4 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Subjects:</span> {exam.subjects}
              </p>
              <div className="mb-4 text-sm font-semibold text-primary">{exam.questions} past questions</div>
              <Button variant="outline" size="sm" asChild className="w-full">
                <Link to={`/mock-setup?exam=${exam.name.toLowerCase().split(" ")[0]}`}>
                  Practice Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExamCards;

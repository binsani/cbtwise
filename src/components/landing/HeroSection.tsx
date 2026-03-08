import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Timer, BarChart3 } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              🇳🇬 Built for Nigerian students
            </span>
          </motion.div>

          <motion.h1
            className="mb-6 font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Practice Past Questions.{" "}
            <span className="text-gradient">Crush Your Exams.</span>
          </motion.h1>

          <motion.p
            className="mb-8 text-lg text-muted-foreground md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Prepare for UTME (JAMB), WAEC, and NECO with thousands of past questions,
            real CBT simulations, and instant performance feedback — all on your phone.
          </motion.p>

          <motion.div
            className="mb-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Button variant="hero" size="xl" asChild>
              <Link to="/exams">
                Practice Exam <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span>10,000+ Questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-secondary" />
              <span>Timed CBT Mode</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <span>Performance Analytics</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/5 blur-3xl" />
    </section>
  );
};

export default HeroSection;

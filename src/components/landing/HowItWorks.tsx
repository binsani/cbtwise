import { motion } from "framer-motion";
import { MousePointerClick, BookCheck, TrendingUp } from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    title: "Pick Your Exam",
    description: "Select UTME, WAEC, or NECO — then choose the subjects you're preparing for.",
  },
  {
    icon: BookCheck,
    title: "Practice & Take Mocks",
    description: "Answer past questions topic-by-topic or take a full CBT mock exam with a timer.",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description: "See your scores, weak areas, and what to study next. Get better every session.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">How It Works</h2>
          <p className="text-muted-foreground">Three simple steps to exam readiness.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-7 w-7 text-primary" />
              </div>
              <div className="mb-2 font-display text-sm font-bold text-primary">Step {i + 1}</div>
              <h3 className="mb-2 font-display text-lg font-bold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

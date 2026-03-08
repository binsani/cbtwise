import { motion } from "framer-motion";
import { Monitor, MessageSquareText, BarChart3, Smartphone, Clock, ShieldCheck } from "lucide-react";

const benefits = [
  { icon: Monitor, title: "Real CBT Experience", desc: "Practice in an interface that mirrors the actual exam — question navigator, timer, and all." },
  { icon: MessageSquareText, title: "Detailed Explanations", desc: "Understand why each answer is correct with clear, well-written explanations." },
  { icon: BarChart3, title: "Performance Tracking", desc: "Track your scores, spot weak topics, and study smarter with analytics." },
  { icon: Smartphone, title: "Mobile-First Design", desc: "Study anywhere — optimized for phones with fast loading, even on slow networks." },
  { icon: Clock, title: "Timed Practice", desc: "Build exam speed with timed sessions and full-length mock exams." },
  { icon: ShieldCheck, title: "Trusted Content", desc: "Curated past questions from real UTME, WAEC, and NECO exams." },
];

const BenefitsSection = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">Why Students Love CBTWise</h2>
          <p className="text-muted-foreground">Everything you need to prepare — nothing you don't.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: i * 0.08 }}
              className="rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-1 font-display text-base font-bold">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;

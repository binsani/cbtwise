import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Chioma A.",
    exam: "UTME 2025",
    score: "Scored 312",
    text: "CBTWise helped me identify my weak topics in Chemistry. I practised every day for 3 months and it paid off!",
  },
  {
    name: "Emeka O.",
    exam: "WAEC 2024",
    score: "7 A's, 2 B's",
    text: "The explanations are gold. I finally understood quadratic equations after using the practice mode here.",
  },
  {
    name: "Fatima M.",
    exam: "NECO 2024",
    score: "All Credits",
    text: "I used CBTWise on my phone whenever I had free time. The CBT mock made the real exam feel familiar.",
  },
];

const TestimonialsSection = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">What Students Are Saying</h2>
          <p className="text-muted-foreground">Real results from real Nigerian students.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.12 }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="mb-3 flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">"{t.text}"</p>
              <div>
                <div className="font-display text-sm font-bold">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.exam} · {t.score}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;

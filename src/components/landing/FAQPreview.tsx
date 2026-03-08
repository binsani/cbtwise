import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    q: "Is ExamDrill NG free to use?",
    a: "Yes! You can practise up to 20 questions per day and take 3 mock exams per month for free. Premium plans unlock unlimited access.",
  },
  {
    q: "Which exams does ExamDrill cover?",
    a: "We focus exclusively on UTME (JAMB), WAEC, and NECO — the three most important exams for Nigerian secondary school students.",
  },
  {
    q: "Are these real past questions?",
    a: "Yes. Our question bank is compiled from past UTME, WAEC, and NECO examinations, reviewed and categorised by subject and topic.",
  },
  {
    q: "Can I use ExamDrill on my phone?",
    a: "Absolutely. ExamDrill is built mobile-first. It works smoothly on any phone browser — no app download needed.",
  },
];

const FAQPreview = () => {
  return (
    <section className="bg-muted/50 py-16 md:py-20">
      <div className="container">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <h2 className="mb-3 font-display text-3xl font-bold md:text-4xl">Frequently Asked Questions</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="rounded-xl border border-border bg-card px-5"
              >
                <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 text-center">
            <Button variant="outline" asChild>
              <Link to="/faq">View All FAQs</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQPreview;

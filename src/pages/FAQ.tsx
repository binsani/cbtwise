import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  { q: "Is CBTWise free to use?", a: "Yes! The free plan gives you 20 questions per day and 3 mock exams per month. Premium plans unlock unlimited access, full explanations, and analytics." },
  { q: "Which exams does CBTWise cover?", a: "We focus exclusively on UTME (JAMB), WAEC, and NECO — the three most important exams for Nigerian secondary school students." },
  { q: "Are these real past questions?", a: "Yes. Our question bank is compiled from past UTME, WAEC, and NECO examinations, reviewed and categorised by subject and topic." },
  { q: "Can I use CBTWise on my phone?", a: "Absolutely. CBTWise is built mobile-first. It works smoothly on any phone browser — no app download needed." },
  { q: "How does the CBT mock exam work?", a: "Our CBT mock simulates the real exam experience — with a question navigator, countdown timer, flag for review, and auto-submit when time expires." },
  { q: "How do I upgrade to Premium?", a: "Click 'Go Premium' on the pricing page. We're integrating Paystack and Flutterwave for seamless Nigerian payment options." },
  { q: "Can I track my performance over time?", a: "Premium users get a full analytics dashboard showing subject-by-subject performance, weak topics, score trends, and study streak tracking." },
  { q: "Do you offer explanations for every question?", a: "Premium subscribers get detailed explanations for all questions. Free users see explanations for a limited number of daily questions." },
  { q: "Is my progress saved automatically?", a: "Yes. Your answers, scores, bookmarks, and progress are saved automatically when you're logged in." },
  { q: "How do I contact support?", a: "Email us at support@cbtwise.com or use the contact form on our Contact page. We typically respond within 24 hours." },
];

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-16">
        <h1 className="mb-2 font-display text-3xl font-bold md:text-4xl">Frequently Asked Questions</h1>
        <p className="mb-10 text-muted-foreground">Everything you need to know about CBTWise.</p>

        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="rounded-xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;

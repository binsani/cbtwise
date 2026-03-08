import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Bookmark, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";

const sampleQuestions = [
  {
    id: 1,
    text: "The process by which green plants manufacture their food using sunlight is called:",
    options: ["Respiration", "Photosynthesis", "Transpiration", "Osmosis"],
    correct: 1,
    explanation: "Photosynthesis is the process by which green plants use sunlight, carbon dioxide, and water to produce glucose and oxygen.",
    topic: "Plant Biology",
  },
  {
    id: 2,
    text: "What is the value of x if 2x + 5 = 15?",
    options: ["3", "5", "7", "10"],
    correct: 1,
    explanation: "2x + 5 = 15 → 2x = 10 → x = 5.",
    topic: "Algebra",
  },
  {
    id: 3,
    text: "Which of the following is NOT a function of the liver?",
    options: ["Bile production", "Detoxification", "Blood filtration", "Pumping blood"],
    correct: 3,
    explanation: "The heart pumps blood, not the liver. The liver produces bile, detoxifies harmful substances, and filters blood.",
    topic: "Human Biology",
  },
  {
    id: 4,
    text: "The chemical formula for water is:",
    options: ["H2O2", "H2O", "HO", "OH2"],
    correct: 1,
    explanation: "Water has the chemical formula H2O — two hydrogen atoms bonded to one oxygen atom.",
    topic: "General Chemistry",
  },
  {
    id: 5,
    text: "Which figure of speech is used in 'The wind whispered through the trees'?",
    options: ["Simile", "Metaphor", "Personification", "Hyperbole"],
    correct: 2,
    explanation: "Personification gives human qualities to non-human things. Here, the wind is said to 'whisper' like a person.",
    topic: "Figures of Speech",
  },
];

const PracticeMode = () => {
  const [searchParams] = useSearchParams();
  const exam = searchParams.get("exam") || "utme";
  const subject = searchParams.get("subject") || "Biology";
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());

  const q = sampleQuestions[current];
  const answered = selected[current] !== undefined;

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected({ ...selected, [current]: optIdx });
    setShowExplanation(true);
  };

  const next = () => {
    if (current < sampleQuestions.length - 1) {
      setCurrent(current + 1);
      setShowExplanation(false);
    }
  };

  const prev = () => {
    if (current > 0) {
      setCurrent(current - 1);
      setShowExplanation(selected[current - 1] !== undefined);
    }
  };

  const toggleBookmark = () => {
    const newSet = new Set(bookmarked);
    if (newSet.has(q.id)) newSet.delete(q.id);
    else newSet.add(q.id);
    setBookmarked(newSet);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-2xl py-8">
        <div className="mb-6">
          <Link to={`/exams/${exam}/subjects`} className="text-sm text-primary hover:underline">← Back to subjects</Link>
          <h1 className="mt-2 font-display text-xl font-bold">{subject} — Practice</h1>
          <p className="text-xs text-muted-foreground">{exam.toUpperCase()} · {q.topic}</p>
        </div>

        {/* Question Card */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-muted-foreground">
              Question {current + 1} of {sampleQuestions.length}
            </span>
            <button onClick={toggleBookmark} className="text-muted-foreground hover:text-accent">
              <Bookmark className={`h-5 w-5 ${bookmarked.has(q.id) ? "fill-accent text-accent" : ""}`} />
            </button>
          </div>

          <p className="mb-6 text-base font-medium leading-relaxed">{q.text}</p>

          <div className="space-y-3">
            {q.options.map((opt, idx) => {
              let optionClass = "rounded-xl border border-border bg-background p-4 text-sm transition-all cursor-pointer hover:border-primary/50";
              if (answered) {
                if (idx === q.correct) optionClass = "rounded-xl border-2 border-success bg-success/5 p-4 text-sm";
                else if (idx === selected[current] && idx !== q.correct) optionClass = "rounded-xl border-2 border-destructive bg-destructive/5 p-4 text-sm";
                else optionClass = "rounded-xl border border-border bg-background p-4 text-sm opacity-60";
              } else if (selected[current] === idx) {
                optionClass = "rounded-xl border-2 border-primary bg-primary/5 p-4 text-sm";
              }

              return (
                <button
                  key={idx}
                  className={`${optionClass} w-full text-left flex items-center gap-3`}
                  onClick={() => handleSelect(idx)}
                  disabled={answered}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                  {answered && idx === q.correct && (
                    <CheckCircle2 className="ml-auto h-5 w-5 text-success shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <div className="mt-6 rounded-xl bg-muted p-4">
              <h4 className="mb-1 font-display text-sm font-bold">Explanation</h4>
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={prev} disabled={current === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>
          {current === sampleQuestions.length - 1 && Object.keys(selected).length === sampleQuestions.length ? (
            <Button asChild>
              <Link to="/results">View Results</Link>
            </Button>
          ) : (
            <Button onClick={next} disabled={current === sampleQuestions.length - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PracticeMode;

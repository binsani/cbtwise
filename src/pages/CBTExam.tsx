import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Flag, ChevronLeft, ChevronRight, Clock, AlertTriangle } from "lucide-react";

const mockQuestions = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  text: [
    "The process of converting sugar into alcohol is known as:",
    "If log₁₀2 = 0.3010, find log₁₀8:",
    "The SI unit of force is:",
    "Which of the following is an example of a contact force?",
    "The organ responsible for detoxification in the human body is:",
    "Supply and demand intersect at the:",
    "Nigeria gained independence in which year?",
    "An element with atomic number 17 belongs to group:",
    "Which literary device is used when saying 'as brave as a lion'?",
    "The largest planet in our solar system is:",
    "Photosynthesis occurs in the:",
    "What is the derivative of x²?",
    "Sound waves are examples of:",
    "The capital of Lagos State is:",
    "Which gas is most abundant in the atmosphere?",
    "An acid has a pH value of:",
    "The powerhouse of the cell is:",
    "Inflation refers to:",
    "The first Governor-General of Nigeria was:",
    "Momentum equals mass multiplied by:",
  ][i],
  options: [
    ["Fermentation", "Photosynthesis", "Oxidation", "Hydrolysis"],
    ["0.6030", "0.9030", "0.3030", "1.2040"],
    ["Joule", "Newton", "Pascal", "Watt"],
    ["Gravity", "Friction", "Magnetism", "Electrostatic force"],
    ["Kidney", "Liver", "Lung", "Heart"],
    ["Market equilibrium", "Price ceiling", "Surplus", "Deficit"],
    ["1957", "1960", "1963", "1966"],
    ["I", "VII", "VIIA", "II"],
    ["Metaphor", "Simile", "Irony", "Onomatopoeia"],
    ["Saturn", "Jupiter", "Neptune", "Uranus"],
    ["Mitochondria", "Chloroplast", "Nucleus", "Ribosome"],
    ["x", "2x", "x²", "2"],
    ["Transverse waves", "Longitudinal waves", "Electromagnetic waves", "Surface waves"],
    ["Ikeja", "Lagos Island", "Victoria Island", "Lekki"],
    ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"],
    ["Less than 7", "7", "Greater than 7", "14"],
    ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
    ["A general rise in prices", "A fall in prices", "Increase in GDP", "Decrease in money supply"],
    ["Nnamdi Azikiwe", "Obafemi Awolowo", "Ahmadu Bello", "Tafawa Balewa"],
    ["Velocity", "Acceleration", "Force", "Distance"],
  ][i],
  correct: [0, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0][i],
}));

const CBTExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const exam = searchParams.get("exam") || "utme";
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const score = mockQuestions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    navigate(`/results?score=${score}&total=${mockQuestions.length}&exam=${exam}`);
  }, [answers, navigate, exam]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const q = mockQuestions[current];
  const answeredCount = Object.keys(answers).length;
  const isUrgent = timeLeft < 300;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-50 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="font-display text-sm font-bold">{exam.toUpperCase()} Mock Exam</div>
          <div className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted"}`}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Question Area */}
        <div className="flex-1 px-4 py-6 lg:px-12">
          <div className="mx-auto max-w-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-sm font-bold text-muted-foreground">
                Question {current + 1} of {mockQuestions.length}
              </span>
              <button
                onClick={() => {
                  const s = new Set(flagged);
                  if (s.has(current)) s.delete(current);
                  else s.add(current);
                  setFlagged(s);
                }}
                className={`flex items-center gap-1 text-xs font-medium ${flagged.has(current) ? "text-accent" : "text-muted-foreground hover:text-accent"}`}
              >
                <Flag className={`h-4 w-4 ${flagged.has(current) ? "fill-accent" : ""}`} />
                {flagged.has(current) ? "Flagged" : "Flag for review"}
              </button>
            </div>

            <p className="mb-8 text-lg font-medium leading-relaxed">{q.text}</p>

            <div className="space-y-3">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers({ ...answers, [current]: idx })}
                  className={`w-full text-left flex items-center gap-3 rounded-xl border p-4 text-sm transition-all ${
                    answers[current] === idx
                      ? "border-2 border-primary bg-primary/5 font-semibold"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    answers[current] === idx ? "bg-primary text-primary-foreground" : "border border-border"
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>

            {/* Nav */}
            <div className="mt-8 flex items-center justify-between">
              <Button variant="outline" onClick={() => setCurrent(Math.max(0, current - 1))} disabled={current === 0}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Previous
              </Button>
              {current === mockQuestions.length - 1 ? (
                <Button onClick={() => setShowSubmitModal(true)}>Submit Exam</Button>
              ) : (
                <Button onClick={() => setCurrent(current + 1)}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question Palette */}
        <div className="border-t lg:border-t-0 lg:border-l border-border bg-card p-4 lg:w-64">
          <h3 className="mb-3 font-display text-sm font-bold">Question Navigator</h3>
          <div className="grid grid-cols-5 gap-2">
            {mockQuestions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                  i === current
                    ? "bg-primary text-primary-foreground"
                    : answers[i] !== undefined
                    ? "bg-primary/20 text-primary"
                    : flagged.has(i)
                    ? "bg-accent/20 text-accent border border-accent"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary/20" /> Answered ({answeredCount})</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted" /> Unanswered ({mockQuestions.length - answeredCount})</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded border border-accent bg-accent/20" /> Flagged ({flagged.size})</div>
          </div>
          <Button className="mt-4 w-full" onClick={() => setShowSubmitModal(true)}>
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-accent" />
              <h3 className="font-display text-lg font-bold">Submit Exam?</h3>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              You have answered {answeredCount} of {mockQuestions.length} questions.
            </p>
            {answeredCount < mockQuestions.length && (
              <p className="mb-4 text-sm text-destructive font-medium">
                {mockQuestions.length - answeredCount} question(s) unanswered!
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSubmitModal(false)}>
                Go Back
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CBTExam;

import { useMemo } from "react";
import { Lightbulb } from "lucide-react";

const quotes = [
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Education is the passport to the future, for tomorrow belongs to those who prepare for it today.", author: "Malcolm X" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "A little progress each day adds up to big results.", author: "Satya Nani" },
  { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "Strive for progress, not perfection.", author: "Unknown" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
];

const DailyQuote = () => {
  const quote = useMemo(() => {
    const today = new Date();
    const dayIndex = Math.floor(today.getTime() / 86400000) % quotes.length;
    return quotes[dayIndex];
  }, []);

  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Lightbulb className="h-4.5 w-4.5 text-accent" />
      </div>
      <div>
        <p className="text-sm font-medium italic text-foreground">"{quote.text}"</p>
        <p className="mt-1 text-xs text-muted-foreground">— {quote.author}</p>
      </div>
    </div>
  );
};

export default DailyQuote;

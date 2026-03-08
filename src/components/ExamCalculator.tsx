import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";

interface ExamCalculatorProps {
  onClose: () => void;
}

const BUTTONS = [
  ["7", "8", "9", "/", "C"],
  ["4", "5", "6", "×", "√"],
  ["1", "2", "3", "-", "x²"],
  ["0", ".", "+", "="],
];

const ExamCalculator = ({ onClose }: ExamCalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  // Dragging
  const dragRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Center on mount
    setPos({
      x: Math.max(0, (window.innerWidth - 280) / 2),
      y: Math.max(60, (window.innerHeight - 360) / 2),
    });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setDragging(true);
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [pos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 280, e.clientX - offset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 100, e.clientY - offset.current.y)),
    });
  }, [dragging]);

  const onPointerUp = useCallback(() => setDragging(false), []);

  const calculate = (a: number, operator: string, b: number): number => {
    switch (operator) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "/": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const handleButton = (btn: string) => {
    if (btn === "C") {
      setDisplay("0");
      setPrev(null);
      setOp(null);
      setFresh(true);
      return;
    }

    if (btn === "√") {
      const val = parseFloat(display);
      setDisplay(val >= 0 ? String(Math.sqrt(val)) : "Error");
      setFresh(true);
      return;
    }

    if (btn === "x²") {
      const val = parseFloat(display);
      setDisplay(String(val * val));
      setFresh(true);
      return;
    }

    if (["+", "-", "×", "/"].includes(btn)) {
      const cur = parseFloat(display);
      if (prev !== null && op && !fresh) {
        const result = calculate(prev, op, cur);
        setPrev(result);
        setDisplay(String(result));
      } else {
        setPrev(cur);
      }
      setOp(btn);
      setFresh(true);
      return;
    }

    if (btn === "=") {
      if (prev !== null && op) {
        const cur = parseFloat(display);
        const result = calculate(prev, op, cur);
        setDisplay(String(result));
        setPrev(null);
        setOp(null);
        setFresh(true);
      }
      return;
    }

    // Number or decimal
    if (fresh) {
      setDisplay(btn === "." ? "0." : btn);
      setFresh(false);
    } else {
      if (btn === "." && display.includes(".")) return;
      setDisplay(display === "0" && btn !== "." ? btn : display + btn);
    }
  };

  return (
    <div
      ref={dragRef}
      className="fixed z-[100] w-[272px] rounded-xl border border-border bg-card shadow-2xl select-none"
      style={{ left: pos.x, top: pos.y }}
    >
      {/* Title bar — draggable */}
      <div
        className="flex cursor-grab items-center justify-between rounded-t-xl bg-primary px-3 py-2 active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="text-xs font-bold text-primary-foreground">Calculator</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Display */}
      <div className="mx-2 mt-2 rounded-md border border-border bg-background px-3 py-2.5 text-right font-mono text-lg font-bold text-foreground truncate">
        {display}
      </div>

      {/* Buttons */}
      <div className="p-2 space-y-1.5">
        {BUTTONS.map((row, ri) => (
          <div key={ri} className={`grid gap-1.5 ${ri === 3 ? "grid-cols-4" : "grid-cols-5"}`}>
            {row.map((btn) => {
              const isOp = ["+", "-", "×", "/", "=", "C", "√", "x²"].includes(btn);
              const isEquals = btn === "=";
              const isClear = btn === "C";
              return (
                <button
                  key={btn}
                  onClick={() => handleButton(btn)}
                  className={`flex h-11 items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                    isEquals
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : isClear
                      ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                      : isOp
                      ? "bg-muted text-foreground hover:bg-muted/80"
                      : "bg-secondary/30 text-foreground hover:bg-secondary/50"
                  }`}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExamCalculator;

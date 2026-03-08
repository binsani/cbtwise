import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, X, Loader2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportQuestionModalProps {
  questionText: string;
  subject: string;
  examSlug: string;
  onClose: () => void;
}

const REASONS = [
  "Wrong answer marked as correct",
  "Question has a typo or error",
  "Options are incorrect or missing",
  "Question is unclear or ambiguous",
  "Other",
];

const ReportQuestionModal = ({ questionText, subject, examSlug, onClose }: ReportQuestionModalProps) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason");
      return;
    }

    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to report");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("question_reports" as any).insert({
      user_id: user.id,
      question_text: questionText.slice(0, 500),
      subject,
      exam_slug: examSlug,
      reason,
      details: details.trim().slice(0, 1000) || null,
    } as any);

    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit report. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
        {submitted ? (
          <div className="text-center py-4">
            <CheckCircle2 className="mx-auto h-10 w-10 text-primary mb-3" />
            <h3 className="font-display text-lg font-bold mb-1">Report Submitted</h3>
            <p className="text-sm text-muted-foreground mb-4">Thank you! Our team will review this question.</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="font-display text-lg font-bold">Report an Error</h3>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mb-1 text-xs text-muted-foreground">Question:</p>
            <p className="mb-4 text-sm bg-muted rounded-lg p-3 line-clamp-3">{questionText}</p>

            <p className="mb-2 text-sm font-medium">What's wrong?</p>
            <div className="space-y-2 mb-4">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`w-full text-left rounded-lg border px-3 py-2 text-sm transition-colors ${
                    reason === r
                      ? "border-primary bg-primary/5 font-medium"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="mb-4"
              rows={3}
              maxLength={1000}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={submitting || !reason}>
                {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
                Submit Report
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportQuestionModal;

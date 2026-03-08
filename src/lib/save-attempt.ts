import { supabase } from "@/integrations/supabase/client";

interface SaveAttemptParams {
  examSlug: string;
  subject: string;
  mode: "practice" | "mock";
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds?: number;
  answers?: Record<number, number>;
}

export async function saveAttempt(params: SaveAttemptParams): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("user_attempts").insert({
    user_id: user.id,
    exam_slug: params.examSlug,
    subject: params.subject,
    mode: params.mode,
    total_questions: params.totalQuestions,
    correct_answers: params.correctAnswers,
    time_spent_seconds: params.timeSpentSeconds ?? null,
    answers: params.answers ? JSON.stringify(params.answers) : null,
  });

  if (error) {
    console.error("Failed to save attempt:", error);
  }
}

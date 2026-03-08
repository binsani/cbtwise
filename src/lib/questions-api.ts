import { supabase } from "@/integrations/supabase/client";

export interface Question {
  id: number;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
  topic: string;
  year: number | null;
  section: string;
}

export async function fetchQuestions(
  subject: string,
  examType: string = "utme",
  amount: number = 10
): Promise<Question[]> {
  const { data, error } = await supabase.functions.invoke("fetch-questions", {
    body: { subject, exam_type: examType, amount },
  });

  if (error) {
    console.error("Error fetching questions:", error);
    throw new Error("Failed to load questions. Please try again.");
  }

  return data?.questions || [];
}

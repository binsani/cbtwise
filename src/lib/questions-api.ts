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

    // Try to extract a user-friendly message from the response
    try {
      const context = error.context as Response | undefined;
      if (context && typeof context.json === "function") {
        const body = await context.json();
        if (body?.message) {
          throw new Error(body.message);
        }
      }
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== "Failed to load questions. Please try again.") {
        throw parseErr;
      }
    }

    throw new Error("Failed to load questions. Please try again.");
  }

  return data?.questions || [];
}

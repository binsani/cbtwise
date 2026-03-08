import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UsageStatus {
  loading: boolean;
  isPremium: boolean;
  dailyQuestionsUsed: number;
  dailyQuestionsLimit: number;
  monthlyMocksUsed: number;
  monthlyMocksLimit: number;
  canStartPractice: boolean;
  canStartMock: boolean;
}

const FREE_DAILY_QUESTIONS = 20;
const FREE_MONTHLY_MOCKS = 3;

export function useSubscriptionGate(): UsageStatus {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [dailyQuestionsUsed, setDailyQuestionsUsed] = useState(0);
  const [monthlyMocksUsed, setMonthlyMocksUsed] = useState(0);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const check = async () => {
      setLoading(true);

      // Check active subscription
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("id, status, ends_at")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      const hasActiveSub = !!sub && (!sub.ends_at || new Date(sub.ends_at) > new Date());
      setIsPremium(hasActiveSub);

      if (hasActiveSub) {
        setLoading(false);
        return;
      }

      // Count today's practice questions
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayAttempts } = await supabase
        .from("user_attempts")
        .select("total_questions")
        .eq("user_id", user.id)
        .eq("mode", "practice")
        .gte("completed_at", todayStart.toISOString());

      const questionsToday = (todayAttempts || []).reduce(
        (sum, a) => sum + (a.total_questions || 0),
        0
      );
      setDailyQuestionsUsed(questionsToday);

      // Count this month's mock exams
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: mocksThisMonth } = await supabase
        .from("user_attempts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("mode", "mock")
        .gte("completed_at", monthStart.toISOString());

      setMonthlyMocksUsed(mocksThisMonth || 0);
      setLoading(false);
    };

    check();
  }, [user]);

  return {
    loading,
    isPremium,
    dailyQuestionsUsed,
    dailyQuestionsLimit: FREE_DAILY_QUESTIONS,
    monthlyMocksUsed,
    monthlyMocksLimit: FREE_MONTHLY_MOCKS,
    canStartPractice: isPremium || dailyQuestionsUsed < FREE_DAILY_QUESTIONS,
    canStartMock: isPremium || monthlyMocksUsed < FREE_MONTHLY_MOCKS,
  };
}

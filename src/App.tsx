import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ExamSelection from "./pages/ExamSelection";
import SubjectSelection from "./pages/SubjectSelection";
import PracticeMode from "./pages/PracticeMode";
import CBTExam from "./pages/CBTExam";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminQuestions from "./pages/AdminQuestions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/exams" element={<ExamSelection />} />
            <Route path="/exams/:examId/subjects" element={<SubjectSelection />} />
            <Route path="/practice" element={<PracticeMode />} />
            <Route path="/mock-exam" element={<CBTExam />} />
            <Route path="/results" element={<Results />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/questions" element={<AdminQuestions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

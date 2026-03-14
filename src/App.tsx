import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import ExamSelection from "./pages/ExamSelection";
import SubjectSelection from "./pages/SubjectSelection";
import PracticeMode from "./pages/PracticeMode";
import StudyMode from "./pages/StudyMode";
import CBTExam from "./pages/CBTExam";
import MockExamSetup from "./pages/MockExamSetup";
import Results from "./pages/Results";
import Analytics from "./pages/Analytics";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Profile from "./pages/Profile";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import NotFound from "./pages/NotFound";
import TawkToChat from "@/components/TawkToChat";

// Admin pages
import AdminOverview from "./pages/admin/AdminOverview";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage";
import AdminExams from "./pages/admin/AdminExams";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSubscriptions from "./pages/admin/AdminSubscriptions";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminReports from "./pages/admin/AdminReports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPurchaseCodes from "./pages/admin/AdminPurchaseCodes";
import AdminBulkSeeder from "./pages/admin/AdminBulkSeeder";

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
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute><ExamSelection /></ProtectedRoute>} />
            <Route path="/exams/:examId/subjects" element={<ProtectedRoute><SubjectSelection /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><PracticeMode /></ProtectedRoute>} />
            <Route path="/study" element={<ProtectedRoute><StudyMode /></ProtectedRoute>} />
            <Route path="/mock-exam" element={<ProtectedRoute><CBTExam /></ProtectedRoute>} />
            <Route path="/mock-setup" element={<ProtectedRoute><MockExamSetup /></ProtectedRoute>} />
            <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/questions" element={<AdminRoute><AdminQuestionsPage /></AdminRoute>} />
            <Route path="/admin/exams" element={<AdminRoute><AdminExams /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/subscriptions" element={<AdminRoute><AdminSubscriptions /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
            <Route path="/admin/messages" element={<AdminRoute><AdminMessages /></AdminRoute>} />
            <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
            <Route path="/admin/purchase-codes" element={<AdminRoute><AdminPurchaseCodes /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <TawkToChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

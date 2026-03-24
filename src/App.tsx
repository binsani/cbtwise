import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ExamSelection = lazy(() => import("./pages/ExamSelection"));
const SubjectSelection = lazy(() => import("./pages/SubjectSelection"));
const PracticeMode = lazy(() => import("./pages/PracticeMode"));
const StudyMode = lazy(() => import("./pages/StudyMode"));
const CBTExam = lazy(() => import("./pages/CBTExam"));
const MockExamSetup = lazy(() => import("./pages/MockExamSetup"));
const Results = lazy(() => import("./pages/Results"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Pricing = lazy(() => import("./pages/Pricing"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Profile = lazy(() => import("./pages/Profile"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TawkToChat = lazy(() => import("@/components/TawkToChat"));

// Admin pages
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminQuestionsPage = lazy(() => import("./pages/admin/AdminQuestionsPage"));
const AdminExams = lazy(() => import("./pages/admin/AdminExams"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSubscriptions = lazy(() => import("./pages/admin/AdminSubscriptions"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminMessages = lazy(() => import("./pages/admin/AdminMessages"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminPurchaseCodes = lazy(() => import("./pages/admin/AdminPurchaseCodes"));
const AdminBulkSeeder = lazy(() => import("./pages/admin/AdminBulkSeeder"));

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
            <Route path="/admin/bulk-seeder" element={<AdminRoute><AdminBulkSeeder /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <TawkToChat />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

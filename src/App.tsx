import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import StudentDashboard from "@/pages/student/StudentDashboard";
import ExamsManagement from "@/pages/teacher/ExamsManagement";
import TeacherSubmissions from "@/pages/teacher/TeacherSubmissions";
import TeacherStats from "@/pages/teacher/TeacherStats";
import PlagiarismDetection from "@/pages/teacher/PlagiarismDetection";
import StudentExams from "@/pages/student/StudentExams";
import StudentResults from "@/pages/student/StudentResults";
import StudentSubmissions from "@/pages/student/StudentSubmissions";
import NotFound from "@/pages/NotFound";

// Configure QueryClient with more conservative settings to prevent excessive refetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Limit retry attempts
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
    },
  },
});

// Protected route component
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement en cours...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  console.log("App rendering");
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/exams"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <ExamsManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/submissions"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <TeacherSubmissions />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/stats"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <TeacherStats />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/plagiarism"
                  element={
                    <ProtectedRoute allowedRoles={["teacher"]}>
                      <PlagiarismDetection />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/exams"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentExams />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/results"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentResults />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/submissions"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentSubmissions />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

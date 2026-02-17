import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import InsightsPage from "@/pages/InsightsPage";
import ProjectionsPage from "@/pages/ProjectionsPage";
import ReportPage from "@/pages/ReportPage";
import StudentProfile from "@/pages/StudentProfile";
import StudentsPage from "@/pages/StudentsPage";
import StudentDetailPage from "@/pages/StudentDetailPage";
import StudentAssessments from "@/pages/StudentAssessments";
import AppLayout from "@/components/AppLayout";
import AIChatbot from "@/components/AIChatbot";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const getDefaultRoute = () => {
    switch (user?.role) {
      case "student": return "/profile";
      case "admin": return "/dashboard";
      default: return "/login";
    }
  };

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />

        {/* Admin routes */}
        <Route path="/dashboard" element={
          user?.role === "admin" ? <AdminDashboard /> : <Navigate to="/profile" replace />
        } />
        <Route path="/insights" element={
          user?.role === "admin" ? <InsightsPage /> : <Navigate to="/profile" replace />
        } />
        <Route path="/intelligence" element={
          user?.role === "admin" ? <ProjectionsPage /> : <Navigate to="/profile" replace />
        } />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/students" element={
          user?.role === "admin" ? <StudentsPage /> : <Navigate to="/profile" replace />
        } />
        <Route path="/students/:regNumber" element={
          user?.role === "admin" ? <StudentDetailPage /> : <Navigate to="/profile" replace />
        } />

        {/* Student routes */}
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/assessments" element={<StudentAssessments />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <AIChatbot />
    </AppLayout>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<AuthenticatedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

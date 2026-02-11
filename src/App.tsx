import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/AdminDashboard";
import StudentProfile from "@/pages/StudentProfile";
import BackendDashboard from "@/pages/BackendDashboard";
import AppLayout from "@/components/AppLayout";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function AuthenticatedRoutes() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const getDefaultRoute = () => {
    switch (user?.role) {
      case "student": return "/profile";
      case "admin": return "/dashboard";
      case "backend": return "/dashboard";
      default: return "/login";
    }
  };

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        {/* Admin routes */}
        <Route path="/dashboard" element={user?.role === "student" ? <Navigate to="/profile" replace /> : user?.role === "admin" ? <AdminDashboard /> : <BackendDashboard />} />
        <Route path="/students" element={<AdminDashboard />} />
        <Route path="/attendance-approvals" element={<AdminDashboard />} />
        <Route path="/placements" element={<AdminDashboard />} />
        <Route path="/analytics" element={<AdminDashboard />} />
        <Route path="/settings" element={<AdminDashboard />} />
        {/* Student routes */}
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/skills" element={<StudentProfile />} />
        <Route path="/assessments" element={<StudentProfile />} />
        <Route path="/training" element={<StudentProfile />} />
        <Route path="/my-placements" element={<StudentProfile />} />
        {/* Backend routes */}
        <Route path="/attendance-validation" element={<BackendDashboard />} />
        <Route path="/manage-assessments" element={<BackendDashboard />} />
        <Route path="/student-search" element={<BackendDashboard />} />
        <Route path="/configuration" element={<BackendDashboard />} />
        <Route path="/data-management" element={<BackendDashboard />} />
        <Route path="/audit-logs" element={<BackendDashboard />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
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

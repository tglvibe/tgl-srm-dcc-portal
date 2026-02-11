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
import StudentsPage from "@/pages/StudentsPage";
import AttendanceApprovalsPage from "@/pages/AttendanceApprovalsPage";
import AppLayout from "@/components/AppLayout";
import ComingSoonPage from "@/components/ComingSoonPage";
import NotFound from "@/pages/NotFound";
import {
  Briefcase, BarChart3, Settings, Award, BookOpen, GraduationCap,
  FileCheck, Search, Database, Shield,
} from "lucide-react";

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
        <Route path="/dashboard" element={
          user?.role === "student" ? <Navigate to="/profile" replace /> :
          user?.role === "admin" ? <AdminDashboard /> : <BackendDashboard />
        } />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="/attendance-approvals" element={<AttendanceApprovalsPage />} />
        <Route path="/placements" element={<ComingSoonPage title="Placements Management" description="Track company visits, offers, and placement drives" icon={<Briefcase className="w-8 h-8 text-primary" />} />} />
        <Route path="/analytics" element={<ComingSoonPage title="Analytics & Reports" description="Advanced analytics, trends, and exportable reports" icon={<BarChart3 className="w-8 h-8 text-primary" />} />} />
        <Route path="/settings" element={<ComingSoonPage title="Settings" description="System configuration, user management, and preferences" icon={<Settings className="w-8 h-8 text-primary" />} />} />

        {/* Student routes */}
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/skills" element={<ComingSoonPage title="My Skills" description="Manage your technical skills, certifications, and competencies" icon={<Award className="w-8 h-8 text-primary" />} />} />
        <Route path="/assessments" element={<ComingSoonPage title="My Assessments" description="View assessment schedules, results, and band progression" icon={<BookOpen className="w-8 h-8 text-primary" />} />} />
        <Route path="/training" element={<ComingSoonPage title="Training Programs" description="Bootcamps, virtual classes, workshops, and certifications" icon={<GraduationCap className="w-8 h-8 text-primary" />} />} />
        <Route path="/my-placements" element={<ComingSoonPage title="My Placements" description="Track your placement journey, offers, and applications" icon={<Briefcase className="w-8 h-8 text-primary" />} />} />

        {/* Backend routes */}
        <Route path="/attendance-validation" element={<ComingSoonPage title="Attendance Validation" description="Cross-verify attendance against session & billing records" icon={<FileCheck className="w-8 h-8 text-primary" />} />} />
        <Route path="/manage-assessments" element={<ComingSoonPage title="Assessment Management" description="Create, schedule, and manage assessment rounds" icon={<BookOpen className="w-8 h-8 text-primary" />} />} />
        <Route path="/student-search" element={<ComingSoonPage title="Student Search" description="Advanced search across all student records" icon={<Search className="w-8 h-8 text-primary" />} />} />
        <Route path="/configuration" element={<ComingSoonPage title="Configuration" description="System parameters, scoring weights, and rules engine" icon={<Settings className="w-8 h-8 text-primary" />} />} />
        <Route path="/data-management" element={<ComingSoonPage title="Data Management" description="Import, export, and bulk operations on student data" icon={<Database className="w-8 h-8 text-primary" />} />} />
        <Route path="/audit-logs" element={<ComingSoonPage title="Audit Logs" description="Complete audit trail of all system actions" icon={<Shield className="w-8 h-8 text-primary" />} />} />

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

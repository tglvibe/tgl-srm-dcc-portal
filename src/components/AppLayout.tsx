import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, LogOut, User, BookOpen,
  GraduationCap, ChevronLeft, ChevronRight, BrainCircuit,
  Menu, X,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { label: "Students", path: "/students", icon: Users },
    { label: "Projections", path: "/intelligence", icon: BrainCircuit },
  ],
  student: [
    { label: "My Profile", path: "/profile", icon: User },
    { label: "Assessments", path: "/assessments", icon: BookOpen },
  ],
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];

  return (
    <div className="flex min-h-screen w-full">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300
          ${collapsed ? "w-16" : "w-60"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
            <GraduationCap className="w-5 h-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="font-bold text-sm text-sidebar-foreground truncate">SRM IST</div>
              <div className="text-[10px] text-sidebar-muted truncate">Executive Portal</div>
            </div>
          )}
          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded hover:bg-sidebar-accent/50 md:hidden"
          >
            <X className="w-5 h-5 text-sidebar-foreground" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary font-medium"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full hidden md:flex items-center justify-center p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {!collapsed && (
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-primary">
                {user.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-sidebar-muted truncate capitalize">{user.role}</div>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors w-full ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className={`flex-1 transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-60"}`}>
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-background border-b border-border md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span className="font-bold text-sm text-foreground">SRM IST</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

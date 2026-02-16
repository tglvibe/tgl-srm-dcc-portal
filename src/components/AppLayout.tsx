import { ReactNode, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard, Users, LogOut, User, BookOpen,
  GraduationCap, ChevronLeft, ChevronRight, BrainCircuit, Menu, X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

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

function NavigationItems({ 
  items, 
  collapsed = false,
  isActive,
  onItemClick
}: { 
  items: NavItem[]
  collapsed?: boolean
  isActive: (path: string) => boolean
  onItemClick?: () => void
}) {
  return (
    <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
      {items.map((item) => {
        const active = isActive(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onItemClick}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 ${
              active
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
  );
}

function SidebarContent({ 
  user, 
  navItems,
  collapsed,
  isActive,
  onToggleCollapse,
  onLogout,
  onNavClick
}: {
  user: any
  navItems: NavItem[]
  collapsed: boolean
  isActive: (path: string) => boolean
  onToggleCollapse: () => void
  onLogout: () => void
  onNavClick?: () => void
}) {
  return (
    <>
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
      </div>

      {/* Nav */}
      <NavigationItems 
        items={navItems}
        collapsed={collapsed}
        isActive={isActive}
        onItemClick={onNavClick}
      />

      {/* User + collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        {collapsed && (
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
        
        {!collapsed && (
          <>
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-primary">
                {user.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{user.name}</div>
                <div className="text-[10px] text-sidebar-muted truncate capitalize">{user.role}</div>
              </div>
            </div>

            <button
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </>
        )}

        <button
          onClick={onLogout}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors w-full ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] || [];
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <div className="flex h-screen w-full overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between h-14 sm:h-16 border-b border-border bg-background px-3 sm:px-4 shrink-0 gap-3 sm:gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="font-bold text-sm text-foreground truncate">SRM IST</div>
            <div className="text-[10px] text-muted-foreground truncate">Portal</div>
          </div>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0 min-h-10 min-w-10 flex items-center justify-center">
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="sr-only">
              <span>Navigation Menu</span>
            </SheetHeader>
            <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
              <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border shrink-0">
                <div className="w-8 h-8 rounded-lg bg-sidebar-primary/20 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-sidebar-primary" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-sm text-sidebar-foreground truncate">SRM IST</div>
                  <div className="text-[10px] text-sidebar-muted truncate">Portal</div>
                </div>
              </div>
              <SidebarContent
                user={user}
                navItems={navItems}
                collapsed={false}
                isActive={isActive}
                onToggleCollapse={() => {}}
                onLogout={logout}
                onNavClick={() => setMobileMenuOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed md:relative inset-y-0 left-0 z-30 flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 h-screen md:h-auto ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent
          user={user}
          navItems={navItems}
          collapsed={collapsed}
          isActive={isActive}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onLogout={logout}
        />
      </aside>

      {/* Main Content */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 hidden md:block ${collapsed ? "md:ml-0" : "md:ml-0"}`}>
        <div className="p-4 sm:p-5 md:p-6 lg:p-8 max-w-[1600px] mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Main Content */}
      <main className="flex-1 overflow-y-auto md:hidden">
        <div className="p-3 sm:p-4 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

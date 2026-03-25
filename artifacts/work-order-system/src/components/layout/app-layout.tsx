import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  Users,
  LogOut,
  Menu,
  X,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useListNotifications, useListWorkOrders } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: notifications } = useListNotifications({ query: { enabled: isAuthenticated } });
  const { data: openOrders } = useListWorkOrders({ status: "open" }, { query: { enabled: isAuthenticated && user?.role === 'admin' } });

  const unreadNotifications = notifications?.filter(n => !n.is_read).length || 0;
  const openOrderCount = openOrders?.length || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfdfd]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard, show: true },
    {
      label: "Work Orders",
      href: "/work-orders",
      icon: ClipboardList,
      show: true,
      badge: user?.role === 'admin' && openOrderCount > 0 ? openOrderCount : null
    },
    {
      label: "Notifications",
      href: "/notifications",
      icon: Bell,
      show: true,
      badge: unreadNotifications > 0 ? unreadNotifications : null
    },
    {
      label: "Users",
      href: "/users",
      icon: Users,
      show: user?.role === 'admin'
    },
  ];

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen flex bg-[#fdfdfd]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 shadow-2xl lg:shadow-none",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <img src={`${import.meta.env.BASE_URL}images/logo-icon.png`} alt="Logo" className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl tracking-tight text-white leading-tight">CampusWorks</h1>
            <p className="text-sidebar-accent-foreground text-xs uppercase tracking-wider font-semibold opacity-80">Management System</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden text-white hover:bg-white/10" onClick={closeSidebar}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.filter(item => item.show).map((item) => {
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={closeSidebar} className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-inner"
                  : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-white"
              )}>
                <item.icon className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive ? "text-white" : "text-sidebar-foreground/60")} />
                {item.label}
                {item.badge !== null && item.badge !== undefined && (
                  <Badge variant="secondary" className="ml-auto bg-white text-primary hover:bg-white border-none shadow-sm h-6 min-w-6 flex items-center justify-center">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-black/10 rounded-2xl p-4 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary-foreground/20 rounded-full p-2">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-white truncate">{user?.full_name}</p>
                <p className="text-xs text-sidebar-foreground/70 capitalize truncate">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-sidebar-foreground/80 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => logout()}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 lg:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white border-b border-border/50 sticky top-0 z-30">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <div className="flex items-center gap-4 ml-auto">
            <Link href="/notifications" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted">
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-white"></span>
              )}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

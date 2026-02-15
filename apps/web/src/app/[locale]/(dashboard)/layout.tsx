"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { AuthGuard } from "@/components/auth/auth-guard";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  FileCheck,
  AlertTriangle,
  Settings,
  Menu,
  ChevronLeft,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: [] },
  { href: "/projects", label: "Projects", icon: FolderKanban, roles: ["inspector", "auditor", "admin"] },
  { href: "/attestations", label: "Attestations", icon: ClipboardCheck, roles: ["inspector", "citizen", "admin"] },
  { href: "/certificates", label: "Certificates", icon: FileCheck, roles: ["auditor", "admin"] },
  { href: "/disputes", label: "Disputes", icon: AlertTriangle, roles: ["citizen", "admin"] },
  { href: "/admin", label: "Admin", icon: Settings, roles: ["admin"] },
];

function NavContent({ collapsed, userRoles }: { collapsed: boolean; userRoles: string[] }) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => item.roles.length === 0 || item.roles.some((r) => userRoles.includes(r)),
  );

  return (
    <nav className="flex flex-col gap-1 px-2">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        // Check if current path ends with or contains this item's href
        const isActive =
          pathname.endsWith(item.href) || pathname.includes(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href as any}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarCollapsed, toggleSidebar, mobileNavOpen, toggleMobileNav } =
    useUiStore();
  const user = useAuthStore((s) => s.user);

  const initials = user?.did
    ? user.did.slice(-2).toUpperCase()
    : "TM";

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
            sidebarCollapsed ? "w-16" : "w-64",
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-sidebar-primary" />
                <span className="text-lg font-bold text-white tracking-wide">
                  TML
                </span>
              </div>
            )}
            {sidebarCollapsed && (
              <Shield className="h-6 w-6 text-sidebar-primary mx-auto" />
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* Nav */}
          <ScrollArea className="flex-1 py-4">
            <NavContent collapsed={sidebarCollapsed} userRoles={user?.roles ?? []} />
          </ScrollArea>

          <Separator className="bg-white/10" />

          {/* Bottom: user info */}
          <div className="p-3">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 rounded-lg p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-white">
                    {user?.roles?.[0]?.replace(/_/g, " ") ?? "User"}
                  </p>
                  <p className="truncate text-[10px] text-white/50">
                    {user?.did?.slice(0, 20)}...
                  </p>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
            <div className="flex items-center gap-3">
              {/* Mobile menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 bg-sidebar text-sidebar-foreground p-0 border-none">
                  <SheetHeader className="px-4 py-4">
                    <SheetTitle className="flex items-center gap-2 text-white">
                      <Shield className="h-5 w-5 text-sidebar-primary" />
                      TML
                    </SheetTitle>
                  </SheetHeader>
                  <Separator className="bg-white/10" />
                  <div className="py-4">
                    <NavContent collapsed={false} userRoles={user?.roles ?? []} />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="hidden lg:flex"
                onClick={toggleSidebar}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform",
                    sidebarCollapsed && "rotate-180",
                  )}
                />
              </Button>

              <span className="text-lg font-bold text-primary lg:hidden">
                TML
              </span>
            </div>

            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-4 lg:p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

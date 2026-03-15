"use client";

import { type ReactNode } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardCheck,
  Award,
  AlertTriangle,
  Settings,
  Menu,
  PanelLeftClose,
  PanelLeft,
  User,
} from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SkipNavigation } from "@/components/shared/skip-navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { useUiStore } from "@/store/ui-store";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/attestations", label: "Attestations", icon: ClipboardCheck },
  { href: "/certificates", label: "Certificates", icon: Award },
  { href: "/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin", label: "Admin", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3" role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-[#1e3a5f] text-white"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function DesktopSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-[68px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!sidebarCollapsed && (
          <span className="text-xl font-bold text-[#1e3a5f]">TML</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(sidebarCollapsed && "mx-auto")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-5 w-5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        {sidebarCollapsed ? (
          <nav className="flex flex-col items-center gap-1 px-2" role="navigation" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center justify-center rounded-lg p-2.5 transition-colors",
                    isActive
                      ? "bg-[#1e3a5f] text-white"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              );
            })}
          </nav>
        ) : (
          <SidebarNav />
        )}
      </div>
    </aside>
  );
}

function MobileSidebar() {
  const { mobileNavOpen, setMobileNavOpen } = useUiStore();

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
          aria-expanded={mobileNavOpen}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="text-left text-xl font-bold text-[#1e3a5f]">
            TML
          </SheetTitle>
        </SheetHeader>
        <div className="py-4">
          <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function TopBar() {
  const user = useAuthStore((s) => s.user);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <span className="text-xl font-bold text-[#1e3a5f] lg:hidden">TML</span>
      </div>

      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <Separator orientation="vertical" className="h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label="User account menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-[#1e3a5f] text-white text-sm">
                  <User className="h-4 w-4" aria-hidden="true" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">Account</p>
              {user?.did && (
                <p className="text-xs text-muted-foreground truncate">
                  {user.did}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <LogoutButton />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <SkipNavigation />
      <div className="flex h-screen overflow-hidden bg-background">
        <DesktopSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main id="main-content" className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}

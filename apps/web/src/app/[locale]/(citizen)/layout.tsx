"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, CheckSquare, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const bottomNavItems = [
  { href: "/citizen", label: "Home", icon: Home },
  { href: "/citizen/attest", label: "Attest", icon: CheckSquare },
  { href: "/citizen/profile", label: "Profile", icon: User },
];

export default function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b bg-[#1e3a5f] text-white">
        <div className="flex h-14 items-center px-4">
          <Shield className="h-6 w-6 mr-2" />
          <span className="font-bold text-lg">TML</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.endsWith(item.href) ||
              (item.href === "/citizen" && pathname.match(/\/citizen$/));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                  isActive
                    ? "text-[#1e3a5f] font-semibold"
                    : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

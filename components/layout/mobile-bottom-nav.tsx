"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, PlusCircle, MessageCircle, User, Store } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileBottomNav - Bottom tab bar for mobile viewports.
 * Visible only on < 768px screens (handled by MobileShell parent).
 * Mirrors the main navigation sections from NavSidebar.
 */
export function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/feed", label: "Home", icon: Home },
    { href: "/discover", label: "Explore", icon: Compass },
    { href: "/marketplace", label: "Shop", icon: Store },
    { href: "/messages", label: "Chat", icon: MessageCircle },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 py-1 transition-colors",
              isActive
                ? "text-royal-purple"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] font-medium truncate">{tab.label}</span>
          </Link>
        );
      })}
    </>
  );
}
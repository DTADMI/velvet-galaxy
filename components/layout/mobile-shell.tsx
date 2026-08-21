"use client";

import React, { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * MobileShell — Responsive layout shell for velvet-galaxy.
 * 
 * On mobile (< 768px): full-width, bottom tab bar, slide-out sidebar
 * On desktop (≥ 768px): sidebar visible, standard layout
 * 
 * All pages should wrap their content in MobileShell for consistent
 * mobile-first responsive behavior.
 */

interface MobileShellProps {
  children: React.ReactNode;
  /** Desktop sidebar content (hidden on mobile, replaced by hamburger drawer) */
  sidebar?: React.ReactNode;
  /** Bottom navigation items for mobile tab bar */
  bottomNav?: React.ReactNode;
  /** Top bar content (search, notifications, etc.) */
  topBar?: React.ReactNode;
}

export function MobileShell({ children, sidebar, bottomNav, topBar }: MobileShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar — collapses on mobile, full on desktop */}
      {topBar && (
        <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto flex h-14 items-center gap-4 px-4">
            {/* Mobile hamburger */}
            {sidebar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
                aria-label="Menu"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex-1">{topBar}</div>
          </div>
        </header>
      )}

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        {sidebar && (
          <aside className="hidden w-64 shrink-0 border-r border-border md:block">
            <div className="sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}

        {/* Mobile sidebar drawer */}
        {sidebar && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-background border-r border-border shadow-lg md:hidden">
              <div className="flex h-14 items-center justify-between border-b border-border px-4">
                <span className="font-semibold">Menu</span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-md p-1 hover:bg-accent"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
                {sidebar}
              </div>
            </aside>
          </>
        )}

        {/* Main content — full width on mobile, flex-1 on desktop */}
        <main className="flex-1 min-h-0">
          {/* Add bottom padding on mobile for tab bar */}
          <div className={`mx-auto w-full max-w-5xl px-4 py-6 ${bottomNav ? "pb-20 md:pb-6" : ""}`}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      {bottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background md:hidden">
          <div className="flex h-16 items-center justify-around px-4">
            {bottomNav}
          </div>
        </nav>
      )}
    </div>
  );
}

/**
 * ResponsiveGrid — auto-columns grid for card layouts.
 * 1 col on mobile, 2 on tablet, 3 on desktop.
 */
export function ResponsiveGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "grid gap-4",
      "grid-cols-1",
      "sm:grid-cols-2",
      "lg:grid-cols-3",
      className,
    )}>
      {children}
    </div>
  );
}

/**
 * ResponsiveCard — card with consistent padding that adapts to viewport.
 */
export function ResponsiveCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border border-border bg-card p-4 sm:p-6",
      className,
    )}>
      {children}
    </div>
  );
}

/**
 * useIsMobile — detect viewport < 768px.
 * Use for conditional rendering that CSS can't handle.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Users, ShoppingBag, Image, Calendar, MessageCircle,
  Search, Bell, Settings, User, Palette, Heart, Bookmark,
  Globe, Camera, Music, Store, PlusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function NavSidebar(): React.ReactElement {
  const pathname = usePathname();

  const mainNav: NavItem[] = [
    { href: "/feed", label: "Feed", icon: <Home size={18} /> },
    { href: "/discover", label: "Discover", icon: <Search size={18} /> },
    { href: "/network", label: "Network", icon: <Users size={18} /> },
    { href: "/messages", label: "Messages", icon: <MessageCircle size={18} /> },
    { href: "/notifications", label: "Notifications", icon: <Bell size={18} /> },
  ];

  const exploreNav: NavItem[] = [
    { href: "/marketplace", label: "Marketplace", icon: <Store size={18} /> },
    { href: "/gallery", label: "Gallery", icon: <Image size={18} /> },
    { href: "/events", label: "Events", icon: <Calendar size={18} /> },
    { href: "/groups", label: "Groups", icon: <Users size={18} /> },
    { href: "/artists", label: "Artists", icon: <Palette size={18} /> },
  ];

  const personalNav: NavItem[] = [
    { href: "/profile", label: "Profile", icon: <User size={18} /> },
    { href: "/bookmarks", label: "Bookmarks", icon: <Bookmark size={18} /> },
    { href: "/settings", label: "Settings", icon: <Settings size={18} /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Logo */}
      <div className="px-2 pt-2">
        <Link href="/feed" className="flex items-center gap-2">
          <span className="text-xl font-bold bg-gradient-to-r from-royal-auburn via-royal-purple to-royal-blue bg-clip-text text-transparent">
            Velvet Galaxy
          </span>
        </Link>
      </div>

      {/* Main Navigation */}
      <div>
        <NavSection items={mainNav} pathname={pathname} />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Explore */}
      <div>
        <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Explore
        </p>
        <NavSection items={exploreNav} pathname={pathname} />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Personal */}
      <div>
        <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          You
        </p>
        <NavSection items={personalNav} pathname={pathname} />
      </div>
    </div>
  );
}

function NavSection({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              isActive
                ? "bg-royal-purple/10 text-royal-purple font-medium"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-royal-purple px-1 text-[10px] font-medium text-white">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Shield, BarChart3, Activity,
    Image, FileText, Bot, HeartPulse, Settings
} from "lucide-react";

const adminLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/moderation", label: "Moderation", icon: Shield },
    { href: "/admin/manage-posts", label: "Posts", icon: FileText },
    { href: "/admin/media", label: "Media", icon: Image },
    { href: "/admin/ai", label: "AI Settings", icon: Bot },
    { href: "/admin/health", label: "Health", icon: HeartPulse },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-56 min-h-screen border-r border-royal-purple/20 bg-card/50 p-4 hidden lg:block">
            <div className="mb-6">
                <Link href="/admin" className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-royal-purple" />
                    <span className="font-bold text-sm">Admin Panel</span>
                </Link>
            </div>

            <nav className="space-y-1">
                {adminLinks.map((link) => {
                    const isActive = pathname === link.href || 
                        (link.href !== "/admin" && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                                isActive
                                    ? "bg-royal-purple/20 text-royal-purple font-medium"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                            <link.icon className="h-4 w-4" />
                            {link.label}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

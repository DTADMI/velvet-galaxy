"use client";

import {
    Bookmark,
    Calendar,
    ChevronDown,
    Compass,
    HelpCircle,
    Home,
    LogOut,
    Menu,
    MessageSquare,
    Network,
    Settings,
    Shield,
    ShoppingBag,
    User,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import Link from "next/link";
import {usePathname, useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {LanguageSelector} from "@/components/language-selector";
import {VelvetLogo} from "@/components/velvet-logo";
import {NotificationsDropdown} from "@/components/notifications-dropdown";
import {QuickUploadDropdown} from "@/components/quick-upload-dropdown";
import {SimpleSearch} from "@/components/simple-search";
import {ThemeToggle} from "@/components/theme-toggle";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {createClient} from "@/lib/supabase/client";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";

export function Navigation() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient();
            const {data: {user}} = await supabase.auth.getUser();
            if (user) {
                const {data} = await supabase.from("profiles").select("*").eq("id", user.id).single();
                setUserProfile(data);
            }
        };
        fetchProfile();
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    const navItems = [
        {href: "/feed", icon: Home, label: "Feed", color: "royal-purple"},
        {href: "/discovery", icon: Compass, label: "Discovery", color: "pink-600"},
        {href: "/messages", icon: MessageSquare, label: "Messages", color: "royal-blue"},
        {href: "/marketplace", icon: ShoppingBag, label: "Marketplace", color: "royal-green"},
    ];

    const communityRoutes = ["/groups", "/events", "/chat-rooms", "/network"];
    const isCommunityActive = communityRoutes.some((route) => pathname.startsWith(route));

    const isLinkActive = (href: string) => {
        if (href === "/feed") {
            return pathname === "/feed" || pathname === "/";
        }
        return pathname.startsWith(href);
    };

    const getActiveClasses = (isActive: boolean, color: string) => {
        if (!isActive) {
            return "hover:text-foreground";
        }

        switch (color) {
            case "royal-purple":
                return "bg-royal-purple text-white shadow-lg shadow-royal-purple/20";
            case "pink-600":
                return "bg-pink-600 text-white shadow-lg shadow-pink-600/20";
            case "royal-blue":
                return "bg-royal-blue text-white shadow-lg shadow-royal-blue/20";
            case "royal-green":
                return "bg-royal-green text-white shadow-lg shadow-royal-green/20";
            case "royal-orange":
                return "bg-royal-orange text-white shadow-lg shadow-royal-orange/20";
            case "royal-auburn":
                return "bg-royal-auburn text-white shadow-lg shadow-royal-auburn/20";
            default:
                return "bg-primary text-primary-foreground";
        }
    };

    return (
        <nav
            aria-label="Main navigation"
            className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-gradient-to-r from-card/95 via-card/98 to-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/feed" className="flex items-center gap-2" aria-label="Go to feed">
                    <VelvetLogo size="sm" showText/>
                </Link>

                <div className="hidden md:flex items-center gap-1">
                    <SimpleSearch/>
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isLinkActive(item.href);
                        return (
                            <Button
                                key={item.href}
                                variant={isActive ? "default" : "ghost"}
                                size="sm"
                                asChild
                                className={getActiveClasses(isActive, item.color)}
                            >
                                <Link href={item.href}>
                                    <Icon className="h-4 w-4 mr-2"/>
                                    {item.label}
                                </Link>
                            </Button>
                        );
                    })}

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant={isCommunityActive ? "default" : "ghost"}
                                size="sm"
                                className={`gap-1 ${isCommunityActive ? "bg-royal-auburn text-white hover:bg-royal-auburn/90" : ""}`}
                            >
                                <Users className="h-4 w-4"/>
                                Community
                                <ChevronDown className="h-3 w-3"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href="/groups" className="flex items-center gap-2 cursor-pointer">
                                    <Users className="h-4 w-4 text-royal-green"/>
                                    Groups
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/events" className="flex items-center gap-2 cursor-pointer">
                                    <Calendar className="h-4 w-4 text-royal-orange"/>
                                    Events
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/chat-rooms" className="flex items-center gap-2 cursor-pointer">
                                    <MessageSquare className="h-4 w-4 text-royal-blue"/>
                                    Chat Rooms
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/network" className="flex items-center gap-2 cursor-pointer">
                                    <Network className="h-4 w-4 text-royal-purple"/>
                                    Network Map
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-royal-purple/10"/>
                            <DropdownMenuItem asChild>
                                <Link href="/about" className="flex items-center gap-2 cursor-pointer">
                                    <HelpCircle className="h-4 w-4 text-royal-blue"/>
                                    About Velvet Galaxy
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/help" className="flex items-center gap-2 cursor-pointer">
                                    <MessageSquare className="h-4 w-4 text-royal-green"/>
                                    Contact Support
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <QuickUploadDropdown/>

                    <NotificationsDropdown/>
                    <LanguageSelector/>
                    <ThemeToggle/>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"
                                    className="gap-1 p-0 h-10 w-10 rounded-full border-2 border-royal-purple/20">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={userProfile?.avatar_url || undefined}/>
                                    <AvatarFallback
                                        className="bg-gradient-to-br from-royal-auburn to-royal-purple text-white">
                                        {userProfile?.display_name?.[0] || "?"}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-card border-royal-purple/20 shadow-xl">
                            <div className="px-4 py-3 border-b border-royal-purple/10">
                                <p className="text-sm font-bold text-gradient truncate">{userProfile?.display_name || userProfile?.username}</p>
                                <p className="text-xs text-muted-foreground truncate">@{userProfile?.username}</p>
                            </div>
                            {userProfile?.is_admin && (
                                <DropdownMenuItem asChild>
                                    <Link href="/admin"
                                          className="flex items-center gap-2 cursor-pointer text-royal-purple font-bold">
                                        <Shield className="h-4 w-4"/>
                                        Admin Dashboard
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                                <Link href="/profile" className="flex items-center gap-2 cursor-pointer py-2">
                                    <User className="h-4 w-4 text-royal-blue"/>
                                    My Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/friends" className="flex items-center gap-2 cursor-pointer py-2">
                                    <Users className="h-4 w-4 text-royal-green"/>
                                    Friends & Followers
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/bookmarks" className="flex items-center gap-2 cursor-pointer py-2">
                                    <Bookmark className="h-4 w-4 text-royal-orange"/>
                                    Bookmarks
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/events/my-events" className="flex items-center gap-2 cursor-pointer py-2">
                                    <Calendar className="h-4 w-4 text-royal-auburn"/>
                                    Upcoming Events
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-royal-purple/10"/>
                            <DropdownMenuItem asChild>
                                <Link href="/help" className="flex items-center gap-2 cursor-pointer py-2">
                                    <HelpCircle className="h-4 w-4"/>
                                    FAQ & Help
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/settings" className="flex items-center gap-2 cursor-pointer py-2">
                                    <Settings className="h-4 w-4"/>
                                    Parameters
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-royal-purple/10"/>
                            <DropdownMenuItem
                                className="flex items-center gap-2 cursor-pointer py-2 text-royal-purple font-medium">
                                <UserPlus className="h-4 w-4"/>
                                Add/Switch Account
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-royal-purple/10"/>
                            <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer py-2">
                                <LogOut className="h-4 w-4 mr-2"/>
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <Button variant="ghost" size="sm" className="md:hidden"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
                </Button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-border bg-card/98 backdrop-blur">
                    <div className="container mx-auto px-4 py-4 space-y-2">
                        <div className="pb-2">
                            <SimpleSearch/>
                        </div>
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = isLinkActive(item.href);
                            return (
                                <Button
                                    key={item.href}
                                    variant={isActive ? "default" : "ghost"}
                                    size="sm"
                                    asChild
                                    className={`w-full justify-start ${getActiveClasses(isActive, item.color)}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <Link href={item.href}>
                                        <Icon className="h-4 w-4 mr-2"/>
                                        {item.label}
                                    </Link>
                                </Button>
                            );
                        })}

                        <div className="pt-2 border-t border-border space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground px-2">Community</p>
                            <Button
                                variant={pathname.startsWith("/groups") ? "default" : "ghost"}
                                size="sm"
                                asChild
                                className={`w-full justify-start ${pathname.startsWith("/groups") ? "bg-royal-green text-white" : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/groups">
                                    <Users className="h-4 w-4 mr-2"/>
                                    Groups
                                </Link>
                            </Button>
                            <Button
                                variant={pathname.startsWith("/events") ? "default" : "ghost"}
                                size="sm"
                                asChild
                                className={`w-full justify-start ${pathname.startsWith("/events") ? "bg-royal-orange text-white" : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/events">
                                    <Calendar className="h-4 w-4 mr-2"/>
                                    Events
                                </Link>
                            </Button>
                            <Button
                                variant={pathname.startsWith("/chat-rooms") ? "default" : "ghost"}
                                size="sm"
                                asChild
                                className={`w-full justify-start ${pathname.startsWith("/chat-rooms") ? "bg-royal-blue text-white" : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/chat-rooms">
                                    <MessageSquare className="h-4 w-4 mr-2"/>
                                    Chat Rooms
                                </Link>
                            </Button>
                            <Button
                                variant={pathname.startsWith("/network") ? "default" : "ghost"}
                                size="sm"
                                asChild
                                className={`w-full justify-start ${pathname.startsWith("/network") ? "bg-royal-purple text-white" : ""}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/network">
                                    <Network className="h-4 w-4 mr-2"/>
                                    Network Map
                                </Link>
                            </Button>
                        </div>

                        <div className="pt-2 border-t border-border space-y-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="w-full justify-start"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/settings/messages">
                                    <Settings className="h-4 w-4 mr-2"/>
                                    Settings
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="w-full justify-start"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                <Link href="/help">
                                    <HelpCircle className="h-4 w-4 mr-2"/>
                                    Help
                                </Link>
                            </Button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border">
                            <span className="text-sm text-muted-foreground">Theme</span>
                            <ThemeToggle/>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                handleSignOut();
                                setIsMobileMenuOpen(false);
                            }}
                            className="w-full justify-start text-destructive hover:text-destructive"
                        >
                            <LogOut className="h-4 w-4 mr-2"/>
                            Sign Out
                        </Button>
                    </div>
                </div>
            )}
        </nav>
    );
}

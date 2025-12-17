"use client";

import {
    Bell,
    Bookmark,
    Calendar,
    Flag,
    Heart,
    HelpCircle,
    LogOut,
    Mail,
    Settings,
    Shield,
    User,
    UserPlus,
    Users,
} from "lucide-react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Switch} from "@/components/ui/switch";
import {createClient} from "@/lib/supabase/client";

interface ProfileDropdownProps {
    userProfile: {
        id: string
        username: string
        display_name: string | null
        avatar_url: string | null
    }
}

export function ProfileDropdown({userProfile}: ProfileDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [faqEnabled, setFaqEnabled] = useState(false);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full ring-2 ring-red-900/30 hover:ring-red-700/50"
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={userProfile.avatar_url || undefined}/>
                        <AvatarFallback className="bg-gradient-to-br from-red-900 to-purple-900 text-white">
                            {(userProfile.display_name || userProfile.username)[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-2">
                        <Avatar className="h-12 w-12">
                            <AvatarImage src={userProfile.avatar_url || undefined}/>
                            <AvatarFallback className="bg-gradient-to-br from-red-900 to-purple-900 text-white">
                                {(userProfile.display_name || userProfile.username)[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userProfile.display_name || userProfile.username}</p>
                            <Link href="/profile" className="text-xs text-royal-purple hover:underline">
                                View Profile
                            </Link>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator/>

                {/* Quick Actions */}
                <div className="flex items-center justify-between px-2 py-2">
                    <div className="flex items-center gap-2 text-sm">
                        <HelpCircle className="h-4 w-4"/>
                        <span>FAQ</span>
                    </div>
                    <Switch checked={faqEnabled} onCheckedChange={setFaqEnabled}/>
                </div>

                <DropdownMenuSeparator/>

                {/* Main Navigation */}
                <DropdownMenuItem asChild>
                    <Link href="/friends" className="cursor-pointer">
                        <Users className="mr-2 h-4 w-4"/>
                        Friends & Followers
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/bookmarks" className="cursor-pointer">
                        <Bookmark className="mr-2 h-4 w-4"/>
                        Saved Posts
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/bookmarks?filter=loved" className="cursor-pointer">
                        <Heart className="mr-2 h-4 w-4"/>
                        Loved Posts
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/bookmarks?filter=bookmarks" className="cursor-pointer">
                        <Flag className="mr-2 h-4 w-4"/>
                        Bookmarks
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/events?filter=upcoming" className="cursor-pointer">
                        <Calendar className="mr-2 h-4 w-4"/>
                        Upcoming Events
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator/>

                {/* Settings Section */}
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">SETTINGS</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4"/>
                        Edit Profile
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings/account" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4"/>
                        Account Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings/privacy" className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4"/>
                        Privacy Settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings/notifications" className="cursor-pointer">
                        <Bell className="mr-2 h-4 w-4"/>
                        Notification Preferences
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/invitations" className="cursor-pointer">
                        <Mail className="mr-2 h-4 w-4"/>
                        Invitations
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator/>

                {/* Account Management */}
                <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">ACCOUNT</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/auth/login?mode=add" className="cursor-pointer">
                        <UserPlus className="mr-2 h-4 w-4"/>
                        Add Another Account
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator/>

                <DropdownMenuItem onClick={handleSignOut}
                                  className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4"/>
                    Sign Out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

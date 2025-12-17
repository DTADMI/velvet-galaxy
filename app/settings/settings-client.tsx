"use client";

import {Bell, Globe, MessageSquare, Moon, Shield, Sun, User} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createClient} from "@/lib/supabase/client";

export function SettingsClient() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [language, setLanguage] = useState("en");
    const [settings, setSettings] = useState({
        message_privacy: "everyone",
        dating_messages_enabled: true,
        profile_visibility: "public",
        show_online_status: true,
        show_activity_status: true,
        allow_comments_on_posts: true,
        who_can_comment: "everyone",
    });
    const [isSaving, setIsSaving] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {data} = await supabase
            .from("profiles")
            .select(
                "message_privacy, dating_messages_enabled, profile_visibility, show_online_status, show_activity_status, allow_comments_on_posts, who_can_comment",
            )
            .eq("id", user.id)
            .single();

        if (data) {
            setSettings({
                message_privacy: data.message_privacy || "everyone",
                dating_messages_enabled: data.dating_messages_enabled ?? true,
                profile_visibility: data.profile_visibility || "public",
                show_online_status: data.show_online_status ?? true,
                show_activity_status: data.show_activity_status ?? true,
                allow_comments_on_posts: data.allow_comments_on_posts ?? true,
                who_can_comment: data.who_can_comment || "everyone",
            });
        }
    };

    const saveSettings = async () => {
        setIsSaving(true);
        const {
            data: {user},
        } = await supabase.auth.getUser();
        if (!user) {
            return;
        }

        const {error} = await supabase.from("profiles").update(settings).eq("id", user.id);

        if (error) {
            alert("Failed to save settings. Please try again.");
        } else {
            alert("Settings saved successfully!");
        }
        setIsSaving(false);
    };

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/auth/login");
    };

    return (
        <Tabs defaultValue="privacy" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 bg-background/50">
                <TabsTrigger value="privacy">
                    <Shield className="h-4 w-4 mr-2"/>
                    <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
                <TabsTrigger value="comments">
                    <MessageSquare className="h-4 w-4 mr-2"/>
                    <span className="hidden sm:inline">Comments</span>
                </TabsTrigger>
                <TabsTrigger value="appearance">
                    <Sun className="h-4 w-4 mr-2"/>
                    <span className="hidden sm:inline">Appearance</span>
                </TabsTrigger>
                <TabsTrigger value="notifications">
                    <Bell className="h-4 w-4 mr-2"/>
                    <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="account">
                    <User className="h-4 w-4 mr-2"/>
                    <span className="hidden sm:inline">Account</span>
                </TabsTrigger>
            </TabsList>

            <TabsContent value="privacy">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-gradient">Privacy & Security</CardTitle>
                        <CardDescription>Control who can see your profile and interact with you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-semibold mb-2 block">Profile Visibility</Label>
                                <Select
                                    value={settings.profile_visibility}
                                    onValueChange={(value) => setSettings({...settings, profile_visibility: value})}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public - Anyone can view</SelectItem>
                                        <SelectItem value="followers">Followers Only</SelectItem>
                                        <SelectItem value="friends">Friends Only</SelectItem>
                                        <SelectItem value="private">Private - Only Me</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-base font-semibold mb-2 block">Who Can Message You</Label>
                                <Select
                                    value={settings.message_privacy}
                                    onValueChange={(value) => setSettings({...settings, message_privacy: value})}
                                >
                                    <SelectTrigger className="bg-background">
                                        <SelectValue/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="everyone">Everyone</SelectItem>
                                        <SelectItem value="followers">Followers Only</SelectItem>
                                        <SelectItem value="friends">Friends Only</SelectItem>
                                        <SelectItem value="nobody">Nobody</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-medium">Allow Dating Messages</p>
                                    <p className="text-sm text-muted-foreground">Let others send you dating-specific
                                        messages</p>
                                </div>
                                <Switch
                                    checked={settings.dating_messages_enabled}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        dating_messages_enabled: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-medium">Show Online Status</p>
                                    <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                                </div>
                                <Switch
                                    checked={settings.show_online_status}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        show_online_status: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-medium">Show Activity Status</p>
                                    <p className="text-sm text-muted-foreground">Display your recent activity to
                                        others</p>
                                </div>
                                <Switch
                                    checked={settings.show_activity_status}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        show_activity_status: checked
                                    })}
                                />
                            </div>
                        </div>

                        <Button
                            onClick={saveSettings}
                            disabled={isSaving}
                            className="w-full bg-gradient-to-r from-royal-purple to-royal-blue"
                        >
                            {isSaving ? "Saving..." : "Save Privacy Settings"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="comments">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-gradient">Comment Settings</CardTitle>
                        <CardDescription>Control who can comment on your posts</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-medium">Allow Comments on Posts</p>
                                    <p className="text-sm text-muted-foreground">Enable or disable comments on all your
                                        posts</p>
                                </div>
                                <Switch
                                    checked={settings.allow_comments_on_posts}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        allow_comments_on_posts: checked
                                    })}
                                />
                            </div>

                            {settings.allow_comments_on_posts && (
                                <div>
                                    <Label className="text-base font-semibold mb-2 block">Who Can Comment</Label>
                                    <Select
                                        value={settings.who_can_comment}
                                        onValueChange={(value) => setSettings({...settings, who_can_comment: value})}
                                    >
                                        <SelectTrigger className="bg-background">
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="everyone">Everyone</SelectItem>
                                            <SelectItem value="followers">Followers Only</SelectItem>
                                            <SelectItem value="friends">Friends Only</SelectItem>
                                            <SelectItem value="nobody">Nobody</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <Button
                            onClick={saveSettings}
                            disabled={isSaving}
                            className="w-full bg-gradient-to-r from-royal-purple to-royal-blue"
                        >
                            {isSaving ? "Saving..." : "Save Comment Settings"}
                        </Button>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="appearance">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-gradient">Appearance Settings</CardTitle>
                        <CardDescription>Customize how the app looks</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <Label className="text-base font-semibold mb-4 block">Theme</Label>
                                <div className="flex gap-4">
                                    <Button
                                        variant={theme === "light" ? "default" : "outline"}
                                        onClick={() => {
                                            setTheme("light");
                                            document.documentElement.classList.remove("dark");
                                        }}
                                        className={
                                            theme === "light" ? "bg-gradient-to-r from-royal-orange to-amber-600" : "border-royal-purple/20"
                                        }
                                    >
                                        <Sun className="h-4 w-4 mr-2"/>
                                        Light Mode
                                    </Button>
                                    <Button
                                        variant={theme === "dark" ? "default" : "outline"}
                                        onClick={() => {
                                            setTheme("dark");
                                            document.documentElement.classList.add("dark");
                                        }}
                                        className={
                                            theme === "dark" ? "bg-gradient-to-r from-royal-purple to-royal-blue" : "border-royal-purple/20"
                                        }
                                    >
                                        <Moon className="h-4 w-4 mr-2"/>
                                        Dark Mode
                                    </Button>
                                </div>
                            </div>

                            <div>
                                <Label className="text-base font-semibold mb-4 block">Language</Label>
                                <div className="flex items-center gap-3">
                                    <Globe className="h-5 w-5 text-muted-foreground"/>
                                    <select
                                        value={language}
                                        onChange={(e) => setLanguage(e.target.value)}
                                        className="flex-1 rounded-md border border-input bg-background px-3 py-2"
                                    >
                                        <option value="en">English</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                        <option value="de">Deutsch</option>
                                        <option value="pt">Português</option>
                                        <option value="it">Italiano</option>
                                        <option value="ja">日本語</option>
                                        <option value="zh">中文</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="notifications">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-gradient">Notification Preferences</CardTitle>
                        <CardDescription>Choose what notifications you want to receive</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            {label: "New followers", description: "Get notified when someone follows you"},
                            {label: "Messages", description: "Get notified about new messages"},
                            {label: "Group invites", description: "Get notified when invited to groups"},
                            {label: "Event invites", description: "Get notified about event invitations"},
                            {label: "Post interactions", description: "Get notified about likes and comments"},
                            {label: "Friend requests", description: "Get notified about new friend requests"},
                        ].map((item) => (
                            <div key={item.label}
                                 className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                                <div>
                                    <p className="font-medium">{item.label}</p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <Switch defaultChecked/>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="account">
                <Card className="border-royal-purple/20 bg-card/50">
                    <CardHeader>
                        <CardTitle className="text-gradient">Account Management</CardTitle>
                        <CardDescription>Manage your account settings and data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-4">
                            <Button variant="outline"
                                    className="w-full justify-start border-royal-purple/20 bg-transparent">
                                Change Password
                            </Button>
                            <Button variant="outline"
                                    className="w-full justify-start border-royal-purple/20 bg-transparent">
                                Change Email
                            </Button>
                            <Button variant="outline"
                                    className="w-full justify-start border-royal-purple/20 bg-transparent">
                                Download My Data
                            </Button>
                            <Button
                                onClick={handleSignOut}
                                variant="outline"
                                className="w-full justify-start border-royal-blue/20 bg-transparent"
                            >
                                Sign Out
                            </Button>
                            <Button variant="destructive" className="w-full justify-start">
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    );
}

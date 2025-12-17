"use client";

import {ArrowLeft, Save} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Label} from "@/components/ui/label";
import {Switch} from "@/components/ui/switch";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {createBrowserClient} from "@/lib/supabase/client";

interface MessageSettingsClientProps {
    profile: {
        id: string
        username: string
        dating_messages_enabled: boolean | null
        allow_group_messages: boolean | null
        allow_promotional_messages: boolean | null
        allow_organization_messages: boolean | null
        message_privacy: string | null
    }
}

export function MessageSettingsClient({profile}: MessageSettingsClientProps) {
    const [settings, setSettings] = useState({
        dating_messages_enabled: profile.dating_messages_enabled ?? true,
        allow_group_messages: profile.allow_group_messages ?? true,
        allow_promotional_messages: profile.allow_promotional_messages ?? false,
        allow_organization_messages: profile.allow_organization_messages ?? true,
        message_privacy: profile.message_privacy || "everyone",
    });
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();
    const supabase = createBrowserClient();

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            const {error} = await supabase
                .from("profiles")
                .update({
                    dating_messages_enabled: settings.dating_messages_enabled,
                    allow_group_messages: settings.allow_group_messages,
                    allow_promotional_messages: settings.allow_promotional_messages,
                    allow_organization_messages: settings.allow_organization_messages,
                    message_privacy: settings.message_privacy,
                })
                .eq("id", profile.id);

            if (error) {
                throw error;
            }

            alert("Settings saved successfully!");
        } catch (error: any) {
            alert("Failed to save settings: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl p-6">
            <div className="flex items-center gap-4 mb-6">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5"/>
                </Button>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-royal-purple to-royal-blue bg-clip-text text-transparent">
                    Message Settings
                </h1>
            </div>

            <Tabs defaultValue="privacy" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 bg-card border border-royal-purple/20">
                    <TabsTrigger value="privacy">Privacy</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="privacy" className="space-y-4">
                    <Card className="p-6 border-royal-purple/20">
                        <h2 className="text-xl font-semibold mb-4">Who Can Message You</h2>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="message-privacy" className="text-base">
                                    Message Privacy
                                </Label>
                                <select
                                    id="message-privacy"
                                    value={settings.message_privacy}
                                    onChange={(e) => setSettings({...settings, message_privacy: e.target.value})}
                                    className="w-full mt-2 rounded-md border border-input bg-background px-3 py-2"
                                >
                                    <option value="everyone">Everyone</option>
                                    <option value="friends">Friends Only</option>
                                    <option value="followers">Followers Only</option>
                                    <option value="mutual">Mutual Friends Only</option>
                                    <option value="none">No One</option>
                                </select>
                                <p className="text-sm text-muted-foreground mt-2">Control who can send you direct
                                    messages</p>
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-4">
                    <Card className="p-6 border-royal-purple/20">
                        <h2 className="text-xl font-semibold mb-4">Message Type Preferences</h2>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="dating-messages" className="text-base">
                                        Dating Messages
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Allow users to send you dating-related
                                        messages</p>
                                </div>
                                <Switch
                                    id="dating-messages"
                                    checked={settings.dating_messages_enabled}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        dating_messages_enabled: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="group-messages" className="text-base">
                                        Group Messages
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Allow groups you're a member of to send
                                        you messages</p>
                                </div>
                                <Switch
                                    id="group-messages"
                                    checked={settings.allow_group_messages}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        allow_group_messages: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="promotional-messages" className="text-base">
                                        Promotional Messages
                                    </Label>
                                    <p className="text-sm text-muted-foreground">Allow promotional and marketing
                                        messages</p>
                                </div>
                                <Switch
                                    id="promotional-messages"
                                    checked={settings.allow_promotional_messages}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        allow_promotional_messages: checked
                                    })}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="organization-messages" className="text-base">
                                        Organization Messages
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Allow messages from organizations and verified accounts
                                    </p>
                                </div>
                                <Switch
                                    id="organization-messages"
                                    checked={settings.allow_organization_messages}
                                    onCheckedChange={(checked) => setSettings({
                                        ...settings,
                                        allow_organization_messages: checked
                                    })}
                                />
                            </div>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end mt-6">
                <Button onClick={saveSettings} disabled={isSaving}
                        className="bg-gradient-to-r from-royal-purple to-royal-blue">
                    <Save className="h-4 w-4 mr-2"/>
                    {isSaving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}

"use client";

import {CheckCircle, Star, Users, X} from "lucide-react";
import {useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createBrowserClient} from "@/lib/supabase/client";

interface EventRSVPCardProps {
    eventId: string
    userId: string
    initialResponse?: string | null
    goingCount: number
    interestedCount: number
    onResponseChange?: () => void
}

export function EventRSVPCard({
                                  eventId,
                                  userId,
                                  initialResponse,
                                  goingCount,
                                  interestedCount,
                                  onResponseChange,
                              }: EventRSVPCardProps) {
    const [userResponse, setUserResponse] = useState<string | null>(initialResponse || null);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createBrowserClient();

    const handleResponse = async (response: "going" | "interested" | "not_going") => {
        setIsLoading(true);

        try {
            const {data: existing} = await supabase
                .from("event_responses")
                .select("id")
                .eq("event_id", eventId)
                .eq("user_id", userId)
                .single();

            if (existing) {
                if (response === "not_going") {
                    await supabase.from("event_responses").delete().eq("id", existing.id);
                    setUserResponse(null);
                } else {
                    await supabase.from("event_responses").update({response}).eq("id", existing.id);
                    setUserResponse(response);
                }
            } else if (response !== "not_going") {
                await supabase.from("event_responses").insert({event_id: eventId, user_id: userId, response});
                setUserResponse(response);
            }

            onResponseChange?.();
        } catch (error) {
            console.error("[v0] Error updating RSVP:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="border-royal-orange/20 bg-card/50 backdrop-blur-sm sticky top-24">
            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="bg-royal-green/20">
                            <CheckCircle className="h-3 w-3 mr-1"/>
                            {goingCount} going
                        </Badge>
                        <Badge variant="secondary" className="bg-royal-purple/20">
                            <Star className="h-3 w-3 mr-1"/>
                            {interestedCount} interested
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4"/>
                        <span>{goingCount + interestedCount} total responses</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <Button
                        onClick={() => handleResponse("going")}
                        disabled={isLoading}
                        className={
                            userResponse === "going"
                                ? "w-full bg-gradient-to-r from-royal-green to-emerald-600 hover:opacity-90"
                                : "w-full bg-card border-2 border-royal-green/40 hover:bg-royal-green/10 text-foreground"
                        }
                    >
                        <CheckCircle className="h-4 w-4 mr-2"/>
                        {userResponse === "going" ? "You're Going!" : "I'm Going"}
                    </Button>

                    <Button
                        onClick={() => handleResponse("interested")}
                        disabled={isLoading}
                        className={
                            userResponse === "interested"
                                ? "w-full bg-gradient-to-r from-royal-purple to-purple-600 hover:opacity-90"
                                : "w-full bg-card border-2 border-royal-purple/40 hover:bg-royal-purple/10 text-foreground"
                        }
                    >
                        <Star className="h-4 w-4 mr-2"/>
                        {userResponse === "interested" ? "You're Interested" : "Interested"}
                    </Button>

                    {userResponse && (
                        <Button
                            onClick={() => handleResponse("not_going")}
                            disabled={isLoading}
                            variant="ghost"
                            className="w-full text-muted-foreground hover:text-destructive"
                        >
                            <X className="h-4 w-4 mr-2"/>
                            Remove Response
                        </Button>
                    )}
                </div>

                {userResponse && (
                    <div className="pt-4 border-t border-royal-orange/20">
                        <p className="text-sm text-center text-muted-foreground">
                            {userResponse === "going"
                                ? "You'll receive updates about this event"
                                : "We'll remind you closer to the date"}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

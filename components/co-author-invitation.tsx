"use client";

import React, {useCallback, useEffect, useState} from "react";
import {Check, UserPlus, X} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {createClient} from "@/lib/supabase/client";

interface CoAuthorInvitationProps {
    postId: string;
    currentUserId: string;
    onStatusChange?: () => void;
}

export function CoAuthorInvitation({postId, currentUserId, onStatusChange}: CoAuthorInvitationProps) {
    const [invitation, setInvitation] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    const loadInvitation = useCallback(async () => {
        setIsLoading(true);
        const {data, error} = await supabase
            .from("post_authors")
            .select("*")
            .eq("post_id", postId)
            .eq("user_id", currentUserId)
            .single();

        if (data) {
            setInvitation(data);
        }
        setIsLoading(false);
    }, [postId, currentUserId]);

    useEffect(() => {
        loadInvitation();
    }, [loadInvitation]);

    const updateStatus = async (status: 'accepted' | 'declined') => {
        const {error} = await supabase
            .from("post_authors")
            .update({status})
            .eq("post_id", postId)
            .eq("user_id", currentUserId);

        if (!error) {
            setInvitation({...invitation, status});
            if (onStatusChange) onStatusChange();
        }
    };

    if (isLoading || !invitation || invitation.status !== 'pending') return null;

    return (
        <Card className="border-royal-purple/30 bg-royal-purple/10 mb-6 overflow-hidden">
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-royal-purple/20 flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-royal-purple"/>
                    </div>
                    <div>
                        <p className="text-sm font-bold">Co-authorship Invitation</p>
                        <p className="text-xs text-muted-foreground">You've been invited to be a co-author of this
                            post.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => updateStatus('accepted')}
                        className="bg-royal-purple hover:bg-royal-purple/90"
                    >
                        <Check className="h-4 w-4 mr-2"/>
                        Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => updateStatus('declined')}
                        className="text-muted-foreground"
                    >
                        <X className="h-4 w-4 mr-2"/>
                        Decline
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

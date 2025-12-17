"use client";

import {Heart, MessageSquare, Users} from "lucide-react";
import {useRouter} from "next/navigation";
import {useState} from "react";

import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {createClient} from "@/lib/supabase/client";

interface SendMessageButtonProps {
    recipientId: string
    recipientName: string
    recipientPrivacy?: {
        message_privacy: string
        dating_messages_enabled: boolean
    }
}

export function SendMessageButton({recipientId, recipientName, recipientPrivacy}: SendMessageButtonProps) {
    const [open, setOpen] = useState(false);
    const [messageType, setMessageType] = useState<"normal" | "dating">("normal");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const canSendMessage = () => {
        if (!recipientPrivacy) {
            return true;
        }

        const {message_privacy, dating_messages_enabled} = recipientPrivacy;

        // Check if dating messages are disabled
        if (messageType === "dating" && !dating_messages_enabled) {
            return false;
        }

        // Check message privacy settings
        if (message_privacy === "nobody") {
            return false;
        }

        return true;
    };

    const handleSend = async () => {
        if (!message.trim() || !canSendMessage()) {
            return;
        }

        setIsLoading(true);

        try {
            const {
                data: {user},
            } = await supabase.auth.getUser();
            if (!user) {
                return;
            }

            const {data: userConversations} = await supabase
                .from("conversation_participants")
                .select("conversation_id")
                .eq("user_id", user.id);

            let conversationId: string | null = null;

            if (userConversations && userConversations.length > 0) {
                // Check each conversation to see if recipient is in it
                for (const conv of userConversations) {
                    const {data: recipientInConv} = await supabase
                        .from("conversation_participants")
                        .select("conversation_id")
                        .eq("conversation_id", conv.conversation_id)
                        .eq("user_id", recipientId)
                        .maybeSingle();

                    if (recipientInConv) {
                        conversationId = conv.conversation_id;
                        break;
                    }
                }
            }

            if (!conversationId) {
                const {data: newConv, error: convError} = await supabase
                    .from("conversations")
                    .insert({
                        type: "direct",
                        message_type: messageType,
                    })
                    .select()
                    .single();

                if (convError) {
                    console.error("[v0] Conversation creation error:", convError);
                    throw new Error(`Failed to create conversation: ${convError.message}`);
                }

                if (!newConv) {
                    throw new Error("Failed to create conversation: No data returned");
                }

                conversationId = newConv.id;

                // Add participants
                const {error: participantsError} = await supabase.from("conversation_participants").insert([
                    {conversation_id: conversationId, user_id: user.id},
                    {conversation_id: conversationId, user_id: recipientId},
                ]);

                if (participantsError) {
                    console.error("[v0] Participants error:", participantsError);
                    throw participantsError;
                }
            }

            // Send message
            await supabase.from("messages").insert({
                conversation_id: conversationId,
                sender_id: user.id,
                content: message,
            });

            setOpen(false);
            setMessage("");
            router.push(`/messages/${conversationId}`);
        } catch (error) {
            console.error("[v0] Error sending message:", error);
            alert(`Failed to send message. ${error instanceof Error ? error.message : "Please try again."}`);
        } finally {
            setIsLoading(false);
        }
    };

    const getMessageTypeIcon = (type: string) => {
        switch (type) {
            case "dating":
                return <Heart className="h-4 w-4"/>;
            case "group":
                return <Users className="h-4 w-4"/>;
            default:
                return <MessageSquare className="h-4 w-4"/>;
        }
    };

    const isDisabled = !canSendMessage();

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-royal-purple/20 bg-transparent">
                    <MessageSquare className="h-4 w-4 mr-2"/>
                    Send Message
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-royal-purple/20">
                <DialogHeader>
                    <DialogTitle>Send Message to {recipientName}</DialogTitle>
                    <DialogDescription>
                        {isDisabled && messageType === "dating" && !recipientPrivacy?.dating_messages_enabled
                            ? "This user has disabled dating messages"
                            : isDisabled && recipientPrivacy?.message_privacy === "nobody"
                                ? "This user has disabled all messages"
                                : "Choose a message type and write your message"}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <Label>Message Type</Label>
                        <Select value={messageType} onValueChange={(v: any) => setMessageType(v)}>
                            <SelectTrigger className="mt-2">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="normal">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4"/>
                                        Normal Message
                                    </div>
                                </SelectItem>
                                <SelectItem value="dating" disabled={!recipientPrivacy?.dating_messages_enabled}>
                                    <div className="flex items-center gap-2">
                                        <Heart className="h-4 w-4"/>
                                        Dating Message
                                        {!recipientPrivacy?.dating_messages_enabled && " (Disabled)"}
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Message</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type your message..."
                            className="mt-2"
                            rows={5}
                            disabled={isDisabled}
                        />
                    </div>
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !message.trim() || isDisabled}
                        className="w-full bg-gradient-to-r from-royal-purple to-royal-blue"
                    >
                        {getMessageTypeIcon(messageType)}
                        <span className="ml-2">Send {messageType === "dating" ? "Dating" : ""} Message</span>
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

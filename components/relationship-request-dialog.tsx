"use client";

import {Heart, Send} from "lucide-react";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {createBrowserClient} from "@/lib/supabase/client";
import {toast} from "sonner";

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
}

interface RelationshipRequestDialogProps {
    recipientId: string;
    recipientName: string;
    currentUserId: string;
}

export function RelationshipRequestDialog({
                                              recipientId,
                                              recipientName,
                                              currentUserId
                                          }: RelationshipRequestDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customTypes, setCustomTypes] = useState<CustomRelationshipType[]>([]);
    const [useCustomType, setUseCustomType] = useState(false);
    const [selectedCustomType, setSelectedCustomType] = useState<string>("");
    const [selectedDefaultType, setSelectedDefaultType] = useState<string>("friend");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createBrowserClient();

    const defaultTypes = [
        {value: "friend", label: "Friend"},
        {value: "partner", label: "Partner"},
        {value: "family", label: "Family"},
        {value: "colleague", label: "Colleague"},
        {value: "acquaintance", label: "Acquaintance"},
        {value: "other", label: "Other"}
    ];

    useEffect(() => {
        if (isOpen) {
            loadCustomTypes();
        }
    }, [isOpen]);

    async function loadCustomTypes() {
        const {data, error} = await supabase
            .from("custom_relationship_types")
            .select("id, label, node_color, edge_color")
            .eq("user_id", currentUserId)
            .order("label");

        if (!error && data) {
            setCustomTypes(data);
        }
    }

    async function handleSubmit() {
        setIsLoading(true);

        try {
            const relationshipData: any = {
                initiator_id: currentUserId,
                recipient_id: recipientId,
                status: "pending",
                message: message.trim() || null
            };

            if (useCustomType && selectedCustomType) {
                relationshipData.relationship_type_id = selectedCustomType;
            } else {
                relationshipData.default_type = selectedDefaultType;
            }

            const {error} = await supabase
                .from("user_relationships")
                .insert(relationshipData);

            if (error) {
                if (error.code === "23505") {
                    toast.error("A relationship request already exists with this user");
                } else {
                    throw error;
                }
                return;
            }

            toast.success(`Relationship request sent to ${recipientName}`);
            setIsOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error sending relationship request:", error);
            toast.error("Failed to send relationship request");
        } finally {
            setIsLoading(false);
        }
    }

    function resetForm() {
        setUseCustomType(false);
        setSelectedCustomType("");
        setSelectedDefaultType("friend");
        setMessage("");
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-royal-purple">
                    <Heart className="h-4 w-4 mr-2"/>
                    Define Relationship
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Define Relationship with {recipientName}</DialogTitle>
                    <DialogDescription>
                        Choose a relationship type and send a request. They'll be able to accept or decline.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-3">
                        <Label>Relationship Type</Label>
                        <RadioGroup
                            value={useCustomType ? "custom" : "default"}
                            onValueChange={(value) => setUseCustomType(value === "custom")}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="default" id="default"/>
                                <Label htmlFor="default" className="cursor-pointer">Standard Types</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom"/>
                                <Label htmlFor="custom" className="cursor-pointer">Custom Type</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {!useCustomType ? (
                        <div className="space-y-2">
                            <Label htmlFor="defaultType">Select Type</Label>
                            <Select value={selectedDefaultType} onValueChange={setSelectedDefaultType}>
                                <SelectTrigger id="defaultType">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {defaultTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="customType">Select Custom Type</Label>
                            {customTypes.length > 0 ? (
                                <Select value={selectedCustomType} onValueChange={setSelectedCustomType}>
                                    <SelectTrigger id="customType">
                                        <SelectValue placeholder="Choose a custom type"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customTypes.map((type) => (
                                            <SelectItem key={type.id} value={type.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-4 w-4 rounded-full border"
                                                        style={{
                                                            backgroundColor: type.node_color,
                                                            borderColor: type.edge_color
                                                        }}
                                                    />
                                                    {type.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No custom types yet. Create one in your settings first.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="message">Message (Optional)</Label>
                        <Textarea
                            id="message"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add a personal message to your request..."
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading || (useCustomType && !selectedCustomType)}
                        className="bg-gradient-to-r from-royal-purple to-royal-blue"
                    >
                        <Send className="h-4 w-4 mr-2"/>
                        {isLoading ? "Sending..." : "Send Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

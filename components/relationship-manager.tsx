"use client";

import {Check, Heart, Sparkles, Star, UserPlus, Users, X} from "lucide-react";
import {useEffect, useState} from "react";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {createBrowserClient} from "@/lib/supabase/client";

interface RelationshipManagerProps {
    targetUserId: string
    currentUserId: string
}

const RELATIONSHIP_TYPES = [
    {value: "friend", label: "Friend", icon: Users, color: "royal-blue"},
    {value: "partner", label: "Partner", icon: Heart, color: "royal-auburn"},
    {value: "dom", label: "Dom", icon: Star, color: "royal-purple"},
    {value: "sub", label: "Sub", icon: Star, color: "royal-blue"},
    {value: "master", label: "Master", icon: Star, color: "royal-purple"},
    {value: "slave", label: "Slave", icon: Star, color: "royal-blue"},
    {value: "crush", label: "Crush", icon: Sparkles, color: "royal-purple"},
    {value: "admirer", label: "Admirer", icon: Star, color: "royal-orange"},
    {value: "mentor", label: "Mentor", icon: Users, color: "royal-green"},
    {value: "mentee", label: "Mentee", icon: Users, color: "royal-green"},
    {value: "play_partner", label: "Play Partner", icon: Heart, color: "royal-purple"},
    {value: "romantic_interest", label: "Romantic Interest", icon: Heart, color: "royal-auburn"},
    {value: "ex", label: "Ex", icon: Heart, color: "gray"},
    {value: "family", label: "Family", icon: Users, color: "royal-blue"},
    {value: "other", label: "Other", icon: Users, color: "gray"},
];

export function RelationshipManager({targetUserId, currentUserId}: RelationshipManagerProps) {
    const [relationships, setRelationships] = useState<any[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState("");
    const [customLabel, setCustomLabel] = useState("");
    const supabase = createBrowserClient();

    useEffect(() => {
        loadRelationships();
        loadIncomingRequests();
    }, []);

    const loadRelationships = async () => {
        const {data} = await supabase
            .from("relationships")
            .select("*")
            .eq("user_id", currentUserId)
            .eq("related_user_id", targetUserId);

        if (data) {
            setRelationships(data);
        }
    };

    const loadIncomingRequests = async () => {
        const {data} = await supabase
            .from("relationships")
            .select("*, profiles:user_id(display_name, username)")
            .eq("related_user_id", currentUserId)
            .eq("user_id", targetUserId)
            .eq("status", "pending");

        if (data) {
            setIncomingRequests(data);
        }
    };

    const acceptRelationship = async (relationshipId: string) => {
        await supabase.from("relationships").update({status: "accepted"}).eq("id", relationshipId);
        loadRelationships();
        loadIncomingRequests();
    };

    const addRelationship = async () => {
        if (!selectedType) {
            return;
        }

        await supabase.from("relationships").insert({
            user_id: currentUserId,
            related_user_id: targetUserId,
            relationship_type: selectedType,
            custom_label: customLabel || null,
            status: "pending",
        });

        setSelectedType("");
        setCustomLabel("");
        setIsOpen(false);
        loadRelationships();
    };

    const removeRelationship = async (relationshipId: string) => {
        await supabase.from("relationships").delete().eq("id", relationshipId);
        loadRelationships();
    };

    const getRelationshipIcon = (type: string) => {
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === type);
        return rel ? rel.icon : Users;
    };

    const getRelationshipColor = (type: string) => {
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === type);
        return rel ? rel.color : "gray";
    };

    const getRelationshipLabel = (relationship: any) => {
        if (relationship.custom_label) {
            return relationship.custom_label;
        }
        const rel = RELATIONSHIP_TYPES.find((r) => r.value === relationship.relationship_type);
        return rel ? rel.label : relationship.relationship_type;
    };

    return (
        <div className="space-y-2">
            {incomingRequests.length > 0 && (
                <div className="space-y-2 mb-4 p-3 bg-royal-purple/10 rounded-lg border border-royal-purple/20">
                    <p className="text-xs font-semibold text-royal-purple uppercase tracking-wider">Pending Requests</p>
                    {incomingRequests.map((req) => (
                        <div key={req.id} className="flex items-center justify-between">
                            <span className="text-sm">
                                <strong>{req.profiles?.display_name || req.profiles?.username}</strong> wants to be your <strong>{req.custom_label || req.relationship_type}</strong>
                            </span>
                            <div className="flex gap-1">
                                <Button size="sm" variant="outline"
                                        className="h-7 px-2 bg-royal-green text-white border-none hover:bg-royal-green/90"
                                        onClick={() => acceptRelationship(req.id)}>
                                    <Check className="h-3.5 w-3.5"/>
                                </Button>
                                <Button size="sm" variant="outline"
                                        className="h-7 px-2 bg-destructive text-white border-none hover:bg-destructive/90"
                                        onClick={() => removeRelationship(req.id)}>
                                    <X className="h-3.5 w-3.5"/>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-wrap gap-2">
                {relationships.map((rel) => {
                    const Icon = getRelationshipIcon(rel.relationship_type);
                    const color = getRelationshipColor(rel.relationship_type);
                    return (
                        <Badge key={rel.id} variant="secondary"
                               className={`bg-${color}/20 flex items-center gap-1 pr-1`}>
                            <Icon className="h-3 w-3"/>
                            {getRelationshipLabel(rel)}
                            {rel.status === "pending" && <span className="text-xs opacity-60">(pending)</span>}
                            <button
                                onClick={() => removeRelationship(rel.id)}
                                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3"/>
                            </button>
                        </Badge>
                    );
                })}
            </div>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                        <UserPlus className="h-4 w-4"/>
                        Add Relationship
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Relationship</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Relationship Type</Label>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                                {RELATIONSHIP_TYPES.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelectedType(type.value)}
                                            className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                                                selectedType === type.value
                                                    ? `border-${type.color} bg-${type.color}/10`
                                                    : "border-border hover:border-${type.color}/50"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4"/>
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {selectedType === "other" && (
                            <div>
                                <Label>Custom Label</Label>
                                <Input
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value)}
                                    placeholder="Enter custom relationship label"
                                    className="mt-2"
                                />
                            </div>
                        )}

                        <Button onClick={addRelationship} disabled={!selectedType} className="w-full">
                            <Check className="h-4 w-4 mr-2"/>
                            Add Relationship
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

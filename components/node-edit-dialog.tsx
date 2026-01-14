"use client";

import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {useToast} from "@/hooks/use-toast";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {PlusIcon, Trash2Icon} from "lucide-react";
import {RelationshipTypeSelector} from "@/components/relationship-type-selector";

interface NetworkNode {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string | null;
    type: "user" | "group" | "external";
    isCustom?: boolean;
}

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
}

interface ExternalRelationship {
    id: string;
    relationship_type_id: string | null;
    default_type: string | null;
    custom_relationship_type?: CustomRelationshipType;
}

interface NodeEditDialogProps {
    node: NetworkNode | null;
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function NodeEditDialog({node, userId, isOpen, onClose, onUpdate}: NodeEditDialogProps) {
    const [nodeColor, setNodeColor] = useState("#6b7280");
    const [customTypes, setCustomTypes] = useState<CustomRelationshipType[]>([]);
    const [existingRelationships, setExistingRelationships] = useState<ExternalRelationship[]>([]);
    const [newRelationship, setNewRelationship] = useState({
        relationship_type_id: "",
        default_type: "acquaintance",
        use_custom_type: false,
        notes: "",
    });

    const {toast} = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && node) {
            loadNodeData();
        }
    }, [isOpen, node]);

    async function loadNodeData() {
        if (!node) return;

        // Load custom relationship types
        const {data: types} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("user_id", userId)
            .order("display_order");

        setCustomTypes(types || []);

        // If it's an external node, load its color and relationships
        if (node.type === "external") {
            const externalId = node.id.replace("external-", "");

            // Load external profile color
            const {data: profile} = await supabase
                .from("external_profiles")
                .select("node_color")
                .eq("id", externalId)
                .single();

            if (profile) {
                setNodeColor(profile.node_color);
            }

            // Load existing relationships
            const {data: rels} = await supabase
                .from("external_relationships")
                .select(`
                    *,
                    custom_relationship_type:custom_relationship_types(*)
                `)
                .eq("user_id", userId)
                .eq("external_profile_id", externalId);

            setExistingRelationships(rels || []);
        }
    }

    async function handleUpdateNodeColor() {
        if (!node || node.type !== "external") return;

        const externalId = node.id.replace("external-", "");

        const {error} = await supabase
            .from("external_profiles")
            .update({node_color: nodeColor})
            .eq("id", externalId);

        if (error) {
            toast({
                title: "Error updating color",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Node color updated",
            description: "The node color has been changed successfully.",
        });

        onUpdate();
    }

    async function handleAddRelationship() {
        if (!node || node.type !== "external") return;

        const externalId = node.id.replace("external-", "");

        const relationshipData: any = {
            user_id: userId,
            external_profile_id: externalId,
            notes: newRelationship.notes,
            is_custom: newRelationship.use_custom_type, // True if using custom type, false if using standard type
        };

        if (newRelationship.use_custom_type && newRelationship.relationship_type_id) {
            relationshipData.relationship_type_id = newRelationship.relationship_type_id;
            relationshipData.default_type = null;
        } else {
            relationshipData.default_type = newRelationship.default_type;
            relationshipData.relationship_type_id = null;
        }

        const {error} = await supabase
            .from("external_relationships")
            .insert([relationshipData]);

        if (error) {
            toast({
                title: "Error adding relationship",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Relationship added",
            description: "New relationship edge has been added to this node.",
        });

        setNewRelationship({
            relationship_type_id: "",
            default_type: "acquaintance",
            use_custom_type: false,
            notes: "",
        });

        loadNodeData();
        onUpdate();
    }

    async function handleDeleteRelationship(relationshipId: string) {
        const {error} = await supabase
            .from("external_relationships")
            .delete()
            .eq("id", relationshipId);

        if (error) {
            toast({
                title: "Error deleting relationship",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Relationship deleted",
            description: "The relationship edge has been removed.",
        });

        loadNodeData();
        onUpdate();
    }

    if (!node) return null;

    const isEditable = node.type === "external" || node.isCustom;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Node: {node.display_name}</DialogTitle>
                    <DialogDescription>
                        {isEditable
                            ? "Customize the appearance and relationships of this node"
                            : "View node information (read-only for real network connections)"}
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="appearance">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="relationships">Relationships</TabsTrigger>
                    </TabsList>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="space-y-4">
                        <div>
                            <Label>Node Type</Label>
                            <p className="text-sm text-muted-foreground capitalize">{node.type}</p>
                        </div>

                        <div>
                            <Label>Display Name</Label>
                            <p className="text-sm">{node.display_name}</p>
                        </div>

                        {node.type === "user" && (
                            <div>
                                <Label>Username</Label>
                                <p className="text-sm text-muted-foreground">@{node.username}</p>
                            </div>
                        )}

                        {isEditable && node.type === "external" && (
                            <>
                                <div>
                                    <Label htmlFor="node_color">Node Color</Label>
                                    <div className="flex gap-2 items-center mt-2">
                                        <Input
                                            id="node_color"
                                            type="color"
                                            value={nodeColor}
                                            onChange={(e) => setNodeColor(e.target.value)}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            type="text"
                                            value={nodeColor}
                                            onChange={(e) => setNodeColor(e.target.value)}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 p-3 rounded-lg border">
                                    <div
                                        className="w-8 h-8 rounded-full"
                                        style={{backgroundColor: nodeColor}}
                                    />
                                    <span className="text-sm text-muted-foreground">Preview</span>
                                </div>

                                <Button onClick={handleUpdateNodeColor} className="w-full">
                                    Update Node Color
                                </Button>
                            </>
                        )}

                        {!isEditable && (
                            <p className="text-sm text-muted-foreground italic">
                                This node represents a real network connection and cannot be edited.
                            </p>
                        )}
                    </TabsContent>

                    {/* Relationships Tab */}
                    <TabsContent value="relationships" className="space-y-4">
                        {isEditable && node.type === "external" ? (
                            <>
                                <div>
                                    <h4 className="font-medium mb-2">Existing Relationships</h4>
                                    {existingRelationships.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No relationships yet.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {existingRelationships.map((rel) => (
                                                <div
                                                    key={rel.id}
                                                    className="flex items-center justify-between p-2 border rounded"
                                                >
                                                    <span className="text-sm">
                                                        {rel.custom_relationship_type
                                                            ? rel.custom_relationship_type.label
                                                            : rel.default_type?.charAt(0).toUpperCase() + rel.default_type?.slice(1)}
                                                    </span>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteRelationship(rel.id)}
                                                    >
                                                        <Trash2Icon className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <h4 className="font-medium mb-2">Add New Relationship Edge</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="relationship_type">Relationship Type</Label>
                                            <RelationshipTypeSelector
                                                userId={userId}
                                                selectedTypeId={newRelationship.relationship_type_id || null}
                                                onSelect={(typeId, defaultType) => {
                                                    if (typeId) {
                                                        setNewRelationship({
                                                            ...newRelationship,
                                                            relationship_type_id: typeId,
                                                            use_custom_type: true
                                                        });
                                                    } else {
                                                        setNewRelationship({
                                                            ...newRelationship,
                                                            relationship_type_id: "",
                                                            default_type: defaultType || "acquaintance",
                                                            use_custom_type: false
                                                        });
                                                    }
                                                }}
                                                defaultTypeOption={true}
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Notes</Label>
                                            <Textarea
                                                id="notes"
                                                value={newRelationship.notes}
                                                onChange={(e) =>
                                                    setNewRelationship({...newRelationship, notes: e.target.value})
                                                }
                                                rows={2}
                                            />
                                        </div>

                                        <Button onClick={handleAddRelationship} className="w-full">
                                            <PlusIcon className="h-4 w-4 mr-2"/>
                                            Add Relationship Edge
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Relationship editing is only available for external/custom nodes.
                            </p>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Checkbox} from "@/components/ui/checkbox";
import {useToast} from "@/hooks/use-toast";

interface EdgeEditDialogProps {
    edge: {
        fromNodeId: string;
        toNodeId: string;
        fromNodeName: string;
        toNodeName: string;
        relationshipId?: string;
        isExternal: boolean;
        isPersisted?: boolean; // True if from DB (requires accepted request), false if temporary
    } | null;
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
}

export function EdgeEditDialog({edge, userId, isOpen, onClose, onUpdate}: EdgeEditDialogProps) {
    const [edgeColor, setEdgeColor] = useState("#a855f7");
    const [lineStyle, setLineStyle] = useState("solid");
    const [customTypes, setCustomTypes] = useState<CustomRelationshipType[]>([]);
    const [selectedTypeId, setSelectedTypeId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [hideEdgeWarning, setHideEdgeWarning] = useState(false);

    const {toast} = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && edge) {
            loadEdgeData();
        }
        // Load preference from localStorage
        const savedPreference = localStorage.getItem('hideEdgeEditWarning');
        if (savedPreference === 'true') {
            setHideEdgeWarning(true);
        }
    }, [isOpen, edge]);

    async function loadEdgeData() {
        if (!edge) return;

        // Load custom relationship types
        const {data: types} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("user_id", userId)
            .order("display_order");

        setCustomTypes(types || []);

        // If this is an external relationship, load its details
        if (!edge.isPersisted && edge.relationshipId) {
            const {data: rel} = await supabase
                .from("external_relationships")
                .select(`
                    *,
                    custom_relationship_type:custom_relationship_types(*)
                `)
                .eq("id", edge.relationshipId)
                .single();

            if (rel) {
                if (rel.custom_relationship_type) {
                    setEdgeColor(rel.custom_relationship_type.edge_color);
                    setLineStyle(rel.custom_relationship_type.line_style);
                    setSelectedTypeId(rel.relationship_type_id || "");
                }
            }
        }
    }

    async function handleUpdateEdge() {
        if (!edge || edge.isPersisted || !edge.relationshipId) {
            toast({
                title: "Cannot edit",
                description: "Only external/custom relationships can be edited.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        // If a custom type is selected, update the relationship to use it
        if (selectedTypeId) {
            const {error} = await supabase
                .from("external_relationships")
                .update({
                    relationship_type_id: selectedTypeId,
                    default_type: null,
                })
                .eq("id", edge.relationshipId);

            if (error) {
                toast({
                    title: "Error updating edge",
                    description: error.message,
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }
        } else {
            // If no type selected but colors/style changed, we need to create a custom type
            const customType = customTypes.find(
                (t) => t.edge_color === edgeColor && t.line_style === lineStyle
            );

            if (customType) {
                const {error} = await supabase
                    .from("external_relationships")
                    .update({
                        relationship_type_id: customType.id,
                        default_type: null,
                    })
                    .eq("id", edge.relationshipId);

                if (error) {
                    toast({
                        title: "Error updating edge",
                        description: error.message,
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
            }
        }

        toast({
            title: "Edge updated",
            description: "The edge style has been updated successfully.",
        });

        setIsLoading(false);
        onUpdate();
        onClose();
    }

    if (!edge) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Edge</DialogTitle>
                    <DialogDescription>
                        {edge.fromNodeName} → {edge.toNodeName}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex flex-col gap-2 justify-between mt-2">
                    <div className="space-y-4">
                        {!edge.isPersisted ? (
                            <>
                                <div>
                                    <Label htmlFor="custom_type">Relationship Type</Label>
                                    <Select
                                        value={selectedTypeId || "default"}
                                        onValueChange={(value) => setSelectedTypeId(value === "default" ? "" : value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a type (optional)"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Default</SelectItem>
                                            {customTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Choose a relationship type to apply its colors and style
                                    </p>
                                </div>

                                <div>
                                    <Label htmlFor="edge_color">Edge Color</Label>
                                    <div className="flex gap-2 items-center mt-2">
                                        <Input
                                            id="edge_color"
                                            type="color"
                                            value={edgeColor}
                                            onChange={(e) => setEdgeColor(e.target.value)}
                                            className="w-20 h-10"
                                            disabled={selectedTypeId !== "" && selectedTypeId !== "default"}
                                        />
                                        <Input
                                            type="text"
                                            value={edgeColor}
                                            onChange={(e) => setEdgeColor(e.target.value)}
                                            className="flex-1"
                                            disabled={selectedTypeId !== "" && selectedTypeId !== "default"}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="line_style">Line Style</Label>
                                    <Select
                                        value={lineStyle}
                                        onValueChange={setLineStyle}
                                        disabled={selectedTypeId !== "" && selectedTypeId !== "default"}
                                    >
                                        <SelectTrigger>
                                            <SelectValue/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="solid">Solid ─────</SelectItem>
                                            <SelectItem value="dashed">Dashed ─ ─ ─</SelectItem>
                                            <SelectItem value="dotted">Dotted ・・・・・</SelectItem>
                                            <SelectItem value="double">Double ═════</SelectItem>
                                            <SelectItem value="wavy">Wavy ～～～</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-center gap-2 p-3 rounded-lg border">
                                    <div className="flex-1 h-0.5" style={{
                                        background: edgeColor,
                                        borderTop: lineStyle === 'dashed' ? `2px dashed ${edgeColor}` :
                                            lineStyle === 'dotted' ? `2px dotted ${edgeColor}` :
                                                lineStyle === 'double' ? `3px double ${edgeColor}` :
                                                    lineStyle === 'wavy' ? `2px solid ${edgeColor}` :
                                                        `2px solid ${edgeColor}`
                                    }}/>
                                    <span className="text-sm text-muted-foreground">Preview</span>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                This edge represents a real network connection and cannot be edited. Only view-only
                                relationships can be customized.
                            </p>
                        )}
                    </div>

                    <DialogFooter className="flex flex-row items-center justify-between gap-4">
                        {edge.isPersisted ? (
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="hideEdgeWarning"
                                    checked={hideEdgeWarning}
                                    onCheckedChange={(checked) => {
                                        const newValue = checked as boolean;
                                        setHideEdgeWarning(newValue);
                                        localStorage.setItem('hideEdgeEditWarning', String(newValue));
                                    }}
                                />
                                <Label htmlFor="hideEdgeWarning" className="text-sm cursor-pointer whitespace-nowrap">
                                    Don't show this warning again
                                </Label>
                            </div>
                        ) : <div/>}
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            {!edge.isPersisted && (
                                <Button onClick={handleUpdateEdge} disabled={isLoading}>
                                    {isLoading ? "Updating..." : "Update Edge"}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}

"use client";

import {Edit2, Palette, Plus, Trash2} from "lucide-react";
import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {createBrowserClient} from "@/lib/supabase/client";
import {toast} from "sonner";

interface CustomRelationshipType {
    id: string;
    user_id: string;
    label: string;
    description: string | null;
    node_color: string;
    edge_color: string;
    line_style: string;
    display_order: number;
    is_visible_on_map: boolean;
    created_at: string;
}

export function CustomRelationshipManager({userId}: { userId: string }) {
    const [relationshipTypes, setRelationshipTypes] = useState<CustomRelationshipType[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingType, setEditingType] = useState<CustomRelationshipType | null>(null);
    const [formData, setFormData] = useState({
        label: "",
        description: "",
        node_color: "#8b5cf6",
        edge_color: "#a855f7",
        line_style: "solid",
        display_order: 0,
        is_visible_on_map: true
    });
    const supabase = createBrowserClient();

    useEffect(() => {
        loadRelationshipTypes();
    }, [userId]);

    async function loadRelationshipTypes() {
        const {data, error} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("user_id", userId)
            .order("display_order", {ascending: true})
            .order("created_at", {ascending: false});

        if (error) {
            console.error("Error loading relationship types:", error);
            return;
        }

        setRelationshipTypes(data || []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.label.trim()) {
            toast.error("Please enter a label");
            return;
        }

        if (editingType) {
            // Update existing
            const {error} = await supabase
                .from("custom_relationship_types")
                .update({
                    label: formData.label,
                    description: formData.description,
                    node_color: formData.node_color,
                    edge_color: formData.edge_color,
                    line_style: formData.line_style,
                    display_order: formData.display_order,
                    is_visible_on_map: formData.is_visible_on_map
                })
                .eq("id", editingType.id);

            if (error) {
                toast.error("Failed to update relationship type");
                console.error(error);
                return;
            }

            toast.success("Relationship type updated!");
        } else {
            // Create new
            const {error} = await supabase
                .from("custom_relationship_types")
                .insert({
                    user_id: userId,
                    label: formData.label,
                    description: formData.description,
                    node_color: formData.node_color,
                    edge_color: formData.edge_color,
                    line_style: formData.line_style,
                    display_order: formData.display_order,
                    is_visible_on_map: formData.is_visible_on_map
                });

            if (error) {
                if (error.code === "23505") {
                    toast.error("A relationship type with this label already exists");
                } else {
                    toast.error("Failed to create relationship type");
                    console.error(error);
                }
                return;
            }

            toast.success("Relationship type created!");
        }

        setIsDialogOpen(false);
        setEditingType(null);
        setFormData({
            label: "",
            description: "",
            node_color: "#8b5cf6",
            edge_color: "#a855f7",
            line_style: "solid",
            display_order: 0,
            is_visible_on_map: true
        });
        loadRelationshipTypes();
    }

    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this relationship type? Any relationships using this type will need to be updated.")) {
            return;
        }

        const {error} = await supabase
            .from("custom_relationship_types")
            .delete()
            .eq("id", id);

        if (error) {
            toast.error("Failed to delete relationship type");
            console.error(error);
            return;
        }

        toast.success("Relationship type deleted");
        loadRelationshipTypes();
    }

    function handleEdit(type: CustomRelationshipType) {
        setEditingType(type);
        setFormData({
            label: type.label,
            description: type.description || "",
            node_color: type.node_color,
            edge_color: type.edge_color,
            line_style: type.line_style || "solid",
            display_order: type.display_order || 0,
            is_visible_on_map: type.is_visible_on_map !== undefined ? type.is_visible_on_map : true
        });
        setIsDialogOpen(true);
    }

    function handleDialogClose() {
        setIsDialogOpen(false);
        setEditingType(null);
        setFormData({
            label: "",
            description: "",
            node_color: "#8b5cf6",
            edge_color: "#a855f7",
            line_style: "solid",
            display_order: 0,
            is_visible_on_map: true
        });
    }

    return (
        <Card className="border-royal-purple/20">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Custom Relationship Types</CardTitle>
                        <CardDescription>
                            Create and manage your custom relationship labels with personalized colors
                        </CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => handleDialogClose()}
                                    className="bg-gradient-to-r from-royal-purple to-royal-blue">
                                <Plus className="h-4 w-4 mr-2"/>
                                Add Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingType ? "Edit Relationship Type" : "Create Relationship Type"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Define a custom relationship type with your own label and colors
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="label">Label *</Label>
                                        <Input
                                            id="label"
                                            value={formData.label}
                                            onChange={(e) => setFormData({...formData, label: e.target.value})}
                                            placeholder="e.g., Best Friend, Mentor, Study Buddy"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Optional description of this relationship type"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="node_color">
                                                <Palette className="h-4 w-4 inline mr-1"/>
                                                Node Color
                                            </Label>
                                            <Input
                                                id="node_color"
                                                type="color"
                                                value={formData.node_color}
                                                onChange={(e) => setFormData({...formData, node_color: e.target.value})}
                                                className="h-12 w-full"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edge_color">
                                                <Palette className="h-4 w-4 inline mr-1"/>
                                                Edge Color
                                            </Label>
                                            <Input
                                                id="edge_color"
                                                type="color"
                                                value={formData.edge_color}
                                                onChange={(e) => setFormData({...formData, edge_color: e.target.value})}
                                                className="h-12 w-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="line_style">Line Style</Label>
                                        <Select
                                            value={formData.line_style}
                                            onValueChange={(value) => setFormData({...formData, line_style: value})}
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

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="display_order">Display Order</Label>
                                            <Input
                                                id="display_order"
                                                type="number"
                                                value={formData.display_order}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    display_order: parseInt(e.target.value) || 0
                                                })}
                                                placeholder="0"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between pt-6">
                                            <Label htmlFor="is_visible">Show on Map</Label>
                                            <Switch
                                                id="is_visible"
                                                checked={formData.is_visible_on_map}
                                                onCheckedChange={(checked) => setFormData({
                                                    ...formData,
                                                    is_visible_on_map: checked
                                                })}
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 p-3 rounded-lg border"
                                         style={{borderColor: formData.edge_color}}>
                                        <div
                                            className="h-8 w-8 rounded-full border-2"
                                            style={{
                                                backgroundColor: formData.node_color,
                                                borderColor: formData.edge_color
                                            }}
                                        />
                                        <div className="flex-1 h-0.5" style={{
                                            background: formData.edge_color,
                                            borderTop: formData.line_style === 'dashed' ? `2px dashed ${formData.edge_color}` :
                                                formData.line_style === 'dotted' ? `2px dotted ${formData.edge_color}` :
                                                    formData.line_style === 'double' ? `3px double ${formData.edge_color}` :
                                                        formData.line_style === 'wavy' ? `2px solid ${formData.edge_color}` :
                                                            `2px solid ${formData.edge_color}`
                                        }}/>
                                        <span className="text-sm text-muted-foreground">Preview</span>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={handleDialogClose}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" className="bg-gradient-to-r from-royal-purple to-royal-blue">
                                        {editingType ? "Update" : "Create"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>

            <CardContent>
                {relationshipTypes.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Palette className="h-12 w-12 mx-auto mb-4 opacity-50"/>
                        <p>No custom relationship types yet</p>
                        <p className="text-sm">Create your first custom type to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {relationshipTypes.map((type) => (
                            <div
                                key={type.id}
                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                                style={{borderColor: type.edge_color + "40"}}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-10 w-10 rounded-full border-2 flex-shrink-0"
                                        style={{
                                            backgroundColor: type.node_color,
                                            borderColor: type.edge_color
                                        }}
                                    />
                                    <div>
                                        <p className="font-medium">{type.label}</p>
                                        {type.description && (
                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                {type.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(type)}
                                    >
                                        <Edit2 className="h-4 w-4"/>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => handleDelete(type.id)}
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

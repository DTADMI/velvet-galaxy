"use client";

import {useEffect, useState} from "react";
import {createClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {useToast} from "@/hooks/use-toast";
import {EditIcon, PlusIcon, Trash2Icon, UserIcon} from "lucide-react";
import {Switch} from "@/components/ui/switch";

interface ExternalProfile {
    id: string;
    user_id: string;
    display_name: string;
    notes: string | null;
    is_visible_on_map: boolean;
    node_color: string;
    created_at: string;
}

interface ExternalRelationship {
    id: string;
    user_id: string;
    external_profile_id: string;
    relationship_type_id: string | null;
    default_type: string | null;
    notes: string | null;
    external_profile?: ExternalProfile;
    custom_relationship_type?: {
        id: string;
        label: string;
        node_color: string;
        edge_color: string;
        line_style: string;
    };
}

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
}

export default function ExternalProfileManager() {
    const [profiles, setProfiles] = useState<ExternalProfile[]>([]);
    const [relationships, setRelationships] = useState<ExternalRelationship[]>([]);
    const [customTypes, setCustomTypes] = useState<CustomRelationshipType[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<ExternalProfile | null>(null);
    const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
    const [selectedProfileForRelationship, setSelectedProfileForRelationship] = useState<string>("");

    const [formData, setFormData] = useState({
        display_name: "",
        notes: "",
        is_visible_on_map: true,
        node_color: "#6b7280",
    });

    const [relationshipForm, setRelationshipForm] = useState({
        external_profile_id: "",
        relationship_type_id: "",
        default_type: "acquaintance",
        use_custom_type: false,
        notes: "",
    });

    const {toast} = useToast();
    const supabase = createClient();

    useEffect(() => {
        loadProfiles();
        loadRelationships();
        loadCustomTypes();
    }, []);

    async function loadProfiles() {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const {data, error} = await supabase
            .from("external_profiles")
            .select("*")
            .eq("user_id", user.id)
            .order("display_name");

        if (error) {
            toast({
                title: "Error loading profiles",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        setProfiles(data || []);
    }

    async function loadRelationships() {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const {data, error} = await supabase
            .from("external_relationships")
            .select(`
                *,
                external_profile:external_profiles(*),
                custom_relationship_type:custom_relationship_types(*)
            `)
            .eq("user_id", user.id);

        if (error) {
            toast({
                title: "Error loading relationships",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        setRelationships(data || []);
    }

    async function loadCustomTypes() {
        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const {data, error} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("user_id", user.id)
            .order("display_order");

        if (error) {
            console.error("Error loading custom types:", error);
            return;
        }

        setCustomTypes(data || []);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        if (editingProfile) {
            const {error} = await supabase
                .from("external_profiles")
                .update(formData)
                .eq("id", editingProfile.id);

            if (error) {
                toast({
                    title: "Error updating profile",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Profile updated",
                description: "External profile has been updated successfully.",
            });
        } else {
            const {error} = await supabase
                .from("external_profiles")
                .insert([{...formData, user_id: user.id}]);

            if (error) {
                toast({
                    title: "Error creating profile",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Profile created",
                description: "External profile has been created successfully.",
            });
        }

        setIsOpen(false);
        setEditingProfile(null);
        setFormData({
            display_name: "",
            notes: "",
            is_visible_on_map: true,
            node_color: "#6b7280",
        });
        loadProfiles();
    }

    async function handleDelete(id: string) {
        const {error} = await supabase
            .from("external_profiles")
            .delete()
            .eq("id", id);

        if (error) {
            toast({
                title: "Error deleting profile",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Profile deleted",
            description: "External profile has been deleted successfully.",
        });
        loadProfiles();
        loadRelationships();
    }

    async function handleCreateRelationship(e: React.FormEvent) {
        e.preventDefault();

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        const relationshipData: any = {
            user_id: user.id,
            external_profile_id: relationshipForm.external_profile_id,
            notes: relationshipForm.notes,
        };

        if (relationshipForm.use_custom_type && relationshipForm.relationship_type_id) {
            relationshipData.relationship_type_id = relationshipForm.relationship_type_id;
            relationshipData.default_type = null;
        } else {
            relationshipData.default_type = relationshipForm.default_type;
            relationshipData.relationship_type_id = null;
        }

        const {error} = await supabase
            .from("external_relationships")
            .insert([relationshipData]);

        if (error) {
            toast({
                title: "Error creating relationship",
                description: error.message,
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Relationship created",
            description: "External relationship has been created successfully.",
        });

        setIsRelationshipDialogOpen(false);
        setRelationshipForm({
            external_profile_id: "",
            relationship_type_id: "",
            default_type: "acquaintance",
            use_custom_type: false,
            notes: "",
        });
        loadRelationships();
    }

    async function handleDeleteRelationship(id: string) {
        const {error} = await supabase
            .from("external_relationships")
            .delete()
            .eq("id", id);

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
            description: "External relationship has been deleted successfully.",
        });
        loadRelationships();
    }

    function openEditDialog(profile: ExternalProfile) {
        setEditingProfile(profile);
        setFormData({
            display_name: profile.display_name,
            notes: profile.notes || "",
            is_visible_on_map: profile.is_visible_on_map,
            node_color: profile.node_color,
        });
        setIsOpen(true);
    }

    function openCreateDialog() {
        setEditingProfile(null);
        setFormData({
            display_name: "",
            notes: "",
            is_visible_on_map: true,
            node_color: "#6b7280",
        });
        setIsOpen(true);
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>External Profiles</CardTitle>
                            <CardDescription>
                                Manage profiles for people not on the network
                            </CardDescription>
                        </div>
                        <Dialog open={isOpen} onOpenChange={setIsOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={openCreateDialog}>
                                    <PlusIcon className="h-4 w-4 mr-2"/>
                                    Add Profile
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {editingProfile ? "Edit Profile" : "Create External Profile"}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Add someone not on the network to your relationship map
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="display_name">Display Name</Label>
                                        <Input
                                            id="display_name"
                                            value={formData.display_name}
                                            onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={formData.notes}
                                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                                            rows={3}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="node_color">Node Color</Label>
                                        <div className="flex gap-2 items-center">
                                            <Input
                                                id="node_color"
                                                type="color"
                                                value={formData.node_color}
                                                onChange={(e) => setFormData({...formData, node_color: e.target.value})}
                                                className="w-20 h-10"
                                            />
                                            <Input
                                                type="text"
                                                value={formData.node_color}
                                                onChange={(e) => setFormData({...formData, node_color: e.target.value})}
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="is_visible">Visible on Map</Label>
                                        <Switch
                                            id="is_visible"
                                            checked={formData.is_visible_on_map}
                                            onCheckedChange={(checked) => setFormData({
                                                ...formData,
                                                is_visible_on_map: checked
                                            })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit">
                                            {editingProfile ? "Update" : "Create"}
                                        </Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {profiles.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No external profiles yet. Add someone to get started.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {profiles.map((profile) => (
                                <div
                                    key={profile.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center"
                                            style={{backgroundColor: profile.node_color}}
                                        >
                                            <UserIcon className="h-4 w-4 text-white"/>
                                        </div>
                                        <div>
                                            <p className="font-medium">{profile.display_name}</p>
                                            {profile.notes && (
                                                <p className="text-sm text-muted-foreground line-clamp-1">
                                                    {profile.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => openEditDialog(profile)}
                                        >
                                            <EditIcon className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDelete(profile.id)}
                                        >
                                            <Trash2Icon className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>External Relationships</CardTitle>
                            <CardDescription>
                                Define relationships with external profiles
                            </CardDescription>
                        </div>
                        <Dialog open={isRelationshipDialogOpen} onOpenChange={setIsRelationshipDialogOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={profiles.length === 0}>
                                    <PlusIcon className="h-4 w-4 mr-2"/>
                                    Add Relationship
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Create External Relationship</DialogTitle>
                                    <DialogDescription>
                                        Define your relationship with an external profile
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleCreateRelationship} className="space-y-4">
                                    <div>
                                        <Label htmlFor="external_profile">Profile</Label>
                                        <Select
                                            value={relationshipForm.external_profile_id}
                                            onValueChange={(value) =>
                                                setRelationshipForm({...relationshipForm, external_profile_id: value})
                                            }
                                            required
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a profile"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {profiles.map((profile) => (
                                                    <SelectItem key={profile.id} value={profile.id}>
                                                        {profile.display_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <Label>Use Custom Relationship Type</Label>
                                        <Switch
                                            checked={relationshipForm.use_custom_type}
                                            onCheckedChange={(checked) =>
                                                setRelationshipForm({...relationshipForm, use_custom_type: checked})
                                            }
                                        />
                                    </div>

                                    {relationshipForm.use_custom_type ? (
                                        <div>
                                            <Label htmlFor="custom_type">Custom Type</Label>
                                            <Select
                                                value={relationshipForm.relationship_type_id}
                                                onValueChange={(value) =>
                                                    setRelationshipForm({
                                                        ...relationshipForm,
                                                        relationship_type_id: value
                                                    })
                                                }
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a type"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {customTypes.map((type) => (
                                                        <SelectItem key={type.id} value={type.id}>
                                                            {type.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label htmlFor="default_type">Relationship Type</Label>
                                            <Select
                                                value={relationshipForm.default_type}
                                                onValueChange={(value) =>
                                                    setRelationshipForm({...relationshipForm, default_type: value})
                                                }
                                                required
                                            >
                                                <SelectTrigger>
                                                    <SelectValue/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="friend">Friend</SelectItem>
                                                    <SelectItem value="family">Family</SelectItem>
                                                    <SelectItem value="partner">Partner</SelectItem>
                                                    <SelectItem value="colleague">Colleague</SelectItem>
                                                    <SelectItem value="acquaintance">Acquaintance</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div>
                                        <Label htmlFor="rel_notes">Notes</Label>
                                        <Textarea
                                            id="rel_notes"
                                            value={relationshipForm.notes}
                                            onChange={(e) =>
                                                setRelationshipForm({...relationshipForm, notes: e.target.value})
                                            }
                                            rows={3}
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsRelationshipDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit">Create</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    {relationships.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No external relationships yet.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {relationships.map((rel) => (
                                <div
                                    key={rel.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium">
                                            {rel.external_profile?.display_name || "Unknown"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {rel.custom_relationship_type
                                                ? rel.custom_relationship_type.label
                                                : rel.default_type?.charAt(0).toUpperCase() + rel.default_type?.slice(1)}
                                        </p>
                                    </div>
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
                </CardContent>
            </Card>
        </div>
    );
}

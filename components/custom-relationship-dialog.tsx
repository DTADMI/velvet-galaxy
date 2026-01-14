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
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Switch} from "@/components/ui/switch";
import {useToast} from "@/hooks/use-toast";
import {PlusIcon, UserIcon} from "lucide-react";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {RelationshipTypeSelector} from "@/components/relationship-type-selector";

interface ExternalProfile {
    id: string;
    display_name: string;
    node_color: string;
}

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
}

interface TemporaryRelationship {
    id: string;
    user_id: string;
    external_profile_id?: string;
    from_profile_id?: string;
    to_profile_id?: string;
    relationship_type_id?: string;
    default_type?: string;
    label?: string;
    notes?: string;
}

interface CustomRelationshipDialogProps {
    userId: string;
    onRelationshipCreated?: () => void;
    onTemporaryRelationshipCreated?: (relationship: TemporaryRelationship) => void;
}

export function CustomRelationshipDialog({
                                             userId,
                                             onRelationshipCreated,
                                             onTemporaryRelationshipCreated
                                         }: CustomRelationshipDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [externalProfiles, setExternalProfiles] = useState<ExternalProfile[]>([]);
    const [customTypes, setCustomTypes] = useState<CustomRelationshipType[]>([]);
    const [relationshipMode, setRelationshipMode] = useState<"user-external" | "external-external">("user-external");

    // Form state for user-to-external relationship
    const [userExternalForm, setUserExternalForm] = useState({
        external_profile_id: "",
        relationship_type_id: "",
        default_type: "acquaintance",
        use_custom_type: false,
        notes: "",
        is_persisted: false, // false = view-only (temporary), true = persisted custom relationship
    });

    // Form state for external-to-external relationship
    const [externalExternalForm, setExternalExternalForm] = useState({
        from_profile_id: "",
        to_profile_id: "",
        relationship_type_id: "",
        default_type: "acquaintance",
        use_custom_type: false,
        label: "",
        notes: "",
        is_persisted: false, // false = view-only (temporary), true = persisted custom relationship
    });

    // New external profile form
    const [newProfileForm, setNewProfileForm] = useState({
        display_name: "",
        node_color: "#6b7280",
    });

    const {toast} = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    async function loadData() {
        // Load external profiles
        const {data: profiles} = await supabase
            .from("external_profiles")
            .select("id, display_name, node_color")
            .eq("user_id", userId)
            .eq("is_visible_on_map", true);

        setExternalProfiles(profiles || []);

        // Load custom relationship types
        const {data: types} = await supabase
            .from("custom_relationship_types")
            .select("id, label, node_color, edge_color, line_style")
            .eq("user_id", userId)
            .eq("is_visible_on_map", true)
            .order("display_order");

        setCustomTypes(types || []);
    }

    async function handleCreateUserExternal(e: React.FormEvent) {
        e.preventDefault();

        if (userExternalForm.is_persisted) {
            // Persisted relationship - save to DB
            // is_custom flag indicates whether using a custom type (not whether it's persisted)
            const relationshipData: any = {
                user_id: userId,
                external_profile_id: userExternalForm.external_profile_id,
                notes: userExternalForm.notes,
                is_custom: userExternalForm.use_custom_type, // True if using custom type, false if using standard type
            };

            if (userExternalForm.use_custom_type && userExternalForm.relationship_type_id) {
                relationshipData.relationship_type_id = userExternalForm.relationship_type_id;
                relationshipData.default_type = null;
            } else {
                relationshipData.default_type = userExternalForm.default_type;
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
                title: "Persisted relationship created",
                description: "The relationship has been saved and added to your map.",
            });

            // Reload profiles and relationships
            await loadData();
        } else {
            // Temporary/view-only relationship - handle in frontend only
            const tempRelationship: TemporaryRelationship = {
                id: crypto.randomUUID(),
                user_id: userId,
                external_profile_id: userExternalForm.external_profile_id,
                relationship_type_id: userExternalForm.use_custom_type ? userExternalForm.relationship_type_id : undefined,
                default_type: !userExternalForm.use_custom_type ? userExternalForm.default_type : undefined,
                notes: userExternalForm.notes,
            };

            // Notify parent component
            onTemporaryRelationshipCreated?.(tempRelationship);

            toast({
                title: "Temporary relationship created",
                description: "This view-only relationship will not be persisted to the database.",
            });
        }

        resetForms();
        setIsOpen(false);
        onRelationshipCreated?.();
    }

    async function handleCreateExternalExternal(e: React.FormEvent) {
        e.preventDefault();

        if (externalExternalForm.is_persisted) {
            // Persisted relationship - save to DB
            const relationshipData: any = {
                user_id: userId,
                from_profile_id: externalExternalForm.from_profile_id,
                to_profile_id: externalExternalForm.to_profile_id,
                label: externalExternalForm.label,
                notes: externalExternalForm.notes,
                is_visible_on_map: true,
            };

            if (externalExternalForm.use_custom_type && externalExternalForm.relationship_type_id) {
                relationshipData.relationship_type_id = externalExternalForm.relationship_type_id;
                relationshipData.default_type = null;
            } else {
                relationshipData.default_type = externalExternalForm.default_type;
                relationshipData.relationship_type_id = null;
            }

            const {error} = await supabase
                .from("custom_relationships")
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
                title: "Persisted relationship created",
                description: "The relationship has been saved and added to your map.",
            });

            // Reload profiles and relationships
            await loadData();
        } else {
            // Temporary/view-only relationship - handle in frontend only
            const tempRelationship: TemporaryRelationship = {
                id: crypto.randomUUID(),
                user_id: userId,
                from_profile_id: externalExternalForm.from_profile_id,
                to_profile_id: externalExternalForm.to_profile_id,
                relationship_type_id: externalExternalForm.use_custom_type ? externalExternalForm.relationship_type_id : undefined,
                default_type: !externalExternalForm.use_custom_type ? externalExternalForm.default_type : undefined,
                label: externalExternalForm.label,
                notes: externalExternalForm.notes,
            };

            // Notify parent component
            onTemporaryRelationshipCreated?.(tempRelationship);

            toast({
                title: "Temporary relationship created",
                description: "This view-only relationship will not be persisted to the database.",
            });
        }

        resetForms();
        setIsOpen(false);
        onRelationshipCreated?.();
    }

    async function handleCreateNewProfile(e: React.FormEvent) {
        e.preventDefault();

        const {data, error} = await supabase
            .from("external_profiles")
            .insert([{
                user_id: userId,
                display_name: newProfileForm.display_name,
                node_color: newProfileForm.node_color,
                is_visible_on_map: true,
            }])
            .select()
            .single();

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
            description: `${newProfileForm.display_name} has been added.`,
        });

        // Reload profiles
        loadData();

        // Reset form
        setNewProfileForm({
            display_name: "",
            node_color: "#6b7280",
        });

        // Auto-select the new profile if in user-external mode
        if (relationshipMode === "user-external") {
            setUserExternalForm({...userExternalForm, external_profile_id: data.id});
        }
    }

    function resetForms() {
        setUserExternalForm({
            external_profile_id: "",
            relationship_type_id: "",
            default_type: "acquaintance",
            use_custom_type: false,
            notes: "",
            is_persisted: false,
        });
        setExternalExternalForm({
            from_profile_id: "",
            to_profile_id: "",
            relationship_type_id: "",
            default_type: "acquaintance",
            use_custom_type: false,
            label: "",
            notes: "",
            is_persisted: false,
        });
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="secondary">
                    <PlusIcon className="h-4 w-4"/>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Custom Relationship</DialogTitle>
                    <DialogDescription>
                        Create custom view-only relationships for visualization purposes
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={relationshipMode} onValueChange={(v) => setRelationshipMode(v as any)}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="user-external">You → External</TabsTrigger>
                        <TabsTrigger value="external-external">External → External</TabsTrigger>
                        <TabsTrigger value="new-profile">New Profile</TabsTrigger>
                    </TabsList>

                    {/* User to External Profile */}
                    <TabsContent value="user-external">
                        <form onSubmit={handleCreateUserExternal} className="space-y-4">
                            <div>
                                <Label htmlFor="user_external_profile">External Profile</Label>
                                <Select
                                    value={userExternalForm.external_profile_id}
                                    onValueChange={(value) =>
                                        setUserExternalForm({...userExternalForm, external_profile_id: value})
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a profile"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {externalProfiles.map((profile) => (
                                            <SelectItem key={profile.id} value={profile.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{backgroundColor: profile.node_color}}
                                                    />
                                                    {profile.display_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {externalProfiles.length === 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        No external profiles yet. Create one in the "New Profile" tab.
                                    </p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="user_relationship_type">Relationship Type</Label>
                                <RelationshipTypeSelector
                                    userId={userId}
                                    selectedTypeId={userExternalForm.relationship_type_id || null}
                                    onSelect={(typeId, defaultType) => {
                                        if (typeId) {
                                            setUserExternalForm({
                                                ...userExternalForm,
                                                relationship_type_id: typeId,
                                                use_custom_type: true
                                            });
                                        } else {
                                            setUserExternalForm({
                                                ...userExternalForm,
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
                                <Label htmlFor="user_notes">Notes</Label>
                                <Textarea
                                    id="user_notes"
                                    value={userExternalForm.notes}
                                    onChange={(e) =>
                                        setUserExternalForm({...userExternalForm, notes: e.target.value})
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="user_persisted" className="text-sm font-medium">
                                        Persist Relationship
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Persisted relationships are saved and require user acceptance. View-only
                                        relationships are temporary.
                                    </p>
                                </div>
                                <Switch
                                    id="user_persisted"
                                    checked={userExternalForm.is_persisted}
                                    onCheckedChange={(checked) =>
                                        setUserExternalForm({...userExternalForm, is_persisted: checked})
                                    }
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!userExternalForm.external_profile_id}>
                                    Create Relationship
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* External to External Profile */}
                    <TabsContent value="external-external">
                        <form onSubmit={handleCreateExternalExternal} className="space-y-4">
                            <div>
                                <Label htmlFor="from_profile">From Profile</Label>
                                <Select
                                    value={externalExternalForm.from_profile_id}
                                    onValueChange={(value) =>
                                        setExternalExternalForm({...externalExternalForm, from_profile_id: value})
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a profile"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {externalProfiles.map((profile) => (
                                            <SelectItem key={profile.id} value={profile.id}>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{backgroundColor: profile.node_color}}
                                                    />
                                                    {profile.display_name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="to_profile">To Profile</Label>
                                <Select
                                    value={externalExternalForm.to_profile_id}
                                    onValueChange={(value) =>
                                        setExternalExternalForm({...externalExternalForm, to_profile_id: value})
                                    }
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a profile"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {externalProfiles
                                            .filter((p) => p.id !== externalExternalForm.from_profile_id)
                                            .map((profile) => (
                                                <SelectItem key={profile.id} value={profile.id}>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{backgroundColor: profile.node_color}}
                                                        />
                                                        {profile.display_name}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="ext_label">Relationship Label (Optional)</Label>
                                <Input
                                    id="ext_label"
                                    value={externalExternalForm.label}
                                    onChange={(e) =>
                                        setExternalExternalForm({...externalExternalForm, label: e.target.value})
                                    }
                                    placeholder="e.g., Siblings, Coworkers"
                                />
                            </div>

                            <div>
                                <Label htmlFor="ext_relationship_type">Relationship Type</Label>
                                <RelationshipTypeSelector
                                    userId={userId}
                                    selectedTypeId={externalExternalForm.relationship_type_id || null}
                                    onSelect={(typeId, defaultType) => {
                                        if (typeId) {
                                            setExternalExternalForm({
                                                ...externalExternalForm,
                                                relationship_type_id: typeId,
                                                use_custom_type: true
                                            });
                                        } else {
                                            setExternalExternalForm({
                                                ...externalExternalForm,
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
                                <Label htmlFor="ext_notes">Notes</Label>
                                <Textarea
                                    id="ext_notes"
                                    value={externalExternalForm.notes}
                                    onChange={(e) =>
                                        setExternalExternalForm({...externalExternalForm, notes: e.target.value})
                                    }
                                    rows={3}
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="ext_persisted" className="text-sm font-medium">
                                        Persist Relationship
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Persisted relationships are saved and require user acceptance. View-only
                                        relationships are temporary.
                                    </p>
                                </div>
                                <Switch
                                    id="ext_persisted"
                                    checked={externalExternalForm.is_persisted}
                                    onCheckedChange={(checked) =>
                                        setExternalExternalForm({...externalExternalForm, is_persisted: checked})
                                    }
                                />
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        !externalExternalForm.from_profile_id ||
                                        !externalExternalForm.to_profile_id ||
                                        externalExternalForm.from_profile_id === externalExternalForm.to_profile_id
                                    }
                                >
                                    Create Relationship
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>

                    {/* New Profile Creation */}
                    <TabsContent value="new-profile">
                        <form onSubmit={handleCreateNewProfile} className="space-y-4">
                            <div>
                                <Label htmlFor="new_display_name">Display Name</Label>
                                <Input
                                    id="new_display_name"
                                    value={newProfileForm.display_name}
                                    onChange={(e) =>
                                        setNewProfileForm({...newProfileForm, display_name: e.target.value})
                                    }
                                    placeholder="Enter name"
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="new_node_color">Node Color</Label>
                                <div className="flex gap-2 items-center">
                                    <Input
                                        id="new_node_color"
                                        type="color"
                                        value={newProfileForm.node_color}
                                        onChange={(e) =>
                                            setNewProfileForm({...newProfileForm, node_color: e.target.value})
                                        }
                                        className="w-20 h-10"
                                    />
                                    <Input
                                        type="text"
                                        value={newProfileForm.node_color}
                                        onChange={(e) =>
                                            setNewProfileForm({...newProfileForm, node_color: e.target.value})
                                        }
                                        className="flex-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-lg border">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{backgroundColor: newProfileForm.node_color}}
                                >
                                    <UserIcon className="h-4 w-4 text-white"/>
                                </div>
                                <span className="text-sm text-muted-foreground">Preview</span>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Create Profile</Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

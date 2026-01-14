"use client";

import {useEffect, useState} from "react";
import {createBrowserClient} from "@/lib/supabase/client";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Check, ChevronsUpDown, Plus} from "lucide-react";
import {cn} from "@/lib/utils";
import {toast} from "sonner";

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
    is_global: boolean;
}

interface RelationshipTypeSelectorProps {
    userId: string;
    selectedTypeId?: string | null;
    onSelect: (typeId: string | null, defaultType?: string) => void;
    defaultTypeOption?: boolean;
}

export function RelationshipTypeSelector({
                                             userId,
                                             selectedTypeId,
                                             onSelect,
                                             defaultTypeOption = true
                                         }: RelationshipTypeSelectorProps) {
    const [open, setOpen] = useState(false);
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [globalTypes, setGlobalTypes] = useState<CustomRelationshipType[]>([]);
    const [userTypes, setUserTypes] = useState<CustomRelationshipType[]>([]);
    const [selectedType, setSelectedType] = useState<CustomRelationshipType | null>(null);

    // Request form state
    const [requestLabel, setRequestLabel] = useState("");
    const [requestDescription, setRequestDescription] = useState("");
    const [requestNodeColor, setRequestNodeColor] = useState("#8b5cf6");
    const [requestEdgeColor, setRequestEdgeColor] = useState("#a855f7");
    const [requestLineStyle, setRequestLineStyle] = useState<"solid" | "dashed" | "dotted" | "double" | "wavy" | "dash-dot" | "long-dash" | "short-dash">("solid");
    const [makePublic, setMakePublic] = useState(false);

    const supabase = createBrowserClient();

    useEffect(() => {
        loadTypes();
    }, [userId]);

    useEffect(() => {
        if (selectedTypeId) {
            const allTypes = [...globalTypes, ...userTypes];
            const type = allTypes.find(t => t.id === selectedTypeId);
            setSelectedType(type || null);
        } else {
            setSelectedType(null);
        }
    }, [selectedTypeId, globalTypes, userTypes]);

    async function loadTypes() {
        // Load global types (approved by admin)
        const {data: global} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("is_global", true)
            .order("label");

        // Load user's personal types
        const {data: personal} = await supabase
            .from("custom_relationship_types")
            .select("*")
            .eq("user_id", userId)
            .eq("is_global", false)
            .order("label");

        if (global) setGlobalTypes(global);
        if (personal) setUserTypes(personal);
    }

    async function handleRequestNewType() {
        if (!requestLabel.trim()) {
            toast.error("Please enter a label");
            return;
        }

        const {data: {user}} = await supabase.auth.getUser();
        if (!user) return;

        let requestId = null;

        // If user wants to make it public, submit a request first
        if (makePublic) {
            const {data: request, error: requestError} = await supabase
                .from("relationship_type_requests")
                .insert({
                    user_id: user.id,
                    requested_label: requestLabel.trim(),
                    description: requestDescription.trim() || null,
                    suggested_node_color: requestNodeColor,
                    suggested_edge_color: requestEdgeColor,
                    suggested_line_style: requestLineStyle,
                    status: "pending"
                })
                .select()
                .single();

            if (requestError) {
                toast.error("Failed to submit public request");
                console.error(requestError);
                return;
            }

            requestId = request.id;
        }

        // Create the custom type immediately for the user
        const {data: newType, error: typeError} = await supabase
            .from("custom_relationship_types")
            .insert({
                user_id: user.id,
                label: requestLabel.trim(),
                node_color: requestNodeColor,
                edge_color: requestEdgeColor,
                line_style: requestLineStyle,
                is_global: false,
                pending_global_approval: makePublic, // Mark as pending if user wants it public
                request_id: requestId, // Link to request if public
            })
            .select()
            .single();

        if (typeError) {
            toast.error("Failed to create custom type");
            console.error(typeError);
            return;
        }

        if (makePublic) {
            toast.success("Type created! Public request submitted for admin review.");
        } else {
            toast.success("Custom type created and ready to use!");
        }

        // Reload types to show the new one
        await loadTypes();

        // Auto-select the newly created type
        if (newType) {
            onSelect(newType.id);
        }

        // Reset form
        setRequestDialogOpen(false);
        setRequestLabel("");
        setRequestDescription("");
        setRequestNodeColor("#8b5cf6");
        setRequestEdgeColor("#a855f7");
        setRequestLineStyle("solid");
        setMakePublic(false);
    }

    function handleSelect(typeId: string | null) {
        if (typeId === "default") {
            onSelect(null, undefined);
            setOpen(false);
            return;
        }

        const allTypes = [...globalTypes, ...userTypes];
        const type = allTypes.find(t => t.id === typeId);
        if (type) {
            onSelect(typeId);
            setOpen(false);
        }
    }

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedType ? (
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full border"
                                    style={{backgroundColor: selectedType.node_color}}
                                />
                                {selectedType.label}
                            </div>
                        ) : (
                            "Select relationship type..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search relationship types..."/>
                        <CommandList>
                            <CommandEmpty>
                                <div className="text-center p-4">
                                    <p className="text-sm text-muted-foreground mb-2">No types found.</p>
                                    <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button size="sm" variant="outline">
                                                <Plus className="h-4 w-4 mr-2"/>
                                                Request New Type
                                            </Button>
                                        </DialogTrigger>
                                    </Dialog>
                                </div>
                            </CommandEmpty>

                            {defaultTypeOption && (
                                <CommandGroup heading="Default">
                                    <CommandItem onSelect={() => handleSelect("default")}>
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                !selectedType ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        Default
                                    </CommandItem>
                                </CommandGroup>
                            )}

                            {globalTypes.length > 0 && (
                                <CommandGroup heading="Approved Types">
                                    {globalTypes.map((type) => (
                                        <CommandItem
                                            key={type.id}
                                            onSelect={() => handleSelect(type.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedTypeId === type.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full border mr-2"
                                                style={{backgroundColor: type.node_color}}
                                            />
                                            {type.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {userTypes.length > 0 && (
                                <CommandGroup heading="Your Custom Types">
                                    {userTypes.map((type) => (
                                        <CommandItem
                                            key={type.id}
                                            onSelect={() => handleSelect(type.id)}
                                        >
                                            <Check
                                                className={cn(
                                                    "mr-2 h-4 w-4",
                                                    selectedTypeId === type.id ? "opacity-100" : "opacity-0"
                                                )}
                                            />
                                            <div
                                                className="w-4 h-4 rounded-full border mr-2"
                                                style={{backgroundColor: type.node_color}}
                                            />
                                            {type.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-2"/>
                        Request New Relationship Type
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Request New Relationship Type</DialogTitle>
                        <DialogDescription>
                            Submit a request for a new custom relationship type. An admin will review it.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="label">Label *</Label>
                            <Input
                                id="label"
                                value={requestLabel}
                                onChange={(e) => setRequestLabel(e.target.value)}
                                placeholder="e.g., Mentor, Collaborator, Coach"
                                maxLength={50}
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={requestDescription}
                                onChange={(e) => setRequestDescription(e.target.value)}
                                placeholder="Explain why this relationship type would be useful..."
                                rows={3}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="node-color">Node Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="node-color"
                                        type="color"
                                        value={requestNodeColor}
                                        onChange={(e) => setRequestNodeColor(e.target.value)}
                                        className="w-16 h-10"
                                    />
                                    <Input
                                        value={requestNodeColor}
                                        onChange={(e) => setRequestNodeColor(e.target.value)}
                                        placeholder="#8b5cf6"
                                        maxLength={7}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="edge-color">Edge Color</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id="edge-color"
                                        type="color"
                                        value={requestEdgeColor}
                                        onChange={(e) => setRequestEdgeColor(e.target.value)}
                                        className="w-16 h-10"
                                    />
                                    <Input
                                        value={requestEdgeColor}
                                        onChange={(e) => setRequestEdgeColor(e.target.value)}
                                        placeholder="#a855f7"
                                        maxLength={7}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="line-style">Line Style</Label>
                            <Select
                                value={requestLineStyle}
                                onValueChange={(value: "solid" | "dashed" | "dotted" | "double" | "wavy" | "dash-dot" | "long-dash" | "short-dash") => setRequestLineStyle(value)}
                            >
                                <SelectTrigger id="line-style">
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solid">Solid ——</SelectItem>
                                    <SelectItem value="dashed">Dashed — — —</SelectItem>
                                    <SelectItem value="dotted">Dotted ····</SelectItem>
                                    <SelectItem value="double">Double ══</SelectItem>
                                    <SelectItem value="wavy">Wavy ∿∿∿</SelectItem>
                                    <SelectItem value="dash-dot">Dash-Dot —·—·</SelectItem>
                                    <SelectItem value="long-dash">Long Dash —— ——</SelectItem>
                                    <SelectItem value="short-dash">Short Dash – – –</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
                            <input
                                type="checkbox"
                                id="make-public"
                                checked={makePublic}
                                onChange={(e) => setMakePublic(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <div className="flex-1">
                                <Label htmlFor="make-public" className="cursor-pointer font-medium">
                                    Make this type available to all users
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {makePublic
                                        ? "Your type will be submitted to admins for approval. It will be available to you immediately and to everyone after approval."
                                        : "Your type will only be visible to you and won't require admin approval."}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                onClick={() => setRequestDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleRequestNewType}>
                                {makePublic ? "Create & Request Approval" : "Create Custom Type"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

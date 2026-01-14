"use client";

import {
    ChevronDown,
    ChevronUp,
    Download,
    Eye,
    EyeOff,
    Filter,
    Hand,
    MousePointer,
    Move,
    RotateCcw,
    Search,
    SettingsIcon,
    X,
    ZoomIn,
    ZoomOut
} from "lucide-react";
import Link from "next/link";
import type React from "react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {CustomRelationshipDialog} from "@/components/custom-relationship-dialog";
import {NodeEditDialog} from "@/components/node-edit-dialog";
import {EdgeEditDialog} from "@/components/edge-edit-dialog";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Slider} from "@/components/ui/slider";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {createBrowserClient} from "@/lib/supabase/client";

interface RelationshipEdge {
    type: string;
    label: string;
    nodeColor: string;
    edgeColor: string;
    lineStyle: string;
    isCustom: boolean; // True if using a custom relationship type
    isExternal?: boolean; // True if this is an external/custom relationship (editable)
    isPersisted?: boolean; // True if saved in DB (requires accepted request), false if temporary/view-only
    relationshipId?: string; // ID of the external_relationship or custom_relationship record
}

interface TemporaryRelationship {
    id: string; // Unique ID for the temporary relationship
    user_id: string;
    external_profile_id?: string; // For user-to-external
    from_profile_id?: string; // For external-to-external
    to_profile_id?: string; // For external-to-external
    relationship_type_id?: string;
    default_type?: string;
    notes?: string;
}

interface NetworkNode {
    id: string
    username: string
    display_name: string
    avatar_url?: string | null
    x: number
    y: number
    z: number
    connections: string[]
    relationshipTypes: Record<string, string>
    relationships: Record<string, RelationshipEdge[]> // Multiple relationships per connection
    type: "user" | "group" | "external"
    isCustom?: boolean // True if this is a custom added relationship
    node_color?: string // Custom color for external profiles
    groupData?: {
        name: string
        member_count: number
    }
    manuallyPositioned?: boolean
    profiles?: Profile
}

interface Profile {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
}

interface Relationship {
    id: string;
    user_id: string;
    related_user_id: string;
    relationship_type: string;
    status: string;
}

interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
}

interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
}

interface GroupMember {
    group_id: string;
    groups: {
        id: string;
        name: string;
    };
}

interface Star {
    x: number;
    y: number;
    z: number;
    size: number;
    opacity: number;
    twinkleSpeed: number;
    twinkleOffset: number;
}

const filterNetworkNodes = (nodes: NetworkNode[], hiddenNodes: Set<string>, searchQuery: string, showGroups: boolean, userId: string, relationshipFilters: {
    friend: boolean;
    partner: boolean;
    family: boolean;
    colleague: boolean;
    acquaintance: boolean
}, showCustomOnly: boolean) => {
    return nodes.filter((node, index) => {
        if (index === 0) {
            return true;
        }
        if (hiddenNodes.has(node.id)) {
            return false;
        }
        if (searchQuery && !node.display_name.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        if (showCustomOnly && !node.isCustom) {
            return false;
        }
        if (node.type === "group") {
            return showGroups;
        }
        const relationshipType = node.relationshipTypes[userId];
        return relationshipFilters[relationshipType as keyof typeof relationshipFilters];
    });
};

const calculateNodeMetrics = (project3DTo2D: (node: {
    x: number;
    y: number;
    z: number
}, centerX: number, centerY: number) => {
    x: number;
    y: number;
    z: number
}, node: NetworkNode, centerX: number, centerY: number, filteredNodes: NetworkNode[], clickX: number, clickY: number) => {
    const pos = project3DTo2D(node, centerX, centerY);
    const size = node.id === filteredNodes[0].id ? 24 : node.type === "group" ? 20 : 16;
    const distance = Math.sqrt(Math.pow(clickX - pos.x, 2) + Math.pow(clickY - pos.y, 2));
    return {pos, size, distance};
};

const calculateMouseReference = (canvas: HTMLCanvasElement, e: React.MouseEvent, cameraOffset: {
    x: number;
    y: number
}) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const centerX = canvas.width / 2 + cameraOffset.x;
    const centerY = canvas.height / 2 + cameraOffset.y;

    return {clickX, clickY, centerX, centerY};
};

export function NetworkVisualization({userId}: { userId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<NetworkNode[]>([]);
    const [temporaryRelationships, setTemporaryRelationships] = useState<TemporaryRelationship[]>([]);
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
    const [isNodeEditOpen, setIsNodeEditOpen] = useState(false);
    const [isEdgeEditOpen, setIsEdgeEditOpen] = useState(false);
    const [selectedEdge, setSelectedEdge] = useState<any>(null);
    const [clickCount, setClickCount] = useState(0);
    const [lastClickedNode, setLastClickedNode] = useState<string | null>(null);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState({x: 0, y: 0});
    const [cameraOffset, setCameraOffset] = useState({x: 0, y: 0});
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingNode, setIsDraggingNode] = useState(false);
    const [draggedNode, setDraggedNode] = useState<NetworkNode | null>(null);
    const [lastMouse, setLastMouse] = useState({x: 0, y: 0});
    const [canvasSize, setCanvasSize] = useState({width: 1920, height: 1080});
    const [maxNodes, setMaxNodes] = useState(50);
    const [showGroups, setShowGroups] = useState(true);
    const [showCustomOnly, setShowCustomOnly] = useState(false);
    const [showLegend, setShowLegend] = useState(true);
    const [customTypesForLegend, setCustomTypesForLegend] = useState<any[]>([]);
    const [manualPositionMode, setManualPositionMode] = useState(false);
    const [manualPositions, setManualPositions] = useState<Map<string, { x: number, y: number, z: number }>>(new Map());
    const [hideEdgeEditWarning, setHideEdgeEditWarning] = useState(false);
    const [relationshipFilters, setRelationshipFilters] = useState({
        friend: true,
        partner: true,
        family: true,
        colleague: true,
        acquaintance: true,
    });
    const [stars, setStars] = useState<Star[]>([]);
    const [nodeSpacing, setNodeSpacing] = useState(150);
    const [autoRotate, setAutoRotate] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
    const [isPanning, setIsPanning] = useState(false);
    const [mouseDownPosition, setMouseDownPosition] = useState<{ x: number, y: number } | null>(null);
    const [nodeSize, setNodeSize] = useState(16);
    const [edgeThickness, setEdgeThickness] = useState(2);
    const [showEdgeLabels, setShowEdgeLabels] = useState(true);
    const [nodeColors, setNodeColors] = useState({
        user: '#8b5cf6',
        group: '#10b981',
        external: '#6b7280'
    });
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);

    // Calculate visible node types and relationship types based on current map state
    const visibleLegendData = useMemo(() => {
        const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly);

        const visibleNodeTypes = new Set<string>();
        const visibleDefaultTypes = new Set<string>();
        const visibleCustomTypes = new Map<string, any>();
        const visibleExternalNodes = new Map<string, { color: string, label: string }>();

        // Analyze visible nodes
        filteredNodes.forEach((node, index) => {
            if (index === 0) {
                visibleNodeTypes.add('user');
            } else if (node.type === 'group') {
                visibleNodeTypes.add('group');
            } else if (node.type === 'external') {
                visibleNodeTypes.add('external');

                // Track external nodes by their custom type
                const edges = node.relationships?.[userId] || [];
                edges.forEach((edge: any) => {
                    if (edge.isExternal && edge.type) {
                        const customType = customTypesForLegend.find(t => t.id === edge.type);
                        if (customType) {
                            visibleExternalNodes.set(customType.id, {
                                color: customType.node_color || node.node_color || nodeColors.external,
                                label: customType.label
                            });
                        }
                    } else if (node.node_color) {
                        // Fallback: use node's own color
                        visibleExternalNodes.set(node.id, {
                            color: node.node_color,
                            label: node.display_name
                        });
                    }
                });
            } else {
                visibleNodeTypes.add('user');
            }

            // Get relationship types for this node
            const relationshipType = node.relationshipTypes?.[userId];
            if (relationshipType && ['friend', 'partner', 'family', 'colleague', 'acquaintance'].includes(relationshipType)) {
                visibleDefaultTypes.add(relationshipType);
            }

            // Get custom relationship types from edges
            Object.values(node.relationships || {}).forEach((edges: any) => {
                edges.forEach((edge: any) => {
                    if (edge.isCustom && edge.type) {
                        // Find the custom type details
                        const customType = customTypesForLegend.find(t => t.id === edge.type);
                        if (customType) {
                            visibleCustomTypes.set(customType.id, customType);
                        }
                    }
                });
            });
        });

        return {
            nodeTypes: visibleNodeTypes,
            defaultTypes: visibleDefaultTypes,
            customTypes: Array.from(visibleCustomTypes.values()),
            externalNodes: Array.from(visibleExternalNodes.values())
        };
    }, [nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly, customTypesForLegend, nodeColors.external]);

    useEffect(() => {
        async function loadCustomTypesForLegend() {
            const supabase = createBrowserClient();
            const {data} = await supabase
                .from("custom_relationship_types")
                .select("*")
                .or(`is_global.eq.true,user_id.eq.${userId}`)
                .order("label");

            if (data) {
                setCustomTypesForLegend(data);
            }
        }

        loadCustomTypesForLegend();
    }, [userId]);

    const loadNetworkData = useCallback(async () => {
        const supabase = createBrowserClient();

        const [relationshipsResult, followsResult, friendshipsResult, groupsResult, customRelationshipsResult, externalProfilesResult, externalRelationshipsResult, manualRelationshipsResult] = await Promise.all([
            supabase
                .from("relationships")
                .select(`
                    id,
                    user_id,
                    related_user_id,
                    relationship_type,
                    status
                `)
                .or(`user_id.eq.${userId},related_user_id.eq.${userId}`)
                .eq("status", "accepted")
                .limit(maxNodes),
            supabase
                .from("follows")
                .select(`
                    id,
                    follower_id,
                    following_id
                `)
                .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
                .limit(maxNodes),
            supabase
                .from("friendships")
                .select(`
                    id,
                    user_id,
                    friend_id,
                    status
                `)
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                .eq("status", "accepted")
                .limit(maxNodes),
            showGroups
                ? supabase.from("group_members").select("group_id, groups(id, name)").eq("user_id", userId).limit(10)
                : Promise.resolve({data: []}),
            supabase
                .from("user_relationships")
                .select(`
                    *,
                    initiator_profile:profiles!user_relationships_initiator_id_fkey(id, username, display_name, avatar_url),
                    recipient_profile:profiles!user_relationships_recipient_id_fkey(id, username, display_name, avatar_url),
                    custom_relationship_type:custom_relationship_types(id, label, node_color, edge_color, line_style)
                `)
                .or(`initiator_id.eq.${userId},recipient_id.eq.${userId}`)
                .eq("status", "accepted")
                .limit(maxNodes),
            supabase
                .from("external_profiles")
                .select("*")
                .eq("user_id", userId)
                .eq("is_visible_on_map", true),
            supabase
                .from("external_relationships")
                .select(`
                    *,
                    external_profile:external_profiles(*),
                    custom_relationship_type:custom_relationship_types(id, label, node_color, edge_color, line_style)
                `)
                .eq("user_id", userId),
            supabase
                .from("custom_relationships")
                .select(`
                    *,
                    from_profile:external_profiles!custom_relationships_from_profile_id_fkey(*),
                    to_profile:external_profiles!custom_relationships_to_profile_id_fkey(*),
                    custom_relationship_type:custom_relationship_types(id, label, node_color, edge_color, line_style)
                `)
                .eq("user_id", userId)
                .eq("is_visible_on_map", true),
        ]);

        const relationships: Relationship[] = relationshipsResult.data || [];
        const follows: Follow[] = followsResult.data || [];
        const friendships: Friendship[] = friendshipsResult.data || [];
        const userGroups: GroupMember[] = groupsResult.data || [];
        const customRelationships: any[] = customRelationshipsResult.data || [];
        const externalProfiles: any[] = externalProfilesResult.data || [];
        const externalRelationships: any[] = externalRelationshipsResult.data || [];
        const manualRelationships: any[] = manualRelationshipsResult.data || [];

        const allConnections = new Map<string, any>();
        const connectionRelationships = new Map<string, RelationshipEdge[]>();
        const manualConnectionsMap = new Map<string, boolean>();

        // Fetch all unique user IDs from all relationship sources
        const relatedUserIds = new Set<string>();
        relationships.forEach((rel: Relationship) => {
            if (rel.user_id !== userId) relatedUserIds.add(rel.user_id);
            if (rel.related_user_id !== userId) relatedUserIds.add(rel.related_user_id);
        });
        follows.forEach((follow: Follow) => {
            if (follow.follower_id !== userId) relatedUserIds.add(follow.follower_id);
            if (follow.following_id !== userId) relatedUserIds.add(follow.following_id);
        });
        friendships.forEach((friendship: Friendship) => {
            if (friendship.user_id !== userId) relatedUserIds.add(friendship.user_id);
            if (friendship.friend_id !== userId) relatedUserIds.add(friendship.friend_id);
        });

        // Fetch profiles for all related users
        let profilesMap = new Map<string, Profile>();
        if (relatedUserIds.size > 0) {
            const {data: profilesData} = await supabase
                .from("profiles")
                .select("id, username, display_name, avatar_url")
                .in("id", Array.from(relatedUserIds));

            if (profilesData) {
                profilesData.forEach((profile: Profile) => {
                    profilesMap.set(profile.id, profile);
                });
            }
        }

        // Process relationships with fetched profiles
        relationships.forEach((rel: Relationship) => {
            const connectedUserId = rel.user_id === userId ? rel.related_user_id : rel.user_id;
            const connectedProfile = profilesMap.get(connectedUserId);

            if (connectedProfile) {
                allConnections.set(connectedUserId, {
                    id: connectedProfile.id,
                    username: connectedProfile.username,
                    display_name: connectedProfile.display_name,
                    avatar_url: connectedProfile.avatar_url,
                    relationship_type: rel.relationship_type || "friend",
                    type: "user",
                });
            }
        });

        // Process follows with fetched profiles
        follows.forEach((follow: Follow) => {
            const connectedUserId = follow.follower_id === userId ? follow.following_id : follow.follower_id;
            const connectedProfile = profilesMap.get(connectedUserId);

            if (connectedProfile && !allConnections.has(connectedUserId)) {
                allConnections.set(connectedUserId, {
                    id: connectedProfile.id,
                    username: connectedProfile.username,
                    display_name: connectedProfile.display_name,
                    avatar_url: connectedProfile.avatar_url,
                    relationship_type: "acquaintance",
                    type: "user",
                });
            }
        });

        // Process friendships with fetched profiles
        friendships.forEach((friendship: Friendship) => {
            const connectedUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
            const connectedProfile = profilesMap.get(connectedUserId);

            if (connectedProfile && !allConnections.has(connectedUserId)) {
                allConnections.set(connectedUserId, {
                    id: connectedProfile.id,
                    username: connectedProfile.username,
                    display_name: connectedProfile.display_name,
                    avatar_url: connectedProfile.avatar_url,
                    relationship_type: "friend",
                    type: "user",
                });
            }
        });

        // Process custom relationships
        customRelationships.forEach((rel: any) => {
            const isInitiator = rel.initiator_id === userId;
            const connectedUserId = isInitiator ? rel.recipient_id : rel.initiator_id;
            const profile = isInitiator ? rel.recipient_profile : rel.initiator_profile;

            if (profile) {
                // Add to connections if not already there
                if (!allConnections.has(connectedUserId)) {
                    allConnections.set(connectedUserId, {
                        ...profile,
                        relationship_type: rel.default_type || "other",
                        type: "user",
                    });
                }

                // Add relationship edge
                const edges = connectionRelationships.get(connectedUserId) || [];
                const edge: RelationshipEdge = {
                    type: rel.custom_relationship_type ? rel.custom_relationship_type.id : rel.default_type,
                    label: rel.custom_relationship_type ? rel.custom_relationship_type.label : (rel.default_type || "Connection"),
                    nodeColor: rel.custom_relationship_type ? rel.custom_relationship_type.node_color : "#8b5cf6",
                    edgeColor: rel.custom_relationship_type ? rel.custom_relationship_type.edge_color : "#a855f7",
                    lineStyle: rel.custom_relationship_type ? rel.custom_relationship_type.line_style : "solid",
                    isCustom: !!rel.custom_relationship_type
                };
                edges.push(edge);
                connectionRelationships.set(connectedUserId, edges);
            }
        });

        // Process external relationships
        externalRelationships.forEach((rel: any) => {
            const externalProfile = rel.external_profile;
            if (externalProfile) {
                const externalId = `external-${externalProfile.id}`;

                // Add to connections if not already there
                if (!allConnections.has(externalId)) {
                    allConnections.set(externalId, {
                        id: externalId,
                        username: externalProfile.display_name,
                        display_name: externalProfile.display_name,
                        avatar_url: null,
                        relationship_type: rel.default_type || "acquaintance",
                        type: "external",
                        node_color: externalProfile.node_color,
                    });
                }

                // Mark as custom if flagged
                if (rel.is_custom) {
                    manualConnectionsMap.set(externalId, true);
                }

                // Add relationship edge
                const edges = connectionRelationships.get(externalId) || [];
                const edge: RelationshipEdge = {
                    type: rel.custom_relationship_type ? rel.custom_relationship_type.id : rel.default_type,
                    label: rel.custom_relationship_type ? rel.custom_relationship_type.label : (rel.default_type ? rel.default_type.charAt(0).toUpperCase() + rel.default_type.slice(1) : "Connection"),
                    nodeColor: rel.custom_relationship_type ? rel.custom_relationship_type.node_color : externalProfile.node_color,
                    edgeColor: rel.custom_relationship_type ? rel.custom_relationship_type.edge_color : externalProfile.node_color,
                    lineStyle: rel.custom_relationship_type ? rel.custom_relationship_type.line_style : "solid",
                    isCustom: !!rel.custom_relationship_type,
                    isExternal: true, // Mark as external/editable
                    isPersisted: true, // This is from DB, so it's persisted
                    relationshipId: rel.id // Store the external_relationship ID
                };
                edges.push(edge);
                connectionRelationships.set(externalId, edges);
            }
        });

        // Process custom relationships between external profiles
        manualRelationships.forEach((rel: any) => {
            const fromProfile = rel.from_profile;
            const toProfile = rel.to_profile;

            if (fromProfile && toProfile) {
                const fromId = `external-${fromProfile.id}`;
                const toId = `external-${toProfile.id}`;

                // Add both profiles to connections if not already there
                if (!allConnections.has(fromId)) {
                    allConnections.set(fromId, {
                        id: fromId,
                        username: fromProfile.display_name,
                        display_name: fromProfile.display_name,
                        avatar_url: null,
                        relationship_type: "acquaintance",
                        type: "external",
                        node_color: fromProfile.node_color,
                    });
                }

                if (!allConnections.has(toId)) {
                    allConnections.set(toId, {
                        id: toId,
                        username: toProfile.display_name,
                        display_name: toProfile.display_name,
                        avatar_url: null,
                        relationship_type: "acquaintance",
                        type: "external",
                        node_color: toProfile.node_color,
                    });
                }

                // Mark both as custom connections
                manualConnectionsMap.set(fromId, true);
                manualConnectionsMap.set(toId, true);

                // Create bidirectional relationship edges
                const fromEdges = connectionRelationships.get(toId) || [];
                const toEdges = connectionRelationships.get(fromId) || [];

                const edge: RelationshipEdge = {
                    type: rel.custom_relationship_type ? rel.custom_relationship_type.id : rel.default_type,
                    label: rel.label || (rel.custom_relationship_type ? rel.custom_relationship_type.label : (rel.default_type ? rel.default_type.charAt(0).toUpperCase() + rel.default_type.slice(1) : "Connection")),
                    nodeColor: rel.custom_relationship_type ? rel.custom_relationship_type.node_color : "#6b7280",
                    edgeColor: rel.custom_relationship_type ? rel.custom_relationship_type.edge_color : "#6b7280",
                    lineStyle: rel.custom_relationship_type ? rel.custom_relationship_type.line_style : "solid",
                    isCustom: !!rel.custom_relationship_type,
                    isExternal: true, // Mark as external/editable (custom relationship)
                    isPersisted: true, // This is from DB, so it's persisted
                    relationshipId: rel.id // Store the custom_relationship ID
                };

                fromEdges.push(edge);
                toEdges.push(edge);
                connectionRelationships.set(toId, fromEdges);
                connectionRelationships.set(fromId, toEdges);

                // Add connections between the two external profiles
                const fromConn = allConnections.get(fromId);
                const toConn = allConnections.get(toId);
                if (fromConn && !fromConn.connections) fromConn.connections = [];
                if (toConn && !toConn.connections) toConn.connections = [];
                if (fromConn && !fromConn.connections.includes(toId)) fromConn.connections.push(toId);
                if (toConn && !toConn.connections.includes(fromId)) toConn.connections.push(fromId);
            }
        });

        // Process temporary relationships (frontend-only, not persisted to DB)
        temporaryRelationships.forEach((tempRel: TemporaryRelationship) => {
            // Fetch custom type data if needed
            const customType = customTypesForLegend.find(t => t.id === tempRel.relationship_type_id);

            if (tempRel.external_profile_id) {
                // User-to-external temporary relationship
                const externalId = `external-${tempRel.external_profile_id}`;
                const externalProfile = externalProfiles.find(p => p.id === tempRel.external_profile_id);

                if (externalProfile) {
                    // Add to connections if not already there
                    if (!allConnections.has(externalId)) {
                        allConnections.set(externalId, {
                            id: externalId,
                            username: externalProfile.display_name,
                            display_name: externalProfile.display_name,
                            avatar_url: null,
                            relationship_type: tempRel.default_type || "acquaintance",
                            type: "external",
                            node_color: externalProfile.node_color,
                        });
                    }

                    // Add temporary relationship edge
                    const edges = connectionRelationships.get(externalId) || [];
                    const edge: RelationshipEdge = {
                        type: customType ? customType.id : tempRel.default_type || "acquaintance",
                        label: customType ? customType.label : (tempRel.default_type ? tempRel.default_type.charAt(0).toUpperCase() + tempRel.default_type.slice(1) : "Connection"),
                        nodeColor: customType ? customType.node_color : externalProfile.node_color,
                        edgeColor: customType ? customType.edge_color : externalProfile.node_color,
                        lineStyle: customType ? customType.line_style : "solid",
                        isCustom: !!customType,
                        isExternal: true,
                        isPersisted: false, // Temporary relationship, not persisted
                        relationshipId: tempRel.id
                    };
                    edges.push(edge);
                    connectionRelationships.set(externalId, edges);
                }
            } else if (tempRel.from_profile_id && tempRel.to_profile_id) {
                // External-to-external temporary relationship
                const fromId = `external-${tempRel.from_profile_id}`;
                const toId = `external-${tempRel.to_profile_id}`;
                const fromProfile = externalProfiles.find(p => p.id === tempRel.from_profile_id);
                const toProfile = externalProfiles.find(p => p.id === tempRel.to_profile_id);

                if (fromProfile && toProfile) {
                    // Add both profiles to connections if not already there
                    if (!allConnections.has(fromId)) {
                        allConnections.set(fromId, {
                            id: fromId,
                            username: fromProfile.display_name,
                            display_name: fromProfile.display_name,
                            avatar_url: null,
                            relationship_type: "acquaintance",
                            type: "external",
                            node_color: fromProfile.node_color,
                        });
                    }

                    if (!allConnections.has(toId)) {
                        allConnections.set(toId, {
                            id: toId,
                            username: toProfile.display_name,
                            display_name: toProfile.display_name,
                            avatar_url: null,
                            relationship_type: "acquaintance",
                            type: "external",
                            node_color: toProfile.node_color,
                        });
                    }

                    // Create bidirectional temporary relationship edges
                    const fromEdges = connectionRelationships.get(toId) || [];
                    const toEdges = connectionRelationships.get(fromId) || [];

                    const edge: RelationshipEdge = {
                        type: customType ? customType.id : tempRel.default_type || "acquaintance",
                        label: tempRel.label || (customType ? customType.label : (tempRel.default_type ? tempRel.default_type.charAt(0).toUpperCase() + tempRel.default_type.slice(1) : "Connection")),
                        nodeColor: customType ? customType.node_color : "#6b7280",
                        edgeColor: customType ? customType.edge_color : "#6b7280",
                        lineStyle: customType ? customType.line_style : "solid",
                        isCustom: !!customType,
                        isExternal: true,
                        isPersisted: false, // Temporary relationship, not persisted
                        relationshipId: tempRel.id
                    };

                    fromEdges.push(edge);
                    toEdges.push(edge);
                    connectionRelationships.set(toId, fromEdges);
                    connectionRelationships.set(fromId, toEdges);

                    // Add connections between the two external profiles
                    const fromConn = allConnections.get(fromId);
                    const toConn = allConnections.get(toId);
                    if (fromConn && !fromConn.connections) fromConn.connections = [];
                    if (toConn && !toConn.connections) toConn.connections = [];
                    if (fromConn && !fromConn.connections.includes(toId)) fromConn.connections.push(toId);
                    if (toConn && !toConn.connections.includes(fromId)) toConn.connections.push(fromId);
                }
            }
        });

        if (allConnections.size === 0 && userGroups.length === 0) {
            return;
        }

        const {data: currentUser} = await supabase.from("profiles").select("*").eq("id", userId).single();

        if (!currentUser) {
            return;
        }

        const networkNodes: NetworkNode[] = [];

        const centerNode: NetworkNode = {
            id: currentUser.id,
            username: currentUser.username,
            display_name: currentUser.display_name || currentUser.username,
            avatar_url: currentUser.avatar_url,
            x: 0,
            y: 0,
            z: 0,
            connections: Array.from(allConnections.keys()),
            relationshipTypes: {},
            relationships: {},
            type: "user",
        };
        networkNodes.push(centerNode);

        const radius = nodeSpacing;
        const connectionsArray = Array.from(allConnections.entries());
        connectionsArray.forEach(([connId, connProfile], index) => {
            const angle = (index / connectionsArray.length) * Math.PI * 2;
            const elevation = (Math.sin(index * 0.5) * 0.5 - 0.25) * Math.PI;

            const node: NetworkNode = {
                id: connId,
                username: connProfile.username,
                display_name: connProfile.display_name || connProfile.username,
                avatar_url: connProfile.avatar_url,
                x: Math.cos(angle) * Math.cos(elevation) * radius,
                y: Math.sin(elevation) * radius,
                z: Math.sin(angle) * Math.cos(elevation) * radius,
                connections: [userId],
                relationshipTypes: {[userId]: connProfile.relationship_type},
                relationships: {[userId]: connectionRelationships.get(connId) || []},
                type: connProfile.type || "user",
                isCustom: manualConnectionsMap.has(connId),
                node_color: connProfile.node_color, // Pass through node_color for external profiles
            };
            networkNodes.push(node);
        });

        if (showGroups && userGroups.length > 0) {
            const groupRadius = radius * 1.3;
            userGroups.forEach((groupMember: GroupMember, index: number) => {
                if (groupMember.groups) {
                    const angle = (index / userGroups.length) * Math.PI * 2;
                    const groupNode: NetworkNode = {
                        id: `group-${groupMember.groups.id}`,
                        username: groupMember.groups.name,
                        display_name: groupMember.groups.name,
                        x: Math.cos(angle) * groupRadius,
                        y: 0,
                        z: Math.sin(angle) * groupRadius,
                        connections: [userId],
                        relationshipTypes: {[userId]: "group"},
                        relationships: {},
                        type: "group",
                        groupData: {
                            name: groupMember.groups.name,
                            member_count: 0,
                        },
                    };
                    networkNodes.push(groupNode);
                    centerNode.connections.push(groupNode.id);
                }
            });
        }

        const connectedUserIds = Array.from(allConnections.keys());
        // Filter out external profile IDs (they start with "external-") for relationships query
        const realUserIds = connectedUserIds.filter(id => !id.startsWith("external-") && !id.startsWith("group-"));
        if (realUserIds.length > 1) {
            const {data: secondDegree} = await supabase
                .from("relationships")
                .select("user_id, related_user_id, relationship_type")
                .in("user_id", realUserIds)
                .in("related_user_id", realUserIds)
                .eq("status", "accepted");

            if (secondDegree && secondDegree.length > 0) {
                secondDegree.forEach((rel: Relationship) => {
                    const fromNode = networkNodes.find((n) => n.id === rel.user_id);
                    const toNode = networkNodes.find((n) => n.id === rel.related_user_id);

                    if (fromNode && toNode && fromNode.id !== toNode.id) {
                        if (!fromNode.connections.includes(rel.related_user_id)) {
                            fromNode.connections.push(rel.related_user_id);
                        }
                        fromNode.relationshipTypes[rel.related_user_id] = rel.relationship_type;
                    }
                });
            }
        }

        setNodes(networkNodes);
    }, [userId, maxNodes, showGroups, nodeSpacing]);

    const project3DTo2D = useCallback((node: { x: number; y: number; z: number }, centerX: number, centerY: number) => {
        const cosX = Math.cos(rotation.x);
        const sinX = Math.sin(rotation.x);
        const cosY = Math.cos(rotation.y);
        const sinY = Math.sin(rotation.y);

        let x = node.x;
        const y = node.y * cosX - node.z * sinX;
        let z = node.y * sinX + node.z * cosX;

        const tempX = x;
        x = x * cosY + z * sinY;
        z = -tempX * sinY + z * cosY;

        const perspective = 300;
        const scale = zoom * (perspective / (perspective + z));

        return {
            x: centerX + x * scale,
            y: centerY + y * scale,
            z: z,
        };
    }, [rotation.x, rotation.y, zoom]);

    const startAnimation = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext("2d");
        if (!ctx) {
            return;
        }

        const animate = () => {
            timeRef.current += 0.01;

            if (autoRotate) {
                setRotation((prev) => ({
                    x: prev.x,
                    y: prev.y + 0.005,
                }));
            }

            const bgGradient = ctx.createRadialGradient(
                canvas.width / 2,
                canvas.height / 2,
                0,
                canvas.width / 2,
                canvas.height / 2,
                Math.max(canvas.width, canvas.height) / 1.5,
            );
            bgGradient.addColorStop(0, "#0f0820");
            bgGradient.addColorStop(0.3, "#1a0f2e");
            bgGradient.addColorStop(0.6, "#0d0618");
            bgGradient.addColorStop(1, "#000000");
            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2 + cameraOffset.x;
            const centerY = canvas.height / 2 + cameraOffset.y;

            // Draw multiple nebula clouds
            const nebulaClouds = [
                {
                    x: centerX - 200,
                    y: centerY - 150,
                    radius: 300,
                    color1: "rgba(139, 92, 246, 0.08)",
                    color2: "rgba(99, 102, 241, 0.03)",
                },
                {
                    x: centerX + 250,
                    y: centerY + 100,
                    radius: 350,
                    color1: "rgba(59, 130, 246, 0.06)",
                    color2: "rgba(37, 99, 235, 0.02)",
                },
                {
                    x: centerX - 100,
                    y: centerY + 200,
                    radius: 280,
                    color1: "rgba(168, 85, 247, 0.07)",
                    color2: "rgba(147, 51, 234, 0.03)",
                },
                {
                    x: centerX + 150,
                    y: centerY - 180,
                    radius: 320,
                    color1: "rgba(79, 70, 229, 0.05)",
                    color2: "rgba(67, 56, 202, 0.02)",
                },
            ];

            nebulaClouds.forEach((cloud) => {
                const nebulaGradient = ctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
                nebulaGradient.addColorStop(0, cloud.color1);
                nebulaGradient.addColorStop(0.5, cloud.color2);
                nebulaGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = nebulaGradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            });

            stars.forEach((star) => {
                const pos = project3DTo2D(star, centerX, centerY);
                const twinkle = Math.sin(timeRef.current * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
                const opacity = star.opacity * twinkle;

                // Create glow effect for stars
                const size = star.size;
                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size * 2.5);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                gradient.addColorStop(0.3, `rgba(139, 92, 246, ${opacity * 0.4})`); // Purple glow
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size * 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fill();
            });

            const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly);

            const drawnConnections = new Set<string>();

            filteredNodes.forEach((node) => {
                node.connections.forEach((connId) => {
                    const connNode = filteredNodes.find((n) => n.id === connId);
                    if (connNode) {
                        const connectionKey = [node.id, connId].sort().join("-");
                        if (drawnConnections.has(connectionKey)) {
                            return;
                        }
                        drawnConnections.add(connectionKey);

                        const from = project3DTo2D(node, centerX, centerY);
                        const to = project3DTo2D(connNode, centerX, centerY);

                        // Get all relationship edges for this connection
                        let relationships = node.relationships[connId] || [];
                        if (relationships.length === 0 && connNode.relationships[node.id]) {
                            relationships = connNode.relationships[node.id];
                        }

                        // Fallback to old relationship types if no custom relationships exist
                        if (relationships.length === 0) {
                            let relationshipType = node.relationshipTypes[connId];
                            if (!relationshipType && connNode.relationshipTypes[node.id]) {
                                relationshipType = connNode.relationshipTypes[node.id];
                            }

                            const defaultColors = {
                                friend: {
                                    start: "rgba(168, 85, 247, 0.6)",
                                    end: "rgba(139, 92, 246, 0.4)",
                                    glow: "#A855F7"
                                },
                                partner: {
                                    start: "rgba(236, 72, 153, 0.6)",
                                    end: "rgba(219, 39, 119, 0.4)",
                                    glow: "#EC4899"
                                },
                                family: {
                                    start: "rgba(34, 197, 94, 0.6)",
                                    end: "rgba(22, 163, 74, 0.4)",
                                    glow: "#22C55E"
                                },
                                colleague: {
                                    start: "rgba(96, 165, 250, 0.6)",
                                    end: "rgba(59, 130, 246, 0.4)",
                                    glow: "#60A5FA"
                                },
                                acquaintance: {
                                    start: "rgba(156, 163, 175, 0.5)",
                                    end: "rgba(107, 114, 128, 0.3)",
                                    glow: "#9CA3AF"
                                },
                                group: {
                                    start: "rgba(251, 191, 36, 0.6)",
                                    end: "rgba(245, 158, 11, 0.4)",
                                    glow: "#FBBF24"
                                },
                            };

                            relationships = [{
                                type: relationshipType || 'acquaintance',
                                label: relationshipType ? relationshipType.charAt(0).toUpperCase() + relationshipType.slice(1) : 'Acquaintance',
                                nodeColor: '',
                                edgeColor: '',
                                lineStyle: 'solid',
                                isCustom: false
                            }];
                        }

                        // Calculate offset for multiple edges
                        const edgeCount = relationships.length;
                        const offsetDistance = 8; // pixels between parallel lines

                        relationships.forEach((relationship, edgeIndex) => {
                            // Calculate perpendicular offset for multiple edges
                            let offsetX = 0;
                            let offsetY = 0;

                            if (edgeCount > 1) {
                                // Calculate perpendicular vector
                                const dx = to.x - from.x;
                                const dy = to.y - from.y;
                                const length = Math.sqrt(dx * dx + dy * dy);
                                const perpX = -dy / length;
                                const perpY = dx / length;

                                // Center the edges around the direct line
                                const totalWidth = (edgeCount - 1) * offsetDistance;
                                const offset = (edgeIndex * offsetDistance) - (totalWidth / 2);

                                offsetX = perpX * offset;
                                offsetY = perpY * offset;
                            }

                            const fromX = from.x + offsetX;
                            const fromY = from.y + offsetY;
                            const toX = to.x + offsetX;
                            const toY = to.y + offsetY;

                            // Determine edge color
                            let edgeColor;
                            let glowColor;

                            if (relationship.isCustom && relationship.edgeColor) {
                                // Use custom edge color
                                edgeColor = relationship.edgeColor;
                                glowColor = relationship.edgeColor;
                            } else {
                                // Use default colors based on relationship type
                                const defaultColors = {
                                    friend: {
                                        start: "rgba(168, 85, 247, 0.6)",
                                        end: "rgba(139, 92, 246, 0.4)",
                                        glow: "#A855F7"
                                    },
                                    partner: {
                                        start: "rgba(236, 72, 153, 0.6)",
                                        end: "rgba(219, 39, 119, 0.4)",
                                        glow: "#EC4899"
                                    },
                                    family: {
                                        start: "rgba(34, 197, 94, 0.6)",
                                        end: "rgba(22, 163, 74, 0.4)",
                                        glow: "#22C55E"
                                    },
                                    colleague: {
                                        start: "rgba(96, 165, 250, 0.6)",
                                        end: "rgba(59, 130, 246, 0.4)",
                                        glow: "#60A5FA"
                                    },
                                    acquaintance: {
                                        start: "rgba(156, 163, 175, 0.5)",
                                        end: "rgba(107, 114, 128, 0.3)",
                                        glow: "#9CA3AF"
                                    },
                                    group: {
                                        start: "rgba(251, 191, 36, 0.6)",
                                        end: "rgba(245, 158, 11, 0.4)",
                                        glow: "#FBBF24"
                                    },
                                };
                                const color = defaultColors[relationship.type as keyof typeof defaultColors] || defaultColors.acquaintance;
                                edgeColor = color.start;
                                glowColor = color.glow;
                            }

                            // Draw glow
                            ctx.shadowBlur = 8;
                            ctx.shadowColor = glowColor;

                            // Create gradient for edge
                            const gradient = ctx.createLinearGradient(fromX, fromY, toX, toY);
                            if (relationship.isCustom && relationship.edgeColor) {
                                // Solid color for custom edges
                                const hexToRgba = (hex: string, alpha: number) => {
                                    const r = parseInt(hex.slice(1, 3), 16);
                                    const g = parseInt(hex.slice(3, 5), 16);
                                    const b = parseInt(hex.slice(5, 7), 16);
                                    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
                                };
                                gradient.addColorStop(0, hexToRgba(relationship.edgeColor, 0.6));
                                gradient.addColorStop(1, hexToRgba(relationship.edgeColor, 0.4));
                            } else {
                                gradient.addColorStop(0, edgeColor);
                                gradient.addColorStop(1, edgeColor.replace('0.6', '0.4'));
                            }

                            ctx.strokeStyle = gradient;
                            ctx.lineWidth = edgeThickness;
                            ctx.lineCap = "round";

                            // Apply line style
                            const lineStyle = relationship.lineStyle || 'solid';
                            if (lineStyle === 'dashed') {
                                ctx.setLineDash([10, 5]);
                            } else if (lineStyle === 'dotted') {
                                ctx.setLineDash([2, 4]);
                            } else if (lineStyle === 'double') {
                                // Draw two parallel lines
                                ctx.setLineDash([]);
                                const perpX = -(toY - fromY) / Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
                                const perpY = (toX - fromX) / Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
                                const offset = 2;

                                ctx.beginPath();
                                ctx.moveTo(fromX + perpX * offset, fromY + perpY * offset);
                                ctx.lineTo(toX + perpX * offset, toY + perpY * offset);
                                ctx.stroke();

                                ctx.beginPath();
                                ctx.moveTo(fromX - perpX * offset, fromY - perpY * offset);
                                ctx.lineTo(toX - perpX * offset, toY - perpY * offset);
                                ctx.stroke();
                            } else if (lineStyle === 'wavy') {
                                // Draw wavy line
                                ctx.setLineDash([]);
                                const dx = toX - fromX;
                                const dy = toY - fromY;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                const waveCount = Math.floor(distance / 10);
                                const waveAmplitude = 3;

                                ctx.beginPath();
                                ctx.moveTo(fromX, fromY);
                                for (let i = 0; i <= waveCount; i++) {
                                    const t = i / waveCount;
                                    const x = fromX + dx * t;
                                    const y = fromY + dy * t;
                                    const perpOffset = Math.sin(i * Math.PI) * waveAmplitude;
                                    const perpX = -(dy / distance) * perpOffset;
                                    const perpY = (dx / distance) * perpOffset;
                                    ctx.lineTo(x + perpX, y + perpY);
                                }
                                ctx.stroke();
                            } else {
                                // Solid line (default)
                                ctx.setLineDash([]);
                                ctx.beginPath();
                                ctx.moveTo(fromX, fromY);
                                ctx.lineTo(toX, toY);
                                ctx.stroke();
                            }

                            // Reset line dash
                            ctx.setLineDash([]);
                            ctx.shadowBlur = 0;

                            // Draw edge label if enabled and zoomed in enough
                            if (showEdgeLabels && zoom > 1 && relationship.label && relationship.label.toLowerCase() !== "acquaintance") {
                                const midX = (fromX + toX) / 2;
                                const midY = (fromY + toY) / 2;

                                ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
                                ctx.font = "11px sans-serif";
                                const text = relationship.label;
                                const metrics = ctx.measureText(text);
                                const padding = 4;

                                ctx.fillRect(midX - metrics.width / 2 - padding, midY - 8, metrics.width + padding * 2, 16);

                                ctx.fillStyle = "#FFF";
                                ctx.textAlign = "center";
                                ctx.fillText(text, midX, midY + 4);
                            }
                        });
                    }
                });
            });

            filteredNodes.forEach((node, index) => {
                const pos = project3DTo2D(node, centerX, centerY);
                const size = index === 0 ? nodeSize + 10 : node.type === "group" ? nodeSize + 6 : nodeSize;
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = highlightedNodes.has(node.id);

                const relationshipType = node.relationshipTypes[userId];
                const relationshipColors = {
                    friend: {start: "#C084FC", end: "#A855F7", glow: "#A855F7"},
                    partner: {start: "#F9A8D4", end: "#EC4899", glow: "#EC4899"},
                    family: {start: "#86EFAC", end: "#22C55E", glow: "#22C55E"},
                    colleague: {start: "#93C5FD", end: "#3B82F6", glow: "#3B82F6"},
                    acquaintance: {start: "#D1D5DB", end: "#9CA3AF", glow: "#9CA3AF"},
                    group: {start: "#FCD34D", end: "#F59E0B", glow: "#F59E0B"},
                };

                // Determine colors based on node type and relationship
                let colors;
                if (index === 0) {
                    colors = {start: nodeColors.user, end: nodeColors.user, glow: nodeColors.user};
                } else if (node.type === "group") {
                    colors = {start: nodeColors.group, end: nodeColors.group, glow: nodeColors.group};
                } else if (node.type === "external") {
                    // Use custom node color if available, otherwise use default
                    const customColor = node.node_color || nodeColors.external;
                    colors = {start: customColor, end: customColor, glow: customColor};
                } else {
                    const relColor = relationshipColors[relationshipType as keyof typeof relationshipColors] || relationshipColors.acquaintance;
                    colors = relColor;
                }

                const outerGlow = ctx.createRadialGradient(
                    pos.x,
                    pos.y,
                    size * 0.5,
                    pos.x,
                    pos.y,
                    size * (isHighlighted ? 3 : 2),
                );
                outerGlow.addColorStop(0, `${colors.glow}${isHighlighted ? "80" : "40"}`);
                outerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = outerGlow;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size * (isHighlighted ? 3 : 2), 0, Math.PI * 2);
                ctx.fill();

                // Draw node with aura and gradient
                if (isSelected || isHighlighted) {
                    const auraSize = size * (isSelected ? 2.5 : 1.8);
                    const auraGradient = ctx.createRadialGradient(pos.x, pos.y, size, pos.x, pos.y, auraSize);
                    auraGradient.addColorStop(0, colors.glow.replace("1)", "0.4)"));
                    auraGradient.addColorStop(1, "rgba(0, 0, 0, 0)");

                    ctx.fillStyle = auraGradient;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, auraSize, 0, Math.PI * 2);
                    ctx.fill();
                }

                const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, size);
                gradient.addColorStop(0, colors.start);
                gradient.addColorStop(0.7, colors.end);
                gradient.addColorStop(1, `${colors.end}CC`);

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
                ctx.fill();

                // Enhanced border with glow
                if (isSelected || isHighlighted) {
                    ctx.shadowBlur = 20;
                    ctx.shadowColor = colors.glow;
                }
                ctx.strokeStyle = isSelected ? "#FFF" : isHighlighted ? colors.glow : "rgba(255, 255, 255, 0.9)";
                ctx.lineWidth = isSelected ? 3 : isHighlighted ? 2.5 : 2;
                ctx.stroke();
                ctx.shadowBlur = 0;

                // Draw labels with better visibility
                if (index === 0 || zoom > 1.2 || isSelected) {
                    ctx.fillStyle = "#FFF";
                    ctx.font = `${isSelected ? "bold " : ""}14px sans-serif`;
                    ctx.textAlign = "center";
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
                    ctx.fillText(node.display_name, pos.x, pos.y + size + 22);
                    ctx.shadowBlur = 0;
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();
    }, [nodes, zoom, relationshipFilters, stars, autoRotate, cameraOffset.x, cameraOffset.y, hiddenNodes, searchQuery, showGroups, userId, selectedNode?.id, highlightedNodes, project3DTo2D]);

    // Helper function to calculate distance from point to line segment
    const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
        }

        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;

        return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning || isDraggingNode) {
            return;
        }

        // Check if this was a drag (mouse moved more than 5px)
        if (mouseDownPosition) {
            const deltaX = Math.abs(e.clientX - mouseDownPosition.x);
            const deltaY = Math.abs(e.clientY - mouseDownPosition.y);
            if (deltaX > 5 || deltaY > 5) {
                // This was a drag, not a click
                setMouseDownPosition(null);
                return;
            }
        }
        setMouseDownPosition(null);

        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const {clickX, clickY, centerX, centerY} = calculateMouseReference(canvas, e, cameraOffset);

        const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly);

        // First check if click is on a node (nodes have priority)
        let clickedOnNode = false;
        for (const node of filteredNodes) {
            const {
                pos,
                size,
                distance
            } = calculateNodeMetrics(project3DTo2D, node, centerX, centerY, filteredNodes, clickX, clickY);

            if (distance <= size) {
                clickedOnNode = true;
                break;
            }
        }

        // Only check edges if we didn't click on a node
        if (!clickedOnNode) {
            for (const node of filteredNodes) {
                for (const connId of node.connections) {
                    const connectedNode = filteredNodes.find(n => n.id === connId);
                    if (!connectedNode) continue;

                    const pos1 = project3DTo2D(node, centerX, centerY);
                    const pos2 = project3DTo2D(connectedNode, centerX, centerY);

                    const distToLine = distanceToLineSegment(clickX, clickY, pos1.x, pos1.y, pos2.x, pos2.y);

                    if (distToLine < 10) { // 10px threshold
                        const edges = node.relationships[connId] || [];

                        // Check if edge is persisted (from DB, requires accepted request)
                        // Persisted edges: edges.length === 0 (real network) OR isPersisted === true
                        // Temporary edges: isPersisted === false
                        const isPersistedEdge = edges.length === 0 || edges.some((e: RelationshipEdge) => e.isPersisted);
                        const hasExternalEdge = edges.some((e: RelationshipEdge) => e.isExternal);

                        // Check localStorage preference for hiding warning on persisted edges
                        const hideWarning = localStorage.getItem('hideEdgeEditWarning') === 'true';

                        // Show dialog if: it's temporary/external (always editable) OR it's persisted and warning not hidden
                        if (!isPersistedEdge || !hideWarning) {
                            // Find the external relationship if it exists
                            const externalEdge = edges.find((e: RelationshipEdge) => e.isExternal);

                            setSelectedEdge({
                                fromNodeId: node.id,
                                toNodeId: connId,
                                fromNodeName: node.display_name,
                                toNodeName: connectedNode.display_name,
                                isExternal: hasExternalEdge,
                                isPersisted: isPersistedEdge,
                                relationshipId: externalEdge?.relationshipId,
                            });
                            setIsEdgeEditOpen(true);
                        }
                        return;
                    }
                }
            }
        }

        const sortedNodes = [...filteredNodes].sort((a, b) => {
            const posA = project3DTo2D(a, centerX, centerY);
            const posB = project3DTo2D(b, centerX, centerY);
            return posB.z - posA.z;
        });

        for (const node of sortedNodes) {
            const {
                pos,
                size,
                distance
            } = calculateNodeMetrics(project3DTo2D, node, centerX, centerY, filteredNodes, clickX, clickY);

            if (distance <= size) {
                if (lastClickedNode === node.id && clickCount === 1) {
                    centerNodeInView(node);
                    highlightConnections(node);
                    setClickCount(0);
                    setLastClickedNode(null);
                } else {
                    setSelectedNode(node);
                    setClickCount(1);
                    setLastClickedNode(node.id);
                    setTimeout(() => {
                        setClickCount(0);
                        setLastClickedNode(null);
                    }, 500);
                }
                return;
            }
        }

        setSelectedNode(null);
        setHighlightedNodes(new Set());
    };

    const highlightConnections = (node: NetworkNode) => {
        const connected = new Set<string>([node.id, ...node.connections]);
        setHighlightedNodes(connected);
    };

    const centerNodeInView = (node: NetworkNode) => {
        const targetX = -node.x * zoom;
        const targetY = -node.y * zoom;
        setCameraOffset({x: targetX, y: targetY});
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        // Track mouse position for drag detection
        setMouseDownPosition({x: e.clientX, y: e.clientY});

        const {clickX, clickY, centerX, centerY} = calculateMouseReference(canvas, e, cameraOffset);

        // In manual position mode, allow dragging nodes without modifier key
        // In normal mode, require Ctrl/Cmd key
        if (manualPositionMode || e.ctrlKey || e.metaKey) {
            const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly);

            for (const node of filteredNodes) {
                const {
                    pos,
                    size,
                    distance
                } = calculateNodeMetrics(project3DTo2D, node, centerX, centerY, filteredNodes, clickX, clickY);

                if (distance <= size) {
                    setIsDraggingNode(true);
                    setDraggedNode(node);
                    setLastMouse({x: e.clientX, y: e.clientY});
                    return;
                }
            }
        }

        // Don't allow rotation in manual position mode
        if (manualPositionMode) {
            return;
        }

        if (e.button === 2 || e.shiftKey) {
            setIsPanning(true);
        } else {
            setIsDragging(true);
        }
        setLastMouse({x: e.clientX, y: e.clientY});
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDraggingNode && draggedNode) {
            const deltaX = e.clientX - lastMouse.x;
            const deltaY = e.clientY - lastMouse.y;

            const scale = 1 / zoom;
            const dx = deltaX * scale;
            const dy = deltaY * scale;

            setNodes((prevNodes) =>
                prevNodes.map((node) => {
                    if (node.id === draggedNode.id) {
                        return {
                            ...node,
                            x: node.x + dx,
                            y: node.y + dy,
                            manuallyPositioned: true,
                        };
                    }
                    return node;
                }),
            );

            setDraggedNode((prev) =>
                prev
                    ? {
                        ...prev,
                        x: prev.x + dx,
                        y: prev.y + dy,
                    }
                    : null,
            );

            setLastMouse({x: e.clientX, y: e.clientY});
        } else if (isPanning) {
            const deltaX = e.clientX - lastMouse.x;
            const deltaY = e.clientY - lastMouse.y;
            setCameraOffset((prev) => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY,
            }));
            setLastMouse({x: e.clientX, y: e.clientY});
        } else if (isDragging) {
            const deltaX = e.clientX - lastMouse.x;
            const deltaY = e.clientY - lastMouse.y;

            setRotation((prev) => ({
                x: prev.x + deltaY * 0.01,
                y: prev.y + deltaX * 0.01,
            }));

            setLastMouse({x: e.clientX, y: e.clientY});
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsPanning(false);
        setIsDraggingNode(false);
        setDraggedNode(null);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));
    const handleReset = () => {
        setZoom(1);
        setRotation({x: 0, y: 0});
        setCameraOffset({x: 0, y: 0});
        setSelectedNode(null);
        setHighlightedNodes(new Set());
        setSearchQuery("");
        setHiddenNodes(new Set());
    };

    const toggleNodeVisibility = (nodeId: string) => {
        setHiddenNodes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(nodeId)) {
                newSet.delete(nodeId);
            } else {
                newSet.add(nodeId);
            }
            return newSet;
        });
    };

    const visibleNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters, showCustomOnly);

    const totalConnections = Math.max(0, nodes.length - 1);
    const visibleCount = visibleNodes.length;
    const linkCount = Math.max(0, Math.floor(nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2));

    const handleExportImage = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Export as PNG
        canvas.toBlob((blob) => {
            if (!blob) return;
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `network-map-${new Date().toISOString().split('T')[0]}.png`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        });
    };
    useEffect(() => {
        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const starCount = isMobile ? 100 : 300;
        const newStars: Star[] = [];
        for (let i = 0; i < starCount; i++) {
            newStars.push({
                x: (Math.random() - 0.5) * 2000,
                y: (Math.random() - 0.5) * 2000,
                z: (Math.random() - 0.5) * 2000,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.3,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2,
            });
        }
        setStars(newStars);

        // Load edge warning preference from localStorage
        const savedPreference = localStorage.getItem('hideEdgeEditWarning');
        if (savedPreference === 'true') {
            setHideEdgeEditWarning(true);
        }
    }, []);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                setCanvasSize({
                    width: containerRef.current.clientWidth,
                    height: containerRef.current.clientHeight,
                });
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        loadNetworkData();
    }, [showGroups, maxNodes, nodeSpacing, loadNetworkData]);

    useEffect(() => {
        if (nodes.length > 0 && canvasRef.current) {
            startAnimation();
        }
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [nodes, zoom, rotation, canvasSize, relationshipFilters, stars, startAnimation]);

    return (
        <div className="min-h-screen bg-background pt-16">
            <div ref={containerRef} className="h-[calc(100vh-4rem)] relative">
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    className={`w-full h-full ${manualPositionMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-move'}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={handleCanvasClick}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                />

                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-96">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Search nodes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card/90 backdrop-blur"
                        />
                    </div>
                </div>

                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <CustomRelationshipDialog
                        userId={userId}
                        onRelationshipCreated={loadNetworkData}
                        onTemporaryRelationshipCreated={(tempRel) => {
                            setTemporaryRelationships(prev => [...prev, tempRel]);
                            loadNetworkData(); // Reload to show the temporary relationship
                        }}
                    />

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur" type="button">
                                <SettingsIcon className="h-4 w-4"/>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card/95 backdrop-blur max-w-md">
                            <DialogHeader>
                                <DialogTitle>Network Settings</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="maxNodes">Maximum Nodes: {maxNodes}</Label>
                                    <Slider
                                        id="maxNodes"
                                        min={10}
                                        max={200}
                                        step={10}
                                        value={[maxNodes]}
                                        onValueChange={(value) => setMaxNodes(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">Limit the number of connections
                                        displayed</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nodeSpacing">Node Spacing: {nodeSpacing}px</Label>
                                    <Slider
                                        id="nodeSpacing"
                                        min={150}
                                        max={600}
                                        step={50}
                                        value={[nodeSpacing]}
                                        onValueChange={(value) => setNodeSpacing(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">Adjust distance between nodes</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="showGroups"
                                        checked={showGroups}
                                        onCheckedChange={(checked) => {
                                            const newValue = checked as boolean;
                                            setShowGroups(newValue);
                                            if (newValue) {
                                                setShowCustomOnly(false); // Uncheck Show Custom Relationships Only
                                            }
                                        }}
                                    />
                                    <Label htmlFor="showGroups" className="cursor-pointer">
                                        Show Groups
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="showCustomOnly"
                                        checked={showCustomOnly}
                                        onCheckedChange={(checked) => {
                                            const newValue = checked as boolean;
                                            setShowCustomOnly(newValue);
                                            if (newValue) {
                                                setShowGroups(false); // Uncheck Show Groups
                                            }
                                        }}
                                    />
                                    <Label htmlFor="showCustomOnly" className="cursor-pointer">
                                        Show Custom Relationships Only
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="autoRotate"
                                        checked={autoRotate}
                                        onCheckedChange={(checked) => setAutoRotate(checked as boolean)}
                                    />
                                    <Label htmlFor="autoRotate" className="cursor-pointer">
                                        Auto-Rotate
                                    </Label>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="nodeSize">Node Size: {nodeSize}px</Label>
                                    <Slider
                                        id="nodeSize"
                                        min={8}
                                        max={32}
                                        step={2}
                                        value={[nodeSize]}
                                        onValueChange={(value) => setNodeSize(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">Adjust the size of network nodes</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="edgeThickness">Edge Thickness: {edgeThickness}px</Label>
                                    <Slider
                                        id="edgeThickness"
                                        min={1}
                                        max={8}
                                        step={1}
                                        value={[edgeThickness]}
                                        onValueChange={(value) => setEdgeThickness(value[0])}
                                    />
                                    <p className="text-xs text-muted-foreground">Adjust connection line thickness</p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="showEdgeLabels"
                                        checked={showEdgeLabels}
                                        onCheckedChange={(checked) => setShowEdgeLabels(checked as boolean)}
                                    />
                                    <Label htmlFor="showEdgeLabels" className="cursor-pointer">
                                        Show Relationship Labels
                                    </Label>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="hideEdgeWarning"
                                        checked={hideEdgeEditWarning}
                                        onCheckedChange={(checked) => {
                                            const newValue = checked as boolean;
                                            setHideEdgeEditWarning(newValue);
                                            localStorage.setItem('hideEdgeEditWarning', String(newValue));
                                        }}
                                    />
                                    <Label htmlFor="hideEdgeWarning" className="cursor-pointer">
                                        Hide edge edit warnings
                                    </Label>
                                </div>

                                <div className="space-y-3">
                                    <Label>Node Colors</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label htmlFor="userColor" className="text-xs">Users</Label>
                                            <Input
                                                id="userColor"
                                                type="color"
                                                value={nodeColors.user}
                                                onChange={(e) => setNodeColors({...nodeColors, user: e.target.value})}
                                                className="h-8 w-full"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="groupColor" className="text-xs">Groups</Label>
                                            <Input
                                                id="groupColor"
                                                type="color"
                                                value={nodeColors.group}
                                                onChange={(e) => setNodeColors({...nodeColors, group: e.target.value})}
                                                className="h-8 w-full"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="externalColor" className="text-xs">External</Label>
                                            <Input
                                                id="externalColor"
                                                type="color"
                                                value={nodeColors.external}
                                                onChange={(e) => setNodeColors({
                                                    ...nodeColors,
                                                    external: e.target.value
                                                })}
                                                className="h-8 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Popover>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <PopoverTrigger asChild>
                                        <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur">
                                            <Filter className="h-4 w-4"/>
                                        </Button>
                                    </PopoverTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p>Filter Relationships</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <PopoverContent className="w-64 bg-card/90 backdrop-blur border-royal-purple/20">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm">Filter by Relationship</h4>
                                <div className="space-y-2">
                                    {Object.entries(relationshipFilters).map(([type, enabled]) => (
                                        <div key={type} className="flex items-center gap-2">
                                            <Checkbox
                                                id={type}
                                                checked={enabled}
                                                onCheckedChange={(checked) =>
                                                    setRelationshipFilters({
                                                        ...relationshipFilters,
                                                        [type]: checked as boolean
                                                    })
                                                }
                                            />
                                            <Label htmlFor={type} className="text-sm capitalize cursor-pointer">
                                                {type}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={() => setManualPositionMode(!manualPositionMode)}
                                    className="bg-card/90 backdrop-blur"
                                >
                                    {manualPositionMode ? (
                                        <MousePointer className="h-4 w-4"/>
                                    ) : (
                                        <Hand className="h-4 w-4"/>
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>{manualPositionMode ? 'Navigate Mode' : 'Manual Move Mode'}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    onClick={handleExportImage}
                                    className="bg-card/90 backdrop-blur"
                                >
                                    <Download className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Export as PNG</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="secondary" onClick={handleZoomIn}
                                        className="bg-card/90 backdrop-blur">
                                    <ZoomIn className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Zoom In</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="secondary" onClick={handleZoomOut}
                                        className="bg-card/90 backdrop-blur">
                                    <ZoomOut className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Zoom Out</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="secondary" onClick={handleReset}
                                        className="bg-card/90 backdrop-blur">
                                    <RotateCcw className="h-4 w-4"/>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Reset View</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <Card className="absolute bottom-4 left-4 p-4 bg-card/90 backdrop-blur max-w-sm">
                    <h3 className="font-semibold mb-2 text-gradient">Your Network</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        {manualPositionMode ? (
                            <>
                                <strong>Click & Drag:</strong> Move node • <strong>Scroll:</strong> Zoom
                                <br/>
                                <strong>Click:</strong> View node • <strong>Double-click:</strong> Center & highlight
                            </>
                        ) : (
                            <>
                                <strong>Drag:</strong> Rotate • <strong>Scroll:</strong> Zoom
                                • <strong>Shift+Drag:</strong> Pan
                                <br/>
                                <strong>Ctrl+Drag:</strong> Move node • <strong>Click:</strong> View node
                                • <strong>Double-click:</strong>{" "}
                                Center & highlight
                            </>
                        )}
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total Connections</span>
                            <Badge variant="secondary">{totalConnections}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Visible</span>
                            <Badge variant="secondary">{visibleCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hidden</span>
                            <Badge variant="secondary">{hiddenNodes.size}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Links</span>
                            <Badge variant="secondary">{linkCount}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Zoom Level</span>
                            <Badge variant="secondary">{(zoom * 100).toFixed(0)}%</Badge>
                        </div>
                    </div>
                </Card>

                {selectedNode && (
                    <Card className="absolute top-20 left-4 p-4 bg-card/90 backdrop-blur max-w-xs">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 h-6 w-6 p-0"
                                        onClick={() => setSelectedNode(null)}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Close</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar className="h-12 w-12 border-2 border-royal-purple">
                                <AvatarImage src={selectedNode.avatar_url || undefined}/>
                                <AvatarFallback
                                    className="bg-linear-to-br from-royal-purple to-purple-600 text-white">
                                    {selectedNode.display_name[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{selectedNode.display_name}</p>
                                {selectedNode.type === "user" ? (
                                    <p className="text-sm text-muted-foreground">@{selectedNode.username}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">{selectedNode.groupData?.member_count || 0} members</p>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Connections: {selectedNode.connections.length}</p>
                            {selectedNode.id !== userId && (
                                <Badge variant="secondary" className="capitalize">
                                    {selectedNode.type === "group" ? "Group" : (() => {
                                        // Check if there are custom relationships
                                        const edges = selectedNode.relationships?.[userId] || [];
                                        if (edges.length > 0 && edges[0].label) {
                                            return edges[0].label;
                                        }
                                        return selectedNode.relationshipTypes[userId] || "Unknown";
                                    })()}
                                </Badge>
                            )}

                            {selectedNode.id !== userId && (
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="default"
                                        onClick={() => setIsNodeEditOpen(true)}
                                        className="flex-1"
                                    >
                                        <SettingsIcon className="h-4 w-4 mr-1"/>
                                        Edit Node
                                    </Button>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleNodeVisibility(selectedNode.id)}
                                                >
                                                    {hiddenNodes.has(selectedNode.id) ? (
                                                        <Eye className="h-4 w-4"/>
                                                    ) : (
                                                        <EyeOff className="h-4 w-4"/>
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{hiddenNodes.has(selectedNode.id) ? "Show this node" : "Hide this node"}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>

                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        centerNodeInView(selectedNode);
                                                        highlightConnections(selectedNode);
                                                    }}
                                                    className="flex-1"
                                                >
                                                    <Move className="h-4 w-4 mr-1"/>
                                                    Center
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Center and highlight connections</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            )}

                            {selectedNode.type === "user" && selectedNode.id !== userId && (
                                <Link href={`/profile/${selectedNode.id}`}>
                                    <Button size="sm" className="w-full mt-2">
                                        View Profile
                                    </Button>
                                </Link>
                            )}
                            {selectedNode.type === "group" && (
                                <Link href={`/groups/${selectedNode.id.replace("group-", "")}`}>
                                    <Button size="sm" className="w-full mt-2">
                                        View Group
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </Card>
                )}

                {/* Node Edit Dialog */}
                <NodeEditDialog
                    node={selectedNode}
                    userId={userId}
                    isOpen={isNodeEditOpen}
                    onClose={() => setIsNodeEditOpen(false)}
                    onUpdate={() => {
                        loadNetworkData();
                        setIsNodeEditOpen(false);
                    }}
                />

                {/* Edge Edit Dialog */}
                <EdgeEditDialog
                    edge={selectedEdge}
                    userId={userId}
                    isOpen={isEdgeEditOpen}
                    onClose={() => {
                        setIsEdgeEditOpen(false);
                        setSelectedEdge(null);
                    }}
                    onUpdate={() => {
                        loadNetworkData();
                        setIsEdgeEditOpen(false);
                        setSelectedEdge(null);
                    }}
                />

                {/* Map Legend Card */}
                <div className="absolute bottom-4 right-4 w-80 max-h-[80vh] overflow-auto">
                    <Card className="bg-background/95 backdrop-blur border-royal-purple/20">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm">Map Legend</CardTitle>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowLegend(!showLegend)}
                                >
                                    {showLegend ? <ChevronDown className="h-4 w-4"/> : <ChevronUp className="h-4 w-4"/>}
                                </Button>
                            </div>
                        </CardHeader>
                        {showLegend && (
                            <CardContent className="space-y-3 text-sm">
                                {visibleLegendData.nodeTypes.size > 0 && (
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Node Types ({
                                            (visibleLegendData.nodeTypes.has('user') ? 1 : 0) +
                                            visibleLegendData.externalNodes.length +
                                            (visibleLegendData.nodeTypes.has('group') ? 1 : 0)
                                        })</p>
                                        <div className="space-y-2">
                                            {visibleLegendData.nodeTypes.has('user') && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border"
                                                         style={{backgroundColor: nodeColors.user}}/>
                                                    <span className="text-xs">You (Center)</span>
                                                </div>
                                            )}
                                            {visibleLegendData.externalNodes.map((externalNode, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border"
                                                         style={{backgroundColor: externalNode.color}}/>
                                                    <span className="text-xs">{externalNode.label}</span>
                                                </div>
                                            ))}
                                            {visibleLegendData.nodeTypes.has('group') && (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full border"
                                                         style={{backgroundColor: nodeColors.group}}/>
                                                    <span className="text-xs">Group</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {visibleLegendData.defaultTypes.size > 0 && (
                                    <div className="border-t pt-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Relationship Types
                                            ({visibleLegendData.defaultTypes.size})</p>
                                        <div className="space-y-2">
                                            {[
                                                {type: 'friend', label: 'Friend', color: '#A855F7'},
                                                {type: 'partner', label: 'Partner', color: '#EC4899'},
                                                {type: 'family', label: 'Family', color: '#22C55E'},
                                                {type: 'colleague', label: 'Colleague', color: '#3B82F6'},
                                                {type: 'acquaintance', label: 'Acquaintance', color: '#9CA3AF'},
                                            ].filter(t => visibleLegendData.defaultTypes.has(t.type)).map(type => (
                                                <div key={type.label} className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border"
                                                        style={{backgroundColor: type.color}}
                                                    />
                                                    <span className="text-xs">{type.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {visibleLegendData.customTypes.length > 0 && (
                                    <div className="border-t pt-3">
                                        <p className="text-xs font-medium text-muted-foreground mb-2">Custom Types
                                            ({visibleLegendData.customTypes.length})</p>
                                        <div className="space-y-2">
                                            {visibleLegendData.customTypes.map(type => (
                                                <div key={type.id} className="flex items-center gap-2">
                                                    <div
                                                        className="w-4 h-4 rounded-full border"
                                                        style={{backgroundColor: type.node_color}}
                                                    />
                                                    <span className="text-xs flex-1">{type.label}</span>
                                                    {type.line_style !== 'solid' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {type.line_style}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="border-t pt-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-2">Interactions</p>
                                    <div className="space-y-1 text-xs text-muted-foreground">
                                        <p>• Click node: View details</p>
                                        <p>• Double-click node: Center view</p>
                                        <p>• Click edge: Edit relationship</p>
                                        <p>• Drag canvas: Pan view</p>
                                        <p>• Scroll: Zoom in/out</p>
                                    </div>
                                </div>
                            </CardContent>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}

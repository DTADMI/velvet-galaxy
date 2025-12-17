"use client";

import {Eye, EyeOff, Filter, Move, RotateCcw, Search, SettingsIcon, X, ZoomIn, ZoomOut} from "lucide-react";
import Link from "next/link";
import type React from "react";
import {useCallback, useEffect, useRef, useState} from "react";

import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {Checkbox} from "@/components/ui/checkbox";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Slider} from "@/components/ui/slider";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";
import {createBrowserClient} from "@/lib/supabase/client";

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
    type: "user" | "group"
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
    profiles: Profile;
}

interface Follow {
    id: string;
    follower_id: string;
    following_id: string;
    profiles: Profile;
}

interface Friendship {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
    profiles: Profile;
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
}) => {
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
}

export function NetworkVisualization({userId}: { userId: string }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<NetworkNode[]>([]);
    const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
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
    const [relationshipFilters, setRelationshipFilters] = useState({
        friend: true,
        partner: true,
        family: true,
        colleague: true,
        acquaintance: true,
    });
    const [stars, setStars] = useState<Star[]>([]);
    const [nodeSpacing, setNodeSpacing] = useState(300);
    const [autoRotate, setAutoRotate] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [hiddenNodes, setHiddenNodes] = useState<Set<string>>(new Set());
    const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
    const [isPanning, setIsPanning] = useState(false);
    const animationRef = useRef<number>(0);
    const timeRef = useRef(0);

    const loadNetworkData = useCallback(async () => {
        const supabase = createBrowserClient();

        const [relationshipsResult, followsResult, friendshipsResult, groupsResult] = await Promise.all([
            supabase
                .from("relationships")
                .select("*, profiles!relationships_related_user_id_fkey(id, username, display_name, avatar_url)")
                .or(`user_id.eq.${userId},related_user_id.eq.${userId}`)
                .eq("status", "accepted")
                .limit(maxNodes),
            supabase
                .from("follows")
                .select("*, profiles!follows_following_id_fkey(id, username, display_name, avatar_url)")
                .or(`follower_id.eq.${userId},following_id.eq.${userId}`)
                .limit(maxNodes),
            supabase
                .from("friendships")
                .select("*, profiles!friendships_friend_id_fkey(id, username, display_name, avatar_url)")
                .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
                .eq("status", "accepted")
                .limit(maxNodes),
            showGroups
                ? supabase.from("group_members").select("group_id, groups(id, name)").eq("user_id", userId).limit(10)
                : Promise.resolve({data: []}),
        ]);

        const relationships: Relationship[] = relationshipsResult.data || [];
        const follows: Follow[] = followsResult.data || [];
        const friendships: Friendship[] = friendshipsResult.data || [];
        const userGroups: GroupMember[] = groupsResult.data || [];

        const allConnections = new Map<string, any>();

        relationships.forEach((rel: Relationship) => {
            const connectedUserId = rel.user_id === userId ? rel.related_user_id : rel.user_id;
            if (rel.profiles) {
                allConnections.set(connectedUserId, {
                    ...rel.profiles,
                    relationship_type: rel.relationship_type || "friend",
                    type: "user",
                });
            }
        });

        follows.forEach((follow: Follow) => {
            const connectedUserId = follow.follower_id === userId ? follow.following_id : follow.follower_id;
            if (follow.profiles && !allConnections.has(connectedUserId)) {
                allConnections.set(connectedUserId, {
                    ...follow.profiles,
                    relationship_type: "acquaintance",
                    type: "user",
                });
            }
        });

        friendships.forEach((friendship: Friendship) => {
            const connectedUserId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
            if (friendship.profiles && !allConnections.has(connectedUserId)) {
                allConnections.set(connectedUserId, {
                    ...friendship.profiles,
                    relationship_type: "friend",
                    type: "user",
                });
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
                type: "user",
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
        if (connectedUserIds.length > 1) {
            const {data: secondDegree} = await supabase
                .from("relationships")
                .select("user_id, related_user_id, relationship_type")
                .in("user_id", connectedUserIds)
                .in("related_user_id", connectedUserIds)
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

                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, star.size, 0, Math.PI * 2);
                ctx.fill();

                // Add glow to larger stars
                if (star.size > 1.5) {
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = `rgba(200, 180, 255, ${opacity * 0.5})`;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            });

            const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters);

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

                        let relationshipType = node.relationshipTypes[connId];
                        if (!relationshipType && connNode.relationshipTypes[node.id]) {
                            relationshipType = connNode.relationshipTypes[node.id];
                        }

                        const colors = {
                            friend: {start: "rgba(168, 85, 247, 0.6)", end: "rgba(139, 92, 246, 0.4)", glow: "#A855F7"},
                            partner: {
                                start: "rgba(236, 72, 153, 0.6)",
                                end: "rgba(219, 39, 119, 0.4)",
                                glow: "#EC4899"
                            },
                            family: {start: "rgba(34, 197, 94, 0.6)", end: "rgba(22, 163, 74, 0.4)", glow: "#22C55E"},
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
                            group: {start: "rgba(251, 191, 36, 0.6)", end: "rgba(245, 158, 11, 0.4)", glow: "#FBBF24"},
                        };
                        const color = colors[relationshipType as keyof typeof colors] || colors.acquaintance;

                        // Draw glow
                        ctx.shadowBlur = 8;
                        ctx.shadowColor = color.glow;

                        const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
                        gradient.addColorStop(0, color.start);
                        gradient.addColorStop(1, color.end);

                        ctx.strokeStyle = gradient;
                        ctx.lineWidth = 2.5;
                        ctx.lineCap = "round";
                        ctx.beginPath();
                        ctx.moveTo(from.x, from.y);
                        ctx.lineTo(to.x, to.y);
                        ctx.stroke();

                        ctx.shadowBlur = 0;
                    }
                });
            });

            filteredNodes.forEach((node, index) => {
                const pos = project3DTo2D(node, centerX, centerY);
                const size = index === 0 ? 26 : node.type === "group" ? 22 : 18;
                const isSelected = selectedNode?.id === node.id;
                const isHighlighted = highlightedNodes.has(node.id);

                const relationshipType = node.relationshipTypes[userId];
                const nodeColors = {
                    friend: {start: "#C084FC", end: "#A855F7", glow: "#A855F7"},
                    partner: {start: "#F9A8D4", end: "#EC4899", glow: "#EC4899"},
                    family: {start: "#86EFAC", end: "#22C55E", glow: "#22C55E"},
                    colleague: {start: "#93C5FD", end: "#3B82F6", glow: "#3B82F6"},
                    acquaintance: {start: "#D1D5DB", end: "#9CA3AF", glow: "#9CA3AF"},
                    group: {start: "#FCD34D", end: "#F59E0B", glow: "#F59E0B"},
                };
                const colors =
                    index === 0
                        ? {start: "#C084FC", end: "#A855F7", glow: "#A855F7"}
                        : node.type === "group"
                            ? nodeColors.group
                            : nodeColors[relationshipType as keyof typeof nodeColors] || nodeColors.acquaintance;

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

                // Draw node with gradient
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
    }, [nodes, zoom, relationshipFilters, stars, autoRotate, cameraOffset.x, cameraOffset.y, hiddenNodes, searchQuery, showGroups, userId, selectedNode?.id, highlightedNodes]);

    const project3DTo2D = (node: { x: number; y: number; z: number }, centerX: number, centerY: number) => {
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
    };

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isPanning || isDraggingNode) {
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const {clickX, clickY, centerX, centerY} = calculateMouseReference(canvas, e, cameraOffset);

        const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters);

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

        const {clickX, clickY, centerX, centerY} = calculateMouseReference(canvas, e, cameraOffset);

        if (e.ctrlKey || e.metaKey) {
            const filteredNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters);

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

    const visibleNodes = filterNetworkNodes(nodes, hiddenNodes, searchQuery, showGroups, userId, relationshipFilters);

    const totalConnections = Math.max(0, nodes.length - 1);
    const visibleCount = visibleNodes.length;
    const linkCount = Math.max(0, Math.floor(nodes.reduce((sum, node) => sum + node.connections.length, 0) / 2));
    useEffect(() => {
        const starCount = 300;
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
                    className="w-full h-full cursor-move"
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
                    <Dialog>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DialogTrigger asChild>
                                        <Button size="icon" variant="secondary" className="bg-card/90 backdrop-blur">
                                            <SettingsIcon className="h-4 w-4"/>
                                        </Button>
                                    </DialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p>Network Settings</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
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
                                        onCheckedChange={(checked) => setShowGroups(checked as boolean)}
                                    />
                                    <Label htmlFor="showGroups" className="cursor-pointer">
                                        Show Groups
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
                        <strong>Drag:</strong> Rotate • <strong>Scroll:</strong> Zoom • <strong>Shift+Drag:</strong> Pan
                        <br/>
                        <strong>Ctrl+Drag:</strong> Move node • <strong>Click:</strong> View node
                        • <strong>Double-click:</strong>{" "}
                        Center & highlight
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
                                    {selectedNode.type === "group" ? "Group" : selectedNode.relationshipTypes[userId] || "Unknown"}
                                </Badge>
                            )}

                            {selectedNode.id !== userId && (
                                <div className="flex gap-2">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => toggleNodeVisibility(selectedNode.id)}
                                                    className="flex-1"
                                                >
                                                    {hiddenNodes.has(selectedNode.id) ? (
                                                        <>
                                                            <Eye className="h-4 w-4 mr-1"/>
                                                            Show
                                                        </>
                                                    ) : (
                                                        <>
                                                            <EyeOff className="h-4 w-4 mr-1"/>
                                                            Hide
                                                        </>
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
            </div>
        </div>
    );
}

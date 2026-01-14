"use client";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";

interface CustomRelationshipType {
    id: string;
    label: string;
    node_color: string;
    edge_color: string;
    line_style: string;
    is_visible_on_map: boolean;
}

interface NetworkLegendProps {
    customTypes: CustomRelationshipType[];
    showDefaultTypes?: boolean;
}

const defaultRelationshipTypes = [
    {label: "Friend", color: "#A855F7", lineStyle: "solid"},
    {label: "Partner", color: "#EC4899", lineStyle: "solid"},
    {label: "Family", color: "#22C55E", lineStyle: "solid"},
    {label: "Colleague", color: "#60A5FA", lineStyle: "solid"},
    {label: "Acquaintance", color: "#9CA3AF", lineStyle: "solid"},
    {label: "Group", color: "#FBBF24", lineStyle: "solid"},
];

const defaultNodeTypes = [
    {label: "You", color: "#8b5cf6"},
    {label: "User", color: "#8b5cf6"},
    {label: "Group", color: "#10b981"},
    {label: "External", color: "#6b7280"},
];

function getLineStylePattern(style: string) {
    switch (style) {
        case "dashed":
            return "5,5";
        case "dotted":
            return "2,3";
        case "double":
            return ""; // Will be rendered as two parallel lines
        case "wavy":
            return ""; // Will be a wavy line
        default:
            return "";
    }
}

export function NetworkLegend({customTypes, showDefaultTypes = true}: NetworkLegendProps) {
    const visibleCustomTypes = customTypes.filter(type => type.is_visible_on_map);

    return (
        <Card className="w-64 bg-background/95 backdrop-blur">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Node Types */}
                <div>
                    <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">Node Types</h4>
                    <div className="space-y-1.5">
                        {defaultNodeTypes.map((type) => (
                            <div key={type.label} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full border"
                                    style={{backgroundColor: type.color, borderColor: type.color}}
                                />
                                <span className="text-xs">{type.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator/>

                {/* Default Relationship Types */}
                {showDefaultTypes && (
                    <>
                        <div>
                            <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                                Default Relationships
                            </h4>
                            <div className="space-y-1.5">
                                {defaultRelationshipTypes.map((type) => (
                                    <div key={type.label} className="flex items-center gap-2">
                                        <svg width="20" height="12" className="flex-shrink-0">
                                            <line
                                                x1="0"
                                                y1="6"
                                                x2="20"
                                                y2="6"
                                                stroke={type.color}
                                                strokeWidth="2"
                                                strokeDasharray={getLineStylePattern(type.lineStyle)}
                                            />
                                        </svg>
                                        <span className="text-xs">{type.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {visibleCustomTypes.length > 0 && <Separator/>}
                    </>
                )}

                {/* Custom Relationship Types */}
                {visibleCustomTypes.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold mb-2 text-muted-foreground uppercase">
                            Custom Relationships
                        </h4>
                        <div className="space-y-1.5">
                            {visibleCustomTypes.map((type) => (
                                <div key={type.id} className="flex items-center gap-2">
                                    {type.line_style === "double" ? (
                                        <svg width="20" height="12" className="flex-shrink-0">
                                            <line
                                                x1="0"
                                                y1="4"
                                                x2="20"
                                                y2="4"
                                                stroke={type.edge_color}
                                                strokeWidth="1"
                                            />
                                            <line
                                                x1="0"
                                                y1="8"
                                                x2="20"
                                                y2="8"
                                                stroke={type.edge_color}
                                                strokeWidth="1"
                                            />
                                        </svg>
                                    ) : type.line_style === "wavy" ? (
                                        <svg width="20" height="12" className="flex-shrink-0">
                                            <path
                                                d="M 0,6 Q 2.5,2 5,6 T 10,6 T 15,6 T 20,6"
                                                stroke={type.edge_color}
                                                strokeWidth="2"
                                                fill="none"
                                            />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="12" className="flex-shrink-0">
                                            <line
                                                x1="0"
                                                y1="6"
                                                x2="20"
                                                y2="6"
                                                stroke={type.edge_color}
                                                strokeWidth="2"
                                                strokeDasharray={getLineStylePattern(type.line_style)}
                                            />
                                        </svg>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-2 h-2 rounded-full"
                                            style={{backgroundColor: type.node_color}}
                                        />
                                        <span className="text-xs">{type.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {visibleCustomTypes.length === 0 && !showDefaultTypes && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        No relationship types to display
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

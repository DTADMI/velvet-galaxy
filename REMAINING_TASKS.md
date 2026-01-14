# Remaining Implementation Tasks

## Completed ✅

1. Fixed new node not displaying with selected color (line 992 in network-visualization.tsx)
2. Updated node edit dialog to use RelationshipTypeSelector component

## Pending Tasks

### 1. Implement Edge Click Detection and Editing

**Location**: `app/network/network-visualization.tsx`

**What to do**:

1. Add edge click detection in the canvas click handler (around line 1060-1090)
2. Calculate distance from click point to edge lines
3. When an edge is clicked, open the EdgeEditDialog
4. Pass the edge data to the dialog

**Code snippet to add**:

```typescript
// In handleCanvasClick function, before node click detection:
// Check if click is near any edge
for (const node of filteredNodes) {
    for (const connId of node.connections) {
        const connectedNode = filteredNodes.find(n => n.id === connId);
        if (!connectedNode) continue;

        const pos1 = project3DTo2D(node, centerX, centerY);
        const pos2 = project3DTo2D(connectedNode, centerX, centerY);

        // Calculate distance from click to line segment
        const distToLine = distanceToLineSegment(
            mouseX, mouseY,
            pos1.x, pos1.y,
            pos2.x, pos2.y
        );

        if (distToLine < 10) { // 10px threshold
            // Get relationship edges for this connection
            const edges = node.relationships[connId] || [];
            if (edges.length > 0) {
                setSelectedEdge({
                    from: node.id,
                    to: connId,
                    edges: edges
                });
                setIsEdgeEditOpen(true);
                return;
            }
        }
    }
}

// Helper function to add:
function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
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
}
```

### 2. Add Map Legend Card

**Location**: `app/network/network-visualization.tsx`

**What to do**:

1. Create a new state for showing/hiding legend
2. Add a legend card component in the bottom-right corner
3. Fetch all relationship types (custom + global) and display them with colors
4. Show line style examples

**Code to add** (around line 1700, before closing divs):

```typescript
{/* Legend Card */
}
<div className = "absolute bottom-4 right-4 w-80" >
<Card className = "bg-background/95 backdrop-blur" >
<CardHeader className = "pb-3" >
<div className = "flex items-center justify-between" >
<CardTitle className = "text-sm" > Map
Legend < /CardTitle>
< Button
size = "sm"
variant = "ghost"
onClick = {()
=>
setShowLegend(!showLegend)
}
>
{
    showLegend ? <ChevronDown className = "h-4 w-4" / > : <ChevronUp className = "h-4 w-4" / >
}
</Button>
< /div>
< /CardHeader>
{
    showLegend && (
        <CardContent className = "space-y-3" >
        <div>
            <p className = "text-xs font-medium text-muted-foreground mb-2" > Default
    Relationship
    Types < /p>
    < div
    className = "space-y-2" >
        {
            [
                {label: 'Friend', color: '#A855F7'},
    {
        label: 'Partner', color
    :
        '#EC4899'
    }
,
    {
        label: 'Family', color
    :
        '#22C55E'
    }
,
    {
        label: 'Colleague', color
    :
        '#3B82F6'
    }
,
    {
        label: 'Acquaintance', color
    :
        '#9CA3AF'
    }
,
].
    map(type => (
        <div key = {type.label}
    className = "flex items-center gap-2" >
    <div
        className = "w-4 h-4 rounded-full border"
    style = {
    {
        backgroundColor: type.color
    }
}
    />
    < span
    className = "text-xs" > {type.label} < /span>
        < /div>
))
}
    </div>
    < /div>

    {/* Custom Types Section - fetch from database */
    }
    <div className = "border-t pt-3" >
    <p className = "text-xs font-medium text-muted-foreground mb-2" > Custom
    Types < /p>
    < div
    className = "space-y-2" >
        {
            customTypesForLegend.map(type => (
                <div key = {type.id} className = "flex items-center gap-2" >
            <div
                className = "w-4 h-4 rounded-full border"
            style = {
    {
        backgroundColor: type.node_color
    }
}
    />
    < span
    className = "text-xs" > {type.label} < /span>
    {
        type.line_style !== 'solid' && (
            <span className = "text-xs text-muted-foreground" > ({type.line_style}) < /span>
        )
    }
    </div>
))
}
    </div>
    < /div>

    < div
    className = "border-t pt-3" >
    <p className = "text-xs font-medium text-muted-foreground mb-2" > Node
    Types < /p>
    < div
    className = "space-y-2" >
    <div className = "flex items-center gap-2" >
    <div className = "w-4 h-4 rounded-full border"
    style = {
    {
        backgroundColor: nodeColors.user
    }
}
    />
    < span
    className = "text-xs" > You < /span>
        < /div>
        < div
    className = "flex items-center gap-2" >
    <div className = "w-4 h-4 rounded-full border"
    style = {
    {
        backgroundColor: nodeColors.external
    }
}
    />
    < span
    className = "text-xs" > External
    Profile < /span>
    < /div>
    < div
    className = "flex items-center gap-2" >
    <div className = "w-4 h-4 rounded-full border"
    style = {
    {
        backgroundColor: nodeColors.group
    }
}
    />
    < span
    className = "text-xs" > Group < /span>
        < /div>
        < /div>
        < /div>
        < /CardContent>
)
}
</Card>
< /div>
```

**State to add**:

```typescript
const [showLegend, setShowLegend] = useState(true);
const [customTypesForLegend, setCustomTypesForLegend] = useState<CustomRelationshipType[]>([]);
```

**Effect to fetch custom types**:

```typescript
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
```

## Database Migrations to Run

Run these in order:

1. `scripts/046_fix_external_profiles_node_color.sql` ✅ (already run)
2. `scripts/047_add_more_line_styles.sql` ⏳ (needs to be run)
3. `scripts/048_immediate_custom_types.sql` ⏳ (needs to be run)

## Summary

The system now supports:

- ✅ Immediate custom type creation (private or public pending approval)
- ✅ Auto-selection of newly created types
- ✅ Admin approval updates labels everywhere
- ✅ Node colors display correctly
- ✅ Node edit dialog uses RelationshipTypeSelector
- ⏳ Edge click detection (needs implementation above)
- ⏳ Map legend card (needs implementation above)

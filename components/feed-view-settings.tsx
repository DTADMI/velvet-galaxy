"use client";
import {Settings2} from "lucide-react";

import {Button} from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Label} from "@/components/ui/label";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";

export type PostDisplaySize = "compact" | "normal" | "expanded"

interface FeedViewSettingsProps {
    onSizeChange: (size: PostDisplaySize) => void
    currentSize: PostDisplaySize
}

export function FeedViewSettings({onSizeChange, currentSize}: FeedViewSettingsProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                    <Settings2 className="h-4 w-4"/>
                    Display Settings
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Post Display Size</DropdownMenuLabel>
                <DropdownMenuSeparator/>
                <div className="p-4">
                    <RadioGroup value={currentSize} onValueChange={(value) => onSizeChange(value as PostDisplaySize)}>
                        <div className="flex items-center space-x-2 mb-3">
                            <RadioGroupItem value="compact" id="compact"/>
                            <Label htmlFor="compact" className="cursor-pointer flex-1">
                                <div className="font-medium">Compact</div>
                                <div className="text-xs text-muted-foreground">Smaller posts, more content visible</div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                            <RadioGroupItem value="normal" id="normal"/>
                            <Label htmlFor="normal" className="cursor-pointer flex-1">
                                <div className="font-medium">Normal</div>
                                <div className="text-xs text-muted-foreground">Balanced view (default)</div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="expanded" id="expanded"/>
                            <Label htmlFor="expanded" className="cursor-pointer flex-1">
                                <div className="font-medium">Expanded</div>
                                <div className="text-xs text-muted-foreground">Larger posts, more detail</div>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

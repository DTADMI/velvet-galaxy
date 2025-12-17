"use client";
import {FileText, ImageIcon, Music, Upload, Video} from "lucide-react";
import {useRouter} from "next/navigation";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";

export function QuickUploadDropdown() {
    const router = useRouter();

    const uploadTypes = [
        {type: "picture", icon: ImageIcon, label: "Upload Picture", color: "royal-purple"},
        {type: "video", icon: Video, label: "Upload Video", color: "royal-orange"},
        {type: "audio", icon: Music, label: "Upload Audio", color: "royal-blue"},
        {type: "writing", icon: FileText, label: "Upload Writing", color: "royal-green"},
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm"
                        className="gap-2 bg-gradient-to-r from-royal-auburn to-royal-orange">
                    <Upload className="h-4 w-4"/>
                    Upload
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {uploadTypes.map((item) => {
                    const Icon = item.icon;
                    return (
                        <DropdownMenuItem
                            key={item.type}
                            onClick={() => router.push(`/upload?type=${item.type}`)}
                            className="flex items-center gap-2 cursor-pointer"
                        >
                            <Icon className={`h-4 w-4 text-${item.color}`}/>
                            {item.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

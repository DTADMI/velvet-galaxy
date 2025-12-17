import {Shield} from "lucide-react";

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip";

interface VerifiedBadgeProps {
    size?: "sm" | "md" | "lg"
    className?: string
}

export function VerifiedBadge({size = "md", className = ""}: VerifiedBadgeProps) {
    const sizeClasses = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5",
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div
                        className={`inline-flex items-center justify-center rounded-full bg-gradient-to-br from-royal-blue to-royal-purple p-0.5 ${className}`}
                    >
                        <Shield className={`${sizeClasses[size]} text-white`} fill="currentColor"/>
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Verified Account</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

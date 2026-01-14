import Image from "next/image";
import {cn} from "@/lib/utils";

interface VelvetLogoProps {
    size?: "sm" | "md" | "lg" | "xl"
    className?: string
    showText?: boolean
}

export function VelvetLogo({size = "md", className, showText = false}: VelvetLogoProps) {
    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-24 w-24",
    };

    const textSizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-4xl",
    };

    return (
        <div className={cn("flex items-center gap-3", className)} role="img" aria-label="Velvet Galaxy Logo">
            <div className={cn("relative", sizeClasses[size])}>
                <Image
                    src="/velvet-galaxy-logo.png"
                    alt="Velvet Galaxy Logo"
                    width={96}
                    height={96}
                    className="w-full h-full object-contain"
                    priority
                />
            </div>
            {showText && (
                <span
                    className={cn(
                        "font-bold bg-gradient-to-r from-royal-auburn via-royal-purple to-royal-blue bg-clip-text text-transparent",
                        textSizeClasses[size],
                    )}
                >
          Velvet Galaxy
        </span>
            )}
        </div>
    );
}

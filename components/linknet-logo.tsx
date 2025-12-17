import {cn} from "@/lib/utils";

interface LinkNetLogoProps {
    size?: "sm" | "md" | "lg" | "xl"
    className?: string
    showText?: boolean
}

export function LinkNetLogo({size = "md", className, showText = false}: LinkNetLogoProps) {
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

    const iconSizeClasses = {
        sm: "text-base",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-5xl",
    };

    return (
        <div className={cn("flex items-center gap-3", className)}>
            <div
                className={cn(
                    "flex items-center justify-center rounded-xl bg-gradient-to-br from-red-900 via-purple-900 to-black shadow-lg shadow-red-900/50 relative overflow-hidden border border-red-800/30",
                    sizeClasses[size],
                )}
            >
                {/* Chain link pattern in background */}
                <svg
                    className="absolute inset-0 w-full h-full opacity-25"
                    viewBox="0 0 100 100"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Interlocking chain links */}
                    <ellipse cx="30" cy="30" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    <ellipse cx="50" cy="30" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    <ellipse cx="70" cy="30" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    <ellipse cx="40" cy="50" rx="12" ry="18" fill="none" stroke="#dc2626" strokeWidth="3"/>
                    <ellipse cx="60" cy="50" rx="12" ry="18" fill="none" stroke="#dc2626" strokeWidth="3"/>
                    <ellipse cx="30" cy="70" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    <ellipse cx="50" cy="70" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    <ellipse cx="70" cy="70" rx="12" ry="18" fill="none" stroke="white" strokeWidth="3"/>
                    {/* Connection nodes */}
                    <circle cx="30" cy="30" r="3" fill="#dc2626"/>
                    <circle cx="70" cy="30" r="3" fill="#dc2626"/>
                    <circle cx="50" cy="50" r="4" fill="white"/>
                    <circle cx="30" cy="70" r="3" fill="#dc2626"/>
                    <circle cx="70" cy="70" r="3" fill="#dc2626"/>
                </svg>
                {/* VG letters with galaxy aesthetic */}
                <span className={cn("font-bold text-white relative z-10 tracking-tight", iconSizeClasses[size])}>
          V<span className="text-red-500">G</span>
        </span>
            </div>
            {showText && (
                <span
                    className={cn(
                        "font-bold bg-gradient-to-r from-purple-900 via-blue-900 to-red-700 bg-clip-text text-transparent",
                        textSizeClasses[size],
                    )}
                >
          Velvet Galaxy
        </span>
            )}
        </div>
    );
}

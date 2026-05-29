"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[VG:AdminError]", error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-full bg-destructive/10 p-4">
                <svg
                    className="h-8 w-8 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                    />
                </svg>
            </div>
            <div>
                <h2 className="text-xl font-semibold">Admin Panel Error</h2>
                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    {error.message || "An error occurred loading the admin panel."}
                </p>
            </div>
            <div className="flex gap-2">
                <Button onClick={reset} variant="outline">
                    Try Again
                </Button>
                <Button onClick={() => (window.location.href = "/admin")} variant="default">
                    Back to Dashboard
                </Button>
            </div>
        </div>
    );
}

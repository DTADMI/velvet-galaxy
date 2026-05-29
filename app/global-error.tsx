"use client";

import { Button } from "@/components/ui/button";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function GlobalErrorPage({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center bg-background">
                    <div className="rounded-full bg-destructive/10 p-4">
                        <svg
                            className="h-10 w-10 text-destructive"
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
                        <h1 className="text-2xl font-bold">Critical Error</h1>
                        <p className="mt-2 text-muted-foreground max-w-md">
                            Velvet Galaxy encountered a critical error and cannot continue. Please refresh the page or try again later.
                        </p>
                        {error.digest && (
                            <p className="mt-1 text-xs text-muted-foreground font-mono">
                                Error ID: {error.digest}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={reset} variant="default">
                            Try Again
                        </Button>
                        <Button onClick={() => window.location.reload()} variant="outline">
                            Refresh Page
                        </Button>
                    </div>
                </div>
            </body>
        </html>
    );
}

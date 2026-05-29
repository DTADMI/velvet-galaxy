import { Skeleton } from "@/components/ui/skeleton";

export default function PostLoading() {
    return (
        <div className="container mx-auto p-6 max-w-2xl space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                </div>
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    );
}

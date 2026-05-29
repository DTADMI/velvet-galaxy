import { Skeleton } from "@/components/ui/skeleton";

export default function ToyDetailLoading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-80 w-full rounded-xl" />
                <div className="space-y-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-24 w-full" />
                    <div className="flex gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-8 rounded-full" />
                        ))}
                    </div>
                </div>
            </div>
            <Skeleton className="h-32 w-full" />
        </div>
    );
}

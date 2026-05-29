import { Skeleton } from "@/components/ui/skeleton";

export default function MediaLoading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full rounded-xl" />
            <div className="flex gap-3">
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-24 w-full" />
        </div>
    );
}

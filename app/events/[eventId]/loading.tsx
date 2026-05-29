import { Skeleton } from "@/components/ui/skeleton";

export default function EventLoading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
                <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </div>
        </div>
    );
}

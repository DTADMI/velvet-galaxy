import { Skeleton } from "@/components/ui/skeleton";

export default function GalleryLoading() {
    return (
        <div className="container mx-auto p-6 space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
        </div>
    );
}

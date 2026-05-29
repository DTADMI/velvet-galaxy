import { Skeleton } from "@/components/ui/skeleton";

export default function ChatRoomLoading() {
    return (
        <div className="flex h-screen">
            <div className="w-80 border-r p-4 space-y-3">
                <Skeleton className="h-8 w-full" />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
            <div className="flex-1 p-4 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-3/4" />
                ))}
            </div>
        </div>
    );
}

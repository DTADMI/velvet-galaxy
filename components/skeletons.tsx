export function PostSkeleton() {
    return (
        <div className="animate-pulse rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-muted" />
                    <div className="h-3 w-16 rounded bg-muted" />
                </div>
            </div>
            <div className="mt-4 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="h-3 w-1/2 rounded bg-muted" />
            </div>
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-muted" />
                <div className="space-y-2">
                    <div className="h-6 w-40 rounded bg-muted" />
                    <div className="h-4 w-32 rounded bg-muted" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-5/6 rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
            </div>
        </div>
    );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, i) => (
                <PostSkeleton key={i} />
            ))}
        </div>
    );
}

export function MessageThreadSkeleton({ count = 5 }: { count?: number }) {
    return (
        <div className="space-y-4 p-4">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                >
                    <div
                        className={`h-12 rounded-lg bg-muted ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`}
                    />
                </div>
            ))}
        </div>
    );
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="animate-pulse space-y-3">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted" />
                    <div className="flex-1">
                        <div className="h-3 w-2/3 rounded bg-muted" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="animate-pulse rounded-lg border border-border bg-card p-6">
            <div className="h-5 w-1/3 rounded bg-muted" />
            <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
        </div>
    );
}

export function GallerySkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
        </div>
    );
}

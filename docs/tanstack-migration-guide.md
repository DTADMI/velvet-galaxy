# TanStack Query Integration — Velvet Galaxy

> May 15, 2026 — Pattern reference for migrating from SWR to TanStack Query

---

## Current State

VG uses SWR (`swr: ^2.3.8`) with a custom IndexedDB caching layer (`lib/cache/`). This provides:
- Client-side data fetching with deduplication
- IndexedDB persistence for offline support
- Cache invalidation utilities
- SWR global config with retry, revalidation, TTL

## Why TanStack Query?

| Feature | SWR | TanStack Query | Benefit |
|---|---|---|---|
| **Mutations** | ❌ No built-in | ✅ `useMutation` | Centralized mutation state, loading, error |
| **Optimistic Updates** | ❌ Manual | ✅ `onMutate` + `setQueryData` | Instant UI feedback |
| **Infinite Queries** | ❌ Manual (own hook) | ✅ `useInfiniteQuery` | Built-in pagination support |
| **Query Invalidation** | ✅ `mutate()` | ✅ `queryClient.invalidateQueries()` | Similar, but more flexible |
| **DevTools** | ❌ None | ✅ React Query DevTools | Debugging cache, queries, mutations |
| **Prefetching** | ❌ Manual | ✅ `queryClient.prefetchQuery()` | Route-based prefetching |
| **Garbage Collection** | ✅ | ✅ | Similar |

## Migration Strategy

### Phase 1: Install and Configure (Non-breaking)

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

### Phase 2: Provider Setup

Replace `components/cache-provider.tsx` (`SWRConfig`) with `QueryClientProvider`:

```tsx
// app/providers.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30 * 1000,
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    );
}
```

### Phase 3: Incremental Migration

Migrate one hook at a time. Keep SWR for existing and add TanStack Query for new features.

**SWR (current):**
```typescript
const { data, error, isLoading } = useSWR("/api/profile", fetcher);
```

**TanStack Query (target):**
```typescript
const { data, error, isLoading } = useQuery({
    queryKey: ["profile", userId],
    queryFn: () => supabase.from("profiles").select("*").eq("id", userId).single(),
});
```

### Phase 4: Optimistic Updates

```typescript
// Optimistic like/unlike with TanStack Query
const likeMutation = useMutation({
    mutationFn: (postId: string) => likePost(postId),
    onMutate: async (postId) => {
        await queryClient.cancelQueries({ queryKey: ["post", postId] });
        const previous = queryClient.getQueryData(["post", postId]);
        queryClient.setQueryData(["post", postId], (old: any) => ({
            ...old,
            userLiked: true,
            likes_count: (old?.likes_count ?? 0) + 1,
        }));
        return { previous };
    },
    onError: (_err, postId, context) => {
        queryClient.setQueryData(["post", postId], context?.previous);
    },
    onSettled: (postId) => {
        queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
});
```

## Recommended Defaults (from QH Guidelines)

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30 * 1000,        // 30s before data considered stale
            gcTime: 5 * 60 * 1000,       // 5min garbage collection
            retry: 1,                     // Retry once on failure
            refetchOnWindowFocus: false,  // Don't refetch on tab focus
            refetchOnReconnect: true,     // Refetch when internet comes back
        },
        mutations: {
            retry: 0,                     // Don't retry mutations
        },
    },
});
```

## Query Key Convention

```typescript
export const queryKeys = {
    profile: {
        all: ["profiles"] as const,
        byId: (id: string) => ["profiles", id] as const,
        byIds: (ids: string[]) => ["profiles", "batch", ids] as const,
    },
    posts: {
        all: ["posts"] as const,
        byId: (id: string) => ["posts", id] as const,
        byFeed: (filters: object) => ["posts", "feed", filters] as const,
        likes: (id: string) => ["posts", id, "likes"] as const,
    },
    messages: {
        all: ["messages"] as const,
        byConversation: (id: string) => ["messages", "conversation", id] as const,
    },
    notifications: {
        all: ["notifications"] as const,
        byUser: (userId: string) => ["notifications", userId] as const,
    },
};
```

## Migration Checklist

- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `QueryClientProvider` in `app/providers.tsx`
- [ ] Add `ReactQueryDevtools` (dev only)
- [ ] Migrate `useProfile` → `useQuery(["profiles", userId])`
- [ ] Migrate `usePosts` → `useQuery(["posts", "feed", filters])`
- [ ] Migrate `useNotifications` → `useQuery(["notifications", userId])`
- [ ] Add optimistic updates for likes, follows, bookmarks
- [ ] Add `useInfiniteQuery` for feed, messages, search results
- [ ] Add route-based prefetching with `queryClient.prefetchQuery()`
- [ ] Remove SWR dependency once fully migrated
- [ ] Add UI feedback requirements (toasts, loading states, error states)

## When to Migrate

**Recommended:** Phase 3 enhancement. Not urgent. Current SWR setup works well.

**Migration triggers:**
- When implementing optimistic updates for social actions
- When adding infinite scroll to messaging (useInfiniteQuery)
- When debugging complex data flows (DevTools)
- When team familiarity with TanStack Query grows

---

*Reference: QH `docs/technical/tanstack-query-guidelines.md`*

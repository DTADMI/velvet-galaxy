# Neo4J Integration Plan — Velvet Galaxy

> May 15, 2026 — Optional feature-gated graph database for social graph queries

---

## Recommendation: YES — Neo4J is strongly recommended as a feature-gated optional DB

**Rationale:** Velvet Galaxy's social graph IS the core product differentiator. The custom relationship system (Dom/Sub, Partner, mutual consent), the 3D galaxy network visualization, and the highly interconnected profile/group/event data form a genuine property graph. Neo4j handles this natively where Supabase Postgres requires recursive CTEs and multiple round-trips.

---

## What Neo4J Solves

| Problem | Current (Supabase) | With Neo4J |
|---|---|---|
| "Friends of friends who liked X" | Multiple recursive CTEs or N+1 queries | Single `MATCH` Cypher query |
| 3D Galaxy Network Viz | Manual JOIN + in-memory graph construction | Native graph traversal, direct to visualization |
| Custom Relationship Types | Stored in 3 relational tables, assembled in JS | Native relationship properties on edges |
| Community Detection | Practically infeasible at scale | Built-in Louvain, Label Propagation algorithms |
| Recommendation Engine ("People You May Know") | Manual similarity scoring | Graph-native collaborative filtering, Jaccard similarity |
| Path Finding (shortest connection between two profiles) | Recursive CTE, painful to write | `shortestPath()` single function call |
| Content Discovery via Social Graph | Complex multi-join queries | Traversal-based discovery algorithms |

---

## Architecture: Supabase + Neo4j Hybrid

```
┌────────────────────────────────────────────────────────────┐
│                    Next.js 16 App Router (Vercel)            │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │   Supabase SDK      │    │   Neo4j Driver       │        │
│  │   @supabase/ssr     │    │   neo4j-driver       │        │
│  │                     │    │                      │        │
│  │  Handles:           │    │  Handles:            │        │
│  │  - Auth             │    │  - Social Graph      │        │
│  │  - Content CRUD     │    │  - Galaxy Network Viz│        │
│  │  - Storage          │    │  - Path Finding      │        │
│  │  - Realtime         │    │  - Community Detect  │        │
│  │  - Marketplace      │    │  - Recommendations   │        │
│  │  - Artists/Toys     │    │  - "People You Know" │        │
│  │  - RLS Enforcement  │    │                      │        │
│  └──────────┬──────────┘    └──────────┬──────────┘        │
└─────────────┼───────────────────────────┼──────────────────┘
              │                           │
     ┌────────┴────────┐         ┌────────┴────────┐
     │   Supabase      │         │  Neo4j AuraDB    │
     │  - Auth         │         │  - Profiles      │
     │  - 60+ tables   │         │  - Relationships │
     │  - Storage      │         │  - Groups/Events │
     │  - RLS          │         │  - Cypher Queries│
     └─────────────────┘         └─────────────────┘
```

**Key principle:** Supabase is the source of truth for user data and content. Neo4j is a **read-optimized graph view** synced from Supabase. If Neo4j is unreachable, the app degrades gracefully to Supabase-only queries.

---

## Graph Model

### Nodes

| Label | Supabase Source | Key Properties |
|---|---|---|
| `:Profile` | `public.profiles` | `id`, `username`, `display_name`, `avatar_url`, `is_admin`, `is_artist`, `is_moral_person` |
| `:Group` | `public.groups` | `id`, `name`, `description`, `privacy` |
| `:Event` | `public.events` | `id`, `title`, `location`, `start_time`, `end_time` |
| `:Artwork` | `public.artworks` | `id`, `title`, `media_url`, `nsfw` |
| `:Post` | `public.posts` | `id`, `content`, `content_rating`, `created_at` |
| `:Tag` | `public.tags` | `id`, `name` |

### Relationships

| Type | Supabase Source | From | To | Properties |
|---|---|---|---|---|
| `[:FOLLOWS]` | `public.follows` | `(:Profile)` | `(:Profile)` | `created_at` |
| `[:FRIENDS]` | `public.friendships` | `(:Profile)` | `(:Profile)` | `status`, `created_at` |
| `[:HAS_RELATIONSHIP]` | `public.user_relationships` | `(:Profile)` | `(:Profile)` | `type`, `line_style`, `mutual_consent`, `color` |
| `[:MEMBER_OF]` | `public.group_members` | `(:Profile)` | `(:Group)` | `role`, `joined_at` |
| `[:ATTENDING]` | `public.event_rsvps` | `(:Profile)` | `(:Event)` | `status`, `rsvped_at` |
| `[:CREATED]` | `public.posts` | `(:Profile)` | `(:Post)` | `created_at` |
| `[:LIKED]` | `public.post_likes` | `(:Profile)` | `(:Post)` | `created_at` |
| `[:CREATED_ARTWORK]` | `public.artworks` | `(:Profile)` | `(:Artwork)` | `created_at` |
| `[:TAGGED_WITH]` | `public.post_tags` | `(:Post)` | `(:Tag)` | |
| `[:INTERESTED_IN]` | `public.user_interests` | `(:Profile)` | `(:Tag)` | |

---

## Sync Strategy

### Approach: Eventual Consistency via Supabase Database Webhooks

When a relationship is created/changed/deleted in Supabase, a webhook fires an API route that upserts the corresponding Neo4j node/relationship.

### Sync Flow

```
1. User creates relationship → Supabase INSERT
2. Supabase Database Webhook fires → POST to /api/neo4j/sync
3. API route extracts change → Upserts Neo4j node/relationship
4. If webhook fails → Periodic reconciliation job catches up
```

### Feature Flag Gating

```sql
INSERT INTO public.feature_flags (name, description, is_enabled, config) VALUES
('neo4j_graph_queries', 'Neo4j-backed social graph queries for galaxy visualization, recommendations, and path finding', false, '{"tier": "premium"}');
```

---

## Concrete Cypher Queries

### 1. Network Visualization — Get a profile's full social graph

```cypher
MATCH (p:Profile {id: $profileId})
OPTIONAL MATCH (p)-[r1:FOLLOWS|FRIENDS|HAS_RELATIONSHIP]-(other:Profile)
OPTIONAL MATCH (p)-[:MEMBER_OF]->(g:Group)
OPTIONAL MATCH (p)-[:ATTENDING]->(e:Event)
RETURN p, collect(DISTINCT {rel: type(r1), props: properties(r1), other: other}) AS connections,
       collect(DISTINCT g) AS groups,
       collect(DISTINCT e) AS events
```

### 2. People You May Know — Friends of friends, excluding existing connections

```cypher
MATCH (me:Profile {id: $userId})-[:FRIENDS]-(friend:Profile)-[:FRIENDS]-(suggestion:Profile)
WHERE NOT (me)-[:FRIENDS|FOLLOWS]-(suggestion)
  AND suggestion.id <> me.id
WITH suggestion, count(*) AS mutualFriends
ORDER BY mutualFriends DESC
LIMIT 20
RETURN suggestion, mutualFriends
```

### 3. Content Recommendations — Posts liked by people with similar interests

```cypher
MATCH (me:Profile {id: $userId})-[:INTERESTED_IN]->(tag:Tag)<-[:INTERESTED_IN]-(similar:Profile)
MATCH (similar)-[:LIKED]->(post:Post)
WHERE NOT (me)-[:LIKED]-(post)
  AND NOT (me)-[:CREATED]-(post)
WITH post, count(DISTINCT similar) AS likerCount
ORDER BY likerCount DESC
LIMIT 20
MATCH (author:Profile)-[:CREATED]->(post)
RETURN post, author, likerCount
```

### 4. Shortest Path — Connection between two profiles

```cypher
MATCH path = shortestPath(
  (a:Profile {id: $profileA})-[*]-(b:Profile {id: $profileB})
)
RETURN path, length(path) AS degrees
```

### 5. Community Detection — Find clusters in the social graph

```cypher
CALL gds.louvain.stream('social-graph')
YIELD nodeId, communityId
MATCH (p:Profile) WHERE id(p) = nodeId
RETURN communityId, collect(p.username) AS members, count(*) AS size
ORDER BY size DESC
LIMIT 10
```

---

## Migration Path

| Step | Effort | Description |
|---|---|---|
| **1. Setup** | 15 min | Create Neo4j AuraDB instance (Free tier: 50K nodes, 175K rels) |
| **2. Add neo4j-driver** | 5 min | `pnpm add neo4j-driver` |
| **3. Graph schema** | 1 day | Define node labels, relationship types, indexes, constraints |
| **4. Sync layer** | 2-3 days | `lib/neo4j/sync.ts` — Supabase webhook → Neo4j upsert |
| **5. Initial import** | 1 day | Batch import existing data from Supabase to Neo4j |
| **6. Graph queries** | 3-5 days | Implement all queries above, integrate with galaxy viz |
| **7. Feature flag** | 30 min | Gate everything behind `neo4j_graph_queries` flag |
| **8. Fallback logic** | 1 day | Graceful degradation to Supabase-only queries when Neo4j down |
| **Total (parallel)** | **~2 weeks** | Most work is independent of Supabase changes |

---

## Cost Analysis

| Plan | Nodes | Relationships | Cost | Fits VG? |
|---|---|---|---|---|
| **AuraDB Free** | 50K | 175K | $0 | ✅ Perfect for launch (up to ~5K users) |
| **AuraDB Professional** | Unlimited | Unlimited | $65/mo | ✅ For scale-up |
| **Self-hosted** | Unlimited | Unlimited | ~$20-50/mo infra | ✅ Open source option |

At launch, the AuraDB Free tier is sufficient. Upgrade to Pro when approaching 50K profiles or when graph algorithms (GDS) are needed.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Neo4j unavailable | Galaxy viz breaks, recommendations stop | Graceful degradation: fall back to Supabase-only queries |
| Sync lag | Graph data may be stale (seconds) | Eventual consistency is acceptable. Webhooks + periodic reconciliation. |
| Cost surprise | AuraDB Pro billing if free tier exceeded | Monitor node/relationship counts. Alert at 80% of free tier. |
| Learning curve | Team needs to learn Cypher | Start with simple queries. Cypher is intuitive for graph problems. |
| Two DBs to maintain | Operational overhead | Neo4j is read-only replica. Supabase is source of truth. No dual-writes. |

---

## Conclusion

Neo4j is not a replacement for Supabase — it's a specialized enhancement for the graph layer. Given VG's social graph is the core product, Neo4j provides:
- **100x simpler queries** for graph traversal
- **Built-in algorithms** for community detection and recommendations  
- **Direct integration** with the 3D galaxy visualization
- **Zero risk** — feature-gated, gracefully degraded if unavailable

**Recommendation: Implement as Phase 3 enhancement behind the `neo4j_graph_queries` feature flag.**

*See also: `docs/gap-analysis-implementation-roadmap.md` §6*

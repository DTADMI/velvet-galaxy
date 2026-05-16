import "server-only";

import { neo4jQuery, isNeo4jAvailable } from "./client";

export interface GraphNode {
    id: string;
    labels: string[];
    [key: string]: any;
}

export interface GraphRelationship {
    type: string;
    start: string;
    end: string;
    properties: Record<string, any>;
}

export interface GraphData {
    nodes: GraphNode[];
    relationships: GraphRelationship[];
}

export async function getProfileGraph(
    profileId: string,
    maxDepth: number = 2
): Promise<GraphData> {
    if (!(await isNeo4jAvailable())) return { nodes: [], relationships: [] };

    const depth = Math.min(maxDepth, 5);

    const result = await neo4jQuery<{ p: any; r: any; o: any }>(
        `
        MATCH (p:Profile {id: $profileId})
        OPTIONAL MATCH (p)-[r:FOLLOWS|FRIENDS|HAS_RELATIONSHIP*1..${depth}]-(other:Profile)
        WHERE other.id <> p.id
        RETURN p, r, other
        LIMIT 200
        `,
        { profileId }
    );

    const nodeMap = new Map<string, GraphNode>();
    const rels: GraphRelationship[] = [];

    for (const row of result) {
        if (row.p && !nodeMap.has(row.p.id)) {
            nodeMap.set(row.p.id, { id: row.p.id, labels: row.p.labels || ["Profile"], ...row.p });
        }
        if (row.o && !nodeMap.has(row.o.id)) {
            nodeMap.set(row.o.id, { id: row.o.id, labels: row.o.labels || ["Profile"], ...row.o });
        }
        if (row.r) {
            const relArray = Array.isArray(row.r) ? row.r : [row.r];
            for (const rel of relArray) {
                if (rel) {
                    rels.push({
                        type: rel.type || rel.type,
                        start: typeof rel.start === "object" ? rel.start.toString() : rel.start,
                        end: typeof rel.end === "object" ? rel.end.toString() : rel.end,
                        properties: rel.properties || rel,
                    });
                }
            }
        }
    }

    return { nodes: Array.from(nodeMap.values()), relationships: rels };
}

export async function getPeopleYouMayKnow(
    userId: string,
    limit: number = 20
): Promise<{ profileId: string; mutualFriends: number; score: number }[]> {
    if (!(await isNeo4jAvailable())) return [];

    const result = await neo4jQuery<{
        suggestion: { id: string; username: string; display_name: string; avatar_url: string };
        mutualFriends: number;
    }>(
        `
        MATCH (me:Profile {id: $userId})-[:FRIENDS]-(friend:Profile)-[:FRIENDS]-(suggestion:Profile)
        WHERE NOT (me)-[:FRIENDS|FOLLOWS]-(suggestion)
          AND suggestion.id <> me.id
        WITH suggestion, count(DISTINCT friend) AS mutualFriends
        ORDER BY mutualFriends DESC
        LIMIT $limit
        RETURN suggestion, mutualFriends
        `,
        { userId, limit }
    );

    return result.map((r) => ({
        profileId: r.suggestion.id,
        mutualFriends: r.mutualFriends,
        score: r.mutualFriends,
    }));
}

export async function getContentRecommendations(
    userId: string,
    limit: number = 20
): Promise<string[]> {
    if (!(await isNeo4jAvailable())) return [];

    const result = await neo4jQuery<{ postId: string; likerCount: number }>(
        `
        MATCH (me:Profile {id: $userId})-[:INTERESTED_IN]->(tag:Tag)<-[:INTERESTED_IN]-(similar:Profile)
        MATCH (similar)-[:LIKED]->(post:Post)
        WHERE NOT (me)-[:LIKED]-(post)
          AND NOT (me)-[:CREATED]-(post)
        WITH post.id AS postId, count(DISTINCT similar) AS likerCount
        ORDER BY likerCount DESC
        LIMIT $limit
        RETURN postId, likerCount
        `,
        { userId, limit }
    );

    return result.map((r) => r.postId);
}

export async function getShortestPath(
    profileA: string,
    profileB: string
): Promise<{ path: string[]; degrees: number } | null> {
    if (!(await isNeo4jAvailable())) return null;

    const result = await neo4jQuery<{ path: any; degrees: number }>(
        `
        MATCH path = shortestPath(
            (a:Profile {id: $profileA})-[*]-(b:Profile {id: $profileB})
        )
        RETURN path, length(path) AS degrees
        `,
        { profileA, profileB }
    );

    if (result.length === 0) return null;

    const pathIds: string[] = [];
    const r = result[0];
    if (r.path && r.path.segments) {
        for (const segment of r.path.segments) {
            if (!pathIds.includes(segment.start.properties.id)) {
                pathIds.push(segment.start.properties.id);
            }
            if (!pathIds.includes(segment.end.properties.id)) {
                pathIds.push(segment.end.properties.id);
            }
        }
    }

    return { path: pathIds, degrees: r.degrees };
}

export async function getGraphStats(): Promise<{
    nodeCount: number;
    relationshipCount: number;
    labels: Record<string, number>;
}> {
    if (!(await isNeo4jAvailable())) return { nodeCount: 0, relationshipCount: 0, labels: {} };

    const [nodeResult, relResult, labelResult] = await Promise.all([
        neo4jQuery<{ count: number }>("MATCH (n) RETURN count(n) AS count"),
        neo4jQuery<{ count: number }>("MATCH ()-[r]->() RETURN count(r) AS count"),
        neo4jQuery<{ label: string; count: number }>(
            "MATCH (n) RETURN DISTINCT labels(n)[0] AS label, count(*) AS count"
        ),
    ]);

    const labels: Record<string, number> = {};
    for (const row of labelResult) {
        if (row.label) labels[row.label] = row.count;
    }

    return {
        nodeCount: nodeResult[0]?.count ?? 0,
        relationshipCount: relResult[0]?.count ?? 0,
        labels,
    };
}

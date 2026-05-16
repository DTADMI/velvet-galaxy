import neo4j, { type Driver, type Session } from "neo4j-driver";

let driver: Driver | null = null;

export function getNeo4jDriver(): Driver | null {
    if (driver) return driver;

    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
        console.warn("[VG:Neo4j] Missing Neo4j credentials. Graph features disabled.");
        return null;
    }

    try {
        driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
            maxConnectionLifetime: 30 * 60 * 1000,
            maxConnectionPoolSize: 50,
        });
        return driver;
    } catch (err) {
        console.error("[VG:Neo4j] Failed to create driver:", err);
        return null;
    }
}

export async function neo4jQuery<T = any>(
    cypher: string,
    params?: Record<string, any>
): Promise<T[]> {
    const d = getNeo4jDriver();
    if (!d) return [];

    const session: Session = d.session();
    try {
        const result = await session.run(cypher, params);
        return result.records.map((record: any) => {
            const obj: any = {};
            record.keys.forEach((key: string) => {
                const value = record.get(key);
                if (neo4j.isNode(value)) {
                    obj[key] = { ...value.properties, labels: value.labels };
                } else if (neo4j.isRelationship(value)) {
                    obj[key] = {
                        ...value.properties,
                        type: value.type,
                        start: value.start,
                        end: value.end,
                    };
                } else {
                    obj[key] = value;
                }
            });
            return obj as T;
        });
    } catch (err) {
        console.error("[VG:Neo4j] Query failed:", err);
        return [];
    } finally {
        await session.close();
    }
}

export async function isNeo4jAvailable(): Promise<boolean> {
    const d = getNeo4jDriver();
    if (!d) return false;
    try {
        const result = await neo4jQuery("RETURN 1 AS ok");
        return result.length > 0;
    } catch {
        return false;
    }
}

export async function closeNeo4jDriver(): Promise<void> {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

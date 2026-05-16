import "server-only";

import { createServerClient } from "@/lib/supabase/server";
import { neo4jQuery, isNeo4jAvailable } from "./client";

export async function syncProfileToNeo4j(profileId: string): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    const supabase = await createServerClient();
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

    if (!profile) return;

    await neo4jQuery(
        `
        MERGE (p:Profile {id: $id})
        SET p.username = $username,
            p.display_name = $displayName,
            p.avatar_url = $avatarUrl,
            p.is_admin = $isAdmin,
            p.is_artist = $isArtist,
            p.is_moral_person = $isMoralPerson,
            p.updated_at = datetime()
        `,
        {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name,
            avatarUrl: profile.avatar_url,
            isAdmin: profile.is_admin ?? false,
            isArtist: profile.is_artist ?? false,
            isMoralPerson: profile.is_moral_person ?? false,
        }
    );
}

export async function syncRelationshipToNeo4j(
    userId: string,
    targetId: string,
    relationType: string,
    relData: Record<string, any> = {}
): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    const validTypes = ["FOLLOWS", "FRIENDS", "HAS_RELATIONSHIP"];
    if (!validTypes.includes(relationType)) return;

    await neo4jQuery(
        `
        MATCH (a:Profile {id: $userId})
        MATCH (b:Profile {id: $targetId})
        MERGE (a)-[r:${relationType}]->(b)
        SET r += $relData, r.updated_at = datetime()
        `,
        { userId, targetId, relData }
    );
}

export async function removeRelationshipFromNeo4j(
    userId: string,
    targetId: string,
    relationType: string
): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    await neo4jQuery(
        `
        MATCH (a:Profile {id: $userId})-[r:${relationType}]->(b:Profile {id: $targetId})
        DELETE r
        `,
        { userId, targetId }
    );
}

export async function syncGroupToNeo4j(groupId: string): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    const supabase = await createServerClient();
    const { data: group } = await supabase
        .from("groups")
        .select("*")
        .eq("id", groupId)
        .single();

    if (!group) return;

    await neo4jQuery(
        `
        MERGE (g:Group {id: $id})
        SET g.name = $name,
            g.description = $description,
            g.privacy = $privacy,
            g.updated_at = datetime()
        `,
        {
            id: group.id,
            name: group.name,
            description: group.description,
            privacy: group.privacy,
        }
    );
}

export async function syncGroupMemberToNeo4j(
    userId: string,
    groupId: string,
    role: string = "member"
): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    await neo4jQuery(
        `
        MATCH (p:Profile {id: $userId})
        MATCH (g:Group {id: $groupId})
        MERGE (p)-[r:MEMBER_OF]->(g)
        SET r.role = $role, r.joined_at = datetime()
        `,
        { userId, groupId, role }
    );
}

export async function syncEventToNeo4j(eventId: string): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    const supabase = await createServerClient();
    const { data: event } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (!event) return;

    await neo4jQuery(
        `
        MERGE (e:Event {id: $id})
        SET e.title = $title,
            e.description = $description,
            e.location = $location,
            e.start_time = $startTime,
            e.end_time = $endTime,
            e.updated_at = datetime()
        `,
        {
            id: event.id,
            title: event.title,
            description: event.description,
            location: event.location,
            startTime: event.start_time,
            endTime: event.end_time,
        }
    );
}

export async function syncEventAttendeeToNeo4j(
    userId: string,
    eventId: string,
    status: string = "attending"
): Promise<void> {
    if (!(await isNeo4jAvailable())) return;

    await neo4jQuery(
        `
        MATCH (p:Profile {id: $userId})
        MATCH (e:Event {id: $eventId})
        MERGE (p)-[r:ATTENDING]->(e)
        SET r.status = $status, r.rsvped_at = datetime()
        `,
        { userId, eventId, status }
    );
}

export async function syncInitialGraph(): Promise<{
    profiles: number;
    relationships: number;
    groups: number;
}> {
    if (!(await isNeo4jAvailable())) return { profiles: 0, relationships: 0, groups: 0 };

    const supabase = await createServerClient();

    const { data: profiles } = await supabase.from("profiles").select("id, username, display_name, avatar_url, is_admin, is_artist, is_moral_person");

    const { data: follows } = await supabase.from("follows").select("follower_id, following_id");
    const { data: friendships } = await supabase.from("friendships").select("user_id, friend_id, status");
    const { data: relationships } = await supabase.from("user_relationships").select("*");

    const { data: groups } = await supabase.from("groups").select("id, name, description, privacy");
    const { data: members } = await supabase.from("group_members").select("user_id, group_id, role");

    let profileCount = 0;
    if (profiles) {
        for (const p of profiles) {
            await syncProfileToNeo4j(p.id);
            profileCount++;
        }
    }

    let relCount = 0;
    if (follows) {
        for (const f of follows) {
            await syncRelationshipToNeo4j(f.follower_id, f.following_id, "FOLLOWS");
            relCount++;
        }
    }
    if (friendships) {
        for (const f of friendships) {
            if (f.status === "accepted") {
                await syncRelationshipToNeo4j(f.user_id, f.friend_id, "FRIENDS");
                relCount++;
            }
        }
    }
    if (relationships) {
        for (const r of relationships) {
            await syncRelationshipToNeo4j(r.user_id, r.target_id, "HAS_RELATIONSHIP", {
                relationship_type: r.relationship_type_id,
                line_style: r.line_style,
                mutual_consent: r.mutual_consent,
            });
            relCount++;
        }
    }

    let groupCount = 0;
    if (groups) {
        for (const g of groups) {
            await syncGroupToNeo4j(g.id);
            groupCount++;
        }
    }
    if (members) {
        for (const m of members) {
            await syncGroupMemberToNeo4j(m.user_id, m.group_id, m.role);
        }
    }

    return { profiles: profileCount, relationships: relCount, groups: groupCount };
}

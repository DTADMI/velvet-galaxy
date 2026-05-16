import "server-only";

import { createServerClient } from "@/lib/supabase/server";

export type AuditAction =
    | "post.create"
    | "post.update"
    | "post.delete"
    | "comment.create"
    | "comment.delete"
    | "message.send"
    | "user.ban"
    | "user.unban"
    | "user.verify"
    | "user.role_change"
    | "group.create"
    | "group.delete"
    | "event.create"
    | "event.delete"
    | "feature_flag.toggle"
    | "feature_flag.update"
    | "admin.login"
    | "report.resolve"
    | "report.dismiss"
    | "subscription.change"
    | "media.upload"
    | "media.delete"
    | "auth.login"
    | "auth.logout"
    | "auth.signup"
    | "auth.password_change";

export async function logAudit(
    action: AuditAction,
    options?: {
        userId?: string;
        targetType?: string;
        targetId?: string;
        metadata?: Record<string, any>;
        ipAddress?: string;
        userAgent?: string;
    }
): Promise<void> {
    try {
        const supabase = await createServerClient();

        let userId = options?.userId;
        if (!userId) {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id;
        }

        await supabase.rpc("log_audit_event", {
            p_user_id: userId,
            p_action: action,
            p_target_type: options?.targetType ?? null,
            p_target_id: options?.targetId ?? null,
            p_metadata: options?.metadata ?? {},
            p_ip_address: options?.ipAddress ?? null,
            p_user_agent: options?.userAgent ?? null,
        });
    } catch (err) {
        console.error("[VG:Audit] Failed to log audit event:", err);
    }
}

export async function getAuditLog(params: {
    userId?: string;
    action?: string;
    targetType?: string;
    limit?: number;
    offset?: number;
}): Promise<any[]> {
    const supabase = await createServerClient();

    let query = supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false });

    if (params.userId) query = query.eq("user_id", params.userId);
    if (params.action) query = query.eq("action", params.action);
    if (params.targetType) query = query.eq("target_type", params.targetType);

    const { data, error } = await query
        .range(params.offset ?? 0, (params.offset ?? 0) + (params.limit ?? 50) - 1);

    if (error) {
        console.error("[VG:Audit] Failed to fetch audit log:", error);
        return [];
    }
    return data ?? [];
}

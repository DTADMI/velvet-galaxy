import "server-only";

import { isFeatureEnabled } from "@/lib/feature-flags.server";
import { checkRateLimit } from "@/lib/redis/rate-limit";
import { formatRateLimitError } from "@/lib/errors";
import type { AiFeature } from "./types";

const FEATURE_FLAG_MAP: Record<AiFeature, string> = {
    content_moderation: "ai_content_moderation",
    translation: "ai_translation_assist",
    content_recommendations: "ai_content_recommendations",
    post_composer: "ai_post_composer",
    tag_suggestions: "ai_tag_suggestions",
    chat_assistant: "ai_chat_assistant",
    media_caption: "ai_media_caption",
    onboarding_assistant: "ai_onboarding_assistant",
    group_activity: "ai_group_activity",
};

export interface AiGateResult {
    allowed: boolean;
    error?: string;
    status?: number;
    retryAfterMs?: number;
}

export async function checkAiGate(
    userId: string,
    feature: AiFeature
): Promise<AiGateResult> {
    const flagKey = FEATURE_FLAG_MAP[feature];
    if (!flagKey) {
        return { allowed: false, error: `Unknown AI feature: ${feature}`, status: 400 };
    }

    const enabled = await isFeatureEnabled(flagKey);
    if (!enabled) {
        return {
            allowed: false,
            error: `AI feature "${feature}" is not enabled`,
            status: 403,
        };
    }

    const rateLimit = await checkRateLimit(userId, "ai_request");
    if (!rateLimit.allowed) {
        return {
            allowed: false,
            error: formatRateLimitError(rateLimit.resetAt),
            status: 429,
            retryAfterMs: rateLimit.resetAt - Date.now(),
        };
    }

    return { allowed: true };
}

export { FEATURE_FLAG_MAP };

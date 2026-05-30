export type AiModel = "deepseek-v4-flash" | "deepseek-v4-pro";

export interface AiMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AiRequest {
    model: AiModel;
    messages: AiMessage[];
    temperature?: number;
    maxTokens?: number;
    feature: AiFeature;
    userId: string;
}

export interface AiResponse {
    content: string;
    model: AiModel;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cached: boolean;
    latencyMs: number;
}

export type AiFeature =
    | "content_moderation"
    | "translation"
    | "content_recommendations"
    | "post_composer"
    | "tag_suggestions"
    | "chat_assistant"
    | "media_caption"
    | "onboarding_assistant"
    | "group_activity"
    | "people_discovery";

export interface AiAdapter {
    readonly provider: string;
    complete(request: AiRequest): Promise<AiResponse>;
    estimateCost(request: AiRequest): number;
}

export interface AiFeatureConfig {
    feature: AiFeature;
    flagKey: string;
    model: AiModel;
    maxTokens: number;
    temperature: number;
    cacheTtlMs: number;
    rateLimitKey: string;
    systemPrompt: string;
    tierLimits: Record<string, number>;
}

export interface AiCostRecord {
    userId: string;
    feature: AiFeature;
    model: AiModel;
    tokensUsed: number;
    estimatedCost: number;
    cached: boolean;
    timestamp: number;
}

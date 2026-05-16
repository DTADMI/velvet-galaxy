import "server-only";

import type { AiMessage, AiAdapter, AiRequest, AiResponse, AiModel } from "./types";
import { CacheTTL, getOrSet } from "@/lib/redis/cache";
import { checkRateLimit } from "@/lib/redis/rate-limit";

const DEEPSEEK_API_BASE = "https://api.deepseek.com/v1";

function getApiKey(): string {
    const key = process.env.DEEPSEEK_API_KEY;
    if (!key) {
        throw new Error("DEEPSEEK_API_KEY is not configured");
    }
    return key;
}

const MODEL_COSTS: Record<AiModel, { input: number; output: number }> = {
    "deepseek-v4-flash": { input: 0.14, output: 0.28 },
    "deepseek-v4-pro": { input: 0.55, output: 1.10 },
};

export const deepseekAdapter: AiAdapter = {
    provider: "deepseek",

    async complete(request: AiRequest): Promise<AiResponse> {
        const apiKey = getApiKey();
        const startTime = Date.now();

        const cacheKey = `ai:deepseek:${request.model}:${hashMessages(request.messages)}`;

        const cached = await getOrSet(
            cacheKey,
            async () => {
                const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: request.model,
                        messages: request.messages,
                        temperature: request.temperature ?? 0.7,
                        max_tokens: request.maxTokens ?? 1024,
                        stream: false,
                    }),
                });

                if (!response.ok) {
                    const errorBody = await response.text();
                    throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`);
                }

                const data = await response.json();
                return {
                    content: data.choices[0]?.message?.content ?? "",
                    model: request.model,
                    usage: {
                        promptTokens: data.usage?.prompt_tokens ?? 0,
                        completionTokens: data.usage?.completion_tokens ?? 0,
                        totalTokens: data.usage?.total_tokens ?? 0,
                    },
                    cached: false,
                    latencyMs: Date.now() - startTime,
                };
            },
            CacheTTL.AI_RESPONSE
        );

        return { ...cached, cached: cached.latencyMs < 10 || cached.cached };
    },

    estimateCost(request: AiRequest): number {
        const costs = MODEL_COSTS[request.model];
        const estimatedInputTokens = estimateTokens(request.messages);
        const estimatedOutputTokens = request.maxTokens ?? 1024;
        return (estimatedInputTokens / 1_000_000) * costs.input +
               (estimatedOutputTokens / 1_000_000) * costs.output;
    },
};

function hashMessages(messages: AiMessage[]): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|");
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
        const char = content.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function estimateTokens(messages: AiMessage[]): number {
    return messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
}

export function getAiAdapter(): AiAdapter {
    return deepseekAdapter;
}

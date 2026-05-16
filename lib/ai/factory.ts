import "server-only";

import type { AiAdapter, AiRequest, AiResponse, AiFeature } from "./types";
import { deepseekAdapter } from "./deepseek-adapter";

const adapters: Map<string, AiAdapter> = new Map([
    ["deepseek", deepseekAdapter],
]);

let defaultProvider = "deepseek";

export function getAdapter(provider?: string): AiAdapter {
    const adapter = adapters.get(provider ?? defaultProvider);
    if (!adapter) {
        throw new Error(`AI provider "${provider}" not configured`);
    }
    return adapter;
}

export function setDefaultProvider(provider: string): void {
    if (!adapters.has(provider)) {
        throw new Error(`AI provider "${provider}" not available`);
    }
    defaultProvider = provider;
}

export async function aiComplete(request: AiRequest): Promise<AiResponse> {
    const adapter = getAdapter();
    return adapter.complete(request);
}

export async function aiModerate(
    content: string,
    contentType: "post" | "message" | "comment" | "profile",
    userId: string
): Promise<{
    flagged: boolean;
    categories: string[];
    confidence: number;
    reason?: string;
}> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a content moderation system for Velvet Galaxy, a social platform with both SFW and NSFW content. Classify the following ${contentType} content. Determine if it violates platform policies: no hate speech, no harassment, no illegal content, no spam. NSFW content is ALLOWED but must be tagged appropriately. Return JSON: {"flagged": boolean, "categories": string[], "confidence": number, "reason": string or null}. Categories may include: "hate_speech", "harassment", "spam", "illegal", "nsfw_untagged", "safe".`,
            },
            {
                role: "user",
                content: `Classify this ${contentType}: ${content.slice(0, 2000)}`,
            },
        ],
        temperature: 0.1,
        maxTokens: 256,
        feature: "content_moderation",
        userId,
    });

    try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    } catch {}

    return {
        flagged: false,
        categories: ["safe"],
        confidence: 0.5,
    };
}

export async function aiTranslate(
    content: string,
    targetLanguage: "en" | "fr",
    userId: string
): Promise<string> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a translation assistant for Velvet Galaxy. Translate the following content to ${targetLanguage === "en" ? "English" : "French"}. Preserve the tone, style, and formatting. Return ONLY the translated text, no explanations.`,
            },
            {
                role: "user",
                content: content,
            },
        ],
        temperature: 0.3,
        maxTokens: Math.ceil(content.length * 1.5),
        feature: "translation",
        userId,
    });

    return response.content;
}

export async function aiCompose(
    prompt: string,
    style: "casual" | "professional" | "flirtatious" | "neutral",
    userId: string
): Promise<string> {
    const styleGuide: Record<string, string> = {
        casual: "friendly, relaxed, using everyday language",
        professional: "polished, articulate, suitable for a professional context",
        flirtatious: "playful, charming, suggestive but respectful",
        neutral: "balanced, straightforward, neither too formal nor too casual",
    };

    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a writing assistant for Velvet Galaxy, a social platform. Help the user compose a post. Style: ${styleGuide[style]}. Keep it natural and engaging. Return ONLY the composed text.`,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        temperature: 0.8,
        maxTokens: 500,
        feature: "post_composer",
        userId,
    });

    return response.content;
}

export async function aiSuggestTags(
    content: string,
    userId: string
): Promise<string[]> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: 'You are a tagging assistant. Extract 3-8 relevant tags from the content. Return ONLY a JSON array of tag strings. Tags should be lowercase, relevant, and concise. Example: ["photography", "nature", "sunset"].',
            },
            {
                role: "user",
                content: content.slice(0, 1500),
            },
        ],
        temperature: 0.5,
        maxTokens: 200,
        feature: "tag_suggestions",
        userId,
    });

    try {
        const jsonMatch = response.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const tags = JSON.parse(jsonMatch[0]);
            if (Array.isArray(tags)) return tags.slice(0, 8);
        }
    } catch {}

    return [];
}

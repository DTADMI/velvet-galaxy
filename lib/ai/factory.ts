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

export async function aiRecommendContent(
    userId: string,
    userInterests: string[],
    recentActivity: string[]
): Promise<{ recommendations: string[]; reasoning: string }> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a content recommendation engine for Velvet Galaxy, a social platform. Based on the user's interests and recent activity, recommend content types, topics, or communities they might enjoy. Return JSON: {"recommendations": string[], "reasoning": string}.`,
            },
            {
                role: "user",
                content: `Interests: ${userInterests.join(", ") || "none"}. Recent activity: ${recentActivity.join(", ") || "none"}. What content would you recommend?`,
            },
        ],
        temperature: 0.7,
        maxTokens: 500,
        feature: "content_recommendations",
        userId,
    });

    try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return { recommendations: [], reasoning: "Unable to generate recommendations" };
}

export async function aiCaptionMedia(
    mediaDescription: string,
    mediaType: string,
    userId: string
): Promise<string> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a media captioning assistant for Velvet Galaxy. Generate a concise, engaging caption for this ${mediaType}. Keep it under 200 characters. Return ONLY the caption text.`,
            },
            {
                role: "user",
                content: mediaDescription,
            },
        ],
        temperature: 0.7,
        maxTokens: 200,
        feature: "media_caption",
        userId,
    });

    return response.content.slice(0, 200);
}

export async function aiChatAssist(
    goal: "conversation" | "icebreaker" | "profile_tips" | "social_coaching",
    context: string,
    userId: string
): Promise<string> {
    const goalPrompts: Record<string, string> = {
        conversation: "Help the user continue a conversation naturally. Suggest a reply or talking point.",
        icebreaker: "Suggest an engaging icebreaker or conversation starter based on shared interests.",
        profile_tips: "Provide tips to make the user's profile more engaging and authentic.",
        social_coaching: "Offer friendly social coaching advice for building connections on the platform.",
    };

    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are a social coaching assistant for Velvet Galaxy. ${goalPrompts[goal]} Keep advice positive, respectful, and practical. Return ONLY the suggestion or advice.`,
            },
            {
                role: "user",
                content: context,
            },
        ],
        temperature: 0.8,
        maxTokens: 512,
        feature: "chat_assistant",
        userId,
    });

    return response.content;
}

export async function aiOnboardUser(
    username: string,
    interests: string[],
    userId: string
): Promise<{ bioSuggestions: string[]; groupSuggestions: string[]; firstPostIdeas: string[]; welcomeMessage: string }> {
    const response = await aiComplete({
        model: "deepseek-v4-flash",
        messages: [
            {
                role: "system",
                content: `You are an onboarding assistant for Velvet Galaxy, a social platform. Help a new user get started. Based on their username and interests, generate: 1) 3 bio/profile suggestions, 2) 2-3 group/community suggestions, 3) 2-3 ideas for their first post, 4) a warm welcome message. Return JSON: {"bioSuggestions": string[], "groupSuggestions": string[], "firstPostIdeas": string[], "welcomeMessage": string}.`,
            },
            {
                role: "user",
                content: `Username: ${username}. Interests: ${interests.join(", ") || "general social"}.`,
            },
        ],
        temperature: 0.7,
        maxTokens: 1024,
        feature: "onboarding_assistant",
        userId,
    });

    try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return {
        bioSuggestions: ["Welcome to Velvet Galaxy!"],
        groupSuggestions: [],
        firstPostIdeas: ["Share what brought you here!"],
        welcomeMessage: `Welcome to Velvet Galaxy, ${username}! We're glad you're here.`,
    };
}

export async function aiGenerateGroupActivity(
    groupName: string,
    groupType: string,
    memberInterests: string[],
    userId: string
): Promise<{ title: string; description: string; type: string; suggestedDate?: string }> {
    const response = await aiComplete({
        model: "deepseek-v4-pro",
        messages: [
            {
                role: "system",
                content: `You are an activity suggestion engine for Velvet Galaxy groups. Generate an engaging group activity or event. Return JSON: {"title": string, "description": string, "type": string, "suggestedDate": string or null}. Types: "discussion", "challenge", "virtual_meetup", "collaborative_project", "game_night", "other".`,
            },
            {
                role: "user",
                content: `Group: ${groupName} (${groupType}). Member interests: ${memberInterests.join(", ") || "general"}. Suggest an activity!`,
            },
        ],
        temperature: 0.8,
        maxTokens: 1024,
        feature: "group_activity",
        userId,
    });

    try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
    } catch {}
    return {
        title: "Group Activity",
        description: "Let's get together and have some fun!",
        type: "discussion",
    };
}

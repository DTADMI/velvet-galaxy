export interface FeatureFlagDef {
    id: string;
    description: string;
    enabled: boolean;
    category: "core" | "ai";
}

export const FEATURE_FLAGS: Record<string, FeatureFlagDef> = {
    premium_tts: {
        id: "premium_tts",
        description: "Enable high-quality AI Text-to-Speech for premium users",
        enabled: true,
        category: "core",
    },
    beta_chat_rooms: {
        id: "beta_chat_rooms",
        description: "Access to experimental video chat rooms",
        enabled: true,
        category: "core",
    },
    marketplace_video: {
        id: "marketplace_video",
        description: "Support for video previews in marketplace listings",
        enabled: true,
        category: "core",
    },
    ai_recommendations: {
        id: "ai_recommendations",
        description: "Enable AI-powered content recommendations in Discovery",
        enabled: true,
        category: "core",
    },
    toy_viewer_3d: {
        id: "toy_viewer_3d",
        description: "Enable 3D interactive toy viewer in reviews",
        enabled: true,
        category: "core",
    },
    localized_discovery: {
        id: "localized_discovery",
        description: "Enable location-based filtering in Discovery Hub",
        enabled: true,
        category: "core",
    },
    ai_content_moderation: {
        id: "ai_content_moderation",
        description: "AI-powered content moderation for posts, messages, and comments",
        enabled: false,
        category: "ai",
    },
    ai_translation_assist: {
        id: "ai_translation_assist",
        description: "AI-assisted EN\u2194FR translation for posts and messages",
        enabled: false,
        category: "ai",
    },
    ai_post_composer: {
        id: "ai_post_composer",
        description: "AI writing assistant for creating post content",
        enabled: false,
        category: "ai",
    },
    ai_tag_suggestions: {
        id: "ai_tag_suggestions",
        description: "AI auto-suggest tags from post content",
        enabled: false,
        category: "ai",
    },
    ai_content_recommendations: {
        id: "ai_content_recommendations",
        description: "AI-powered personalized feed and content recommendations",
        enabled: false,
        category: "ai",
    },
    ai_people_discovery: {
        id: "ai_people_discovery",
        description: 'AI-powered social graph "People You May Know" recommendations',
        enabled: false,
        category: "ai",
    },
    ai_media_caption: {
        id: "ai_media_caption",
        description: "AI-generated captions for uploaded images and videos",
        enabled: false,
        category: "ai",
    },
    ai_chat_assistant: {
        id: "ai_chat_assistant",
        description: "AI social coaching and conversation suggestions",
        enabled: false,
        category: "ai",
    },
    ai_onboarding_assistant: {
        id: "ai_onboarding_assistant",
        description: "AI-guided new user onboarding and profile setup",
        enabled: false,
        category: "ai",
    },
    ai_group_activity: {
        id: "ai_group_activity",
        description: "AI activity and event suggestion generator for groups",
        enabled: false,
        category: "ai",
    },
};

export function getDefaultFlags(): Record<string, boolean> {
    const defaults: Record<string, boolean> = {};
    for (const [name, def] of Object.entries(FEATURE_FLAGS)) {
        defaults[name] = def.enabled;
    }
    return defaults;
}

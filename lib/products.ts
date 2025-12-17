export interface SubscriptionProduct {
    id: string
    name: string
    description: string
    priceInCents: number
    duration: "week" | "month" | "year" | "lifetime"
    features: string[]
}

// Subscription tiers for premium features
export const SUBSCRIPTION_PRODUCTS: SubscriptionProduct[] = [
    {
        id: "premium-week",
        name: "Premium Week",
        description: "Weekly premium access (renewable)",
        priceInCents: 999, // $9.99
        duration: "week",
        features: [
            "Share videos and GIFs",
            "Audio chat rooms",
            "Video chat rooms",
            "3D network visualization",
            "Advanced search filters",
            "Priority support",
        ],
    },
    {
        id: "premium-month",
        name: "Premium Month",
        description: "Monthly premium access (renewable)",
        priceInCents: 2999, // $29.99
        duration: "month",
        features: [
            "Share videos and GIFs",
            "Audio chat rooms",
            "Video chat rooms",
            "3D network visualization",
            "Advanced search filters",
            "Priority support",
            "Save 25% vs weekly",
        ],
    },
    {
        id: "premium-year",
        name: "Premium Year",
        description: "Yearly premium access (renewable)",
        priceInCents: 19999, // $199.99
        duration: "year",
        features: [
            "Share videos and GIFs",
            "Audio chat rooms",
            "Video chat rooms",
            "3D network visualization",
            "Advanced search filters",
            "Priority support",
            "Save 44% vs monthly",
            "Exclusive yearly badge",
        ],
    },
    {
        id: "premium-lifetime",
        name: "Premium Lifetime",
        description: "Lifetime premium access (one-time payment)",
        priceInCents: 49999, // $499.99
        duration: "lifetime",
        features: [
            "Share videos and GIFs",
            "Audio chat rooms",
            "Video chat rooms",
            "3D network visualization",
            "Advanced search filters",
            "Priority support",
            "Lifetime access - never pay again",
            "Exclusive lifetime badge",
            "Early access to new features",
        ],
    },
];

// Helper to check if user has premium access
export function isPremiumFeature(feature: string): boolean {
    const premiumFeatures = ["video-upload", "gif-upload", "audio-chat", "video-chat", "3d-network"];
    return premiumFeatures.includes(feature);
}

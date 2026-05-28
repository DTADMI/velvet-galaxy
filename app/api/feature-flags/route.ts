import { NextResponse } from "next/server";
import { getFeatureFlags, invalidateFlagCache } from "@/lib/feature-flags.server";

export async function GET() {
    try {
        const flags = await getFeatureFlags();
        return NextResponse.json(flags);
    } catch (error) {
        console.error("[VG:API:FeatureFlags] GET failed:", error);
        return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
    }
}

export async function POST() {
    try {
        await invalidateFlagCache();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[VG:API:FeatureFlags] POST failed:", error);
        return NextResponse.json({ error: "Failed to invalidate cache" }, { status: 500 });
    }
}

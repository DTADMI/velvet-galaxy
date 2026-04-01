import "server-only";

import Stripe from "stripe";

export function getStripeClient() {
    const apiKey = process.env.STRIPE_SECRET_KEY;

    if (!apiKey) {
        throw new Error("STRIPE_SECRET_KEY is required for Stripe operations");
    }

    return new Stripe(apiKey);
}

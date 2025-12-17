import {ArrowLeft} from "lucide-react";
import Link from "next/link";
import {redirect} from "next/navigation";
import {Suspense} from "react";

import SubscriptionCheckout from "@/components/subscription-checkout";
import {Button} from "@/components/ui/button";

export default async function CheckoutPage({
                                               searchParams,
                                           }: {
    searchParams: Promise<{ product?: string }>
}) {
    const params = await searchParams;
    const productId = params.product;

    if (!productId) {
        redirect("/subscribe");
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-3xl mx-auto">
                <Button variant="ghost" asChild className="mb-6">
                    <Link href="/subscribe">
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Back to Plans
                    </Link>
                </Button>

                <Suspense
                    fallback={
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <div
                                    className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading checkout...</p>
                            </div>
                        </div>
                    }
                >
                    <SubscriptionCheckout productId={productId}/>
                </Suspense>
            </div>
        </div>
    );
}

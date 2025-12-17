import Link from "next/link";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";

export default function SignUpSuccessPage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center p-6">
            <div className="w-full max-w-sm">
                <Card className="border-royal-blue/20">
                    <CardHeader>
                        <CardTitle className="text-2xl">Check Your Email</CardTitle>
                        <CardDescription>We&apos;ve sent you a confirmation link</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Please check your email and click the confirmation link to activate your account. Once
                            confirmed, you can
                            sign in and start exploring.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/auth/login">Back to Sign In</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

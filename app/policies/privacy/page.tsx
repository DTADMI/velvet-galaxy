import {ShieldCheck} from "lucide-react";

import {Navigation} from "@/components/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export default function PrivacyPage() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8 text-center">
                        <ShieldCheck className="h-16 w-16 mx-auto mb-4 text-royal-purple"/>
                        <h1 className="text-3xl font-bold text-gradient mb-2">Privacy Policy</h1>
                        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                title: "1. Information We Collect",
                                content:
                                    "We collect information you provide directly to us, such as when you create an account, update your profile, post content, or communicate with other users. This includes your username, email address, profile information, and any media you upload.",
                            },
                            {
                                title: "2. How We Use Your Information",
                                content:
                                    "We use the information we collect to provide, maintain, and improve our services, to personalize your experience, to facilitate communication between users, and to protect the security of our platform.",
                            },
                            {
                                title: "3. Sharing of Information",
                                content:
                                    "Your profile information and content you post are visible to other users according to your privacy settings. We do not sell your personal information to third parties. We may share information with service providers who perform services on our behalf.",
                            },
                            {
                                title: "4. Data Security",
                                content:
                                    "We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. However, no internet transmission is ever fully secure or error-free.",
                            },
                            {
                                title: "5. Your Choices",
                                content:
                                    "You can update your account information and privacy settings at any time. You can also request to delete your account, which will remove your personal information from our active databases.",
                            },
                            {
                                title: "6. Cookies and Tracking",
                                content:
                                    "We use cookies and similar tracking technologies to analyze trends, administer the website, and track users' movements around the platform to provide a better user experience.",
                            },
                        ].map((section, i) => (
                            <Card key={i} className="border-royal-purple/20 bg-card/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">{section.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}

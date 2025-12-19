import {FileText} from "lucide-react";

import {Navigation} from "@/components/navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

export default function TermsPage() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8 text-center">
                        <FileText className="h-16 w-16 mx-auto mb-4 text-royal-purple"/>
                        <h1 className="text-3xl font-bold text-gradient mb-2">Terms of Service</h1>
                        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            {
                                title: "1. Acceptance of Terms",
                                content:
                                    "By accessing and using Velvet Galaxy, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.",
                            },
                            {
                                title: "2. User Accounts",
                                content:
                                    "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
                            },
                            {
                                title: "3. User Content",
                                content:
                                    "You retain all rights to the content you post on Velvet Galaxy. By posting content, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content on the platform. You are responsible for ensuring you have the rights to any content you post.",
                            },
                            {
                                title: "4. Prohibited Conduct",
                                content:
                                    "You agree not to use Velvet Galaxy to post or transmit any content that is illegal, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or otherwise objectionable. You may not impersonate others or engage in any activity that interferes with the platform's operation.",
                            },
                            {
                                title: "5. Privacy",
                                content:
                                    "Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your personal information. By using Velvet Galaxy, you consent to our data practices as described in the Privacy Policy.",
                            },
                            {
                                title: "6. Marketplace Transactions",
                                content:
                                    "Velvet Galaxy provides a platform for users to buy and sell items locally. We are not responsible for the quality, safety, or legality of items listed, the accuracy of listings, or the ability of sellers to complete transactions. All transactions are between users.",
                            },
                            {
                                title: "7. Intellectual Property",
                                content:
                                    "The Velvet Galaxy platform, including its design, features, and functionality, is owned by us and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or distribute any part of the platform without our permission.",
                            },
                            {
                                title: "8. Termination",
                                content:
                                    "We reserve the right to suspend or terminate your account at any time for any reason, including violation of these terms. Upon termination, your right to use the service will immediately cease.",
                            },
                            {
                                title: "9. Disclaimer of Warranties",
                                content:
                                    'Velvet Galaxy is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.',
                            },
                            {
                                title: "10. Changes to Terms",
                                content:
                                    "We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of Velvet Galaxy after changes constitutes acceptance of the new terms.",
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

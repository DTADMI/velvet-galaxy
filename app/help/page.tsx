import {HelpCircle, Mail, MessageSquare} from "lucide-react";
import Link from "next/link";

import {Navigation} from "@/components/navigation";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Textarea} from "@/components/ui/textarea";

export default function HelpPage() {
    return (
        <>
            <Navigation/>
            <main className="min-h-screen bg-background pt-20 pb-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8 text-center">
                        <HelpCircle className="h-16 w-16 mx-auto mb-4 text-royal-purple"/>
                        <h1 className="text-3xl font-bold text-gradient mb-2">Help & Support</h1>
                        <p className="text-muted-foreground">We're here to help you with any questions or issues</p>
                        <div className="flex justify-center gap-4 mt-6">
                            <Button asChild variant="outline" className="border-royal-purple/20">
                                <Link href="/policies/terms">Terms of Service</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-royal-purple/20">
                                <Link href="/policies/privacy">Privacy Policy</Link>
                            </Button>
                            <Button asChild variant="outline" className="border-royal-purple/20">
                                <Link href="/about">About Us</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-6 mb-8">
                        <Card className="border-royal-purple/20 bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-gradient">Frequently Asked Questions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {[
                                    {
                                        q: "How do I create a group?",
                                        a: "Navigate to the Groups page and click the 'Create Group' button. Fill in the details and choose your privacy settings.",
                                    },
                                    {
                                        q: "How do I join a chat room?",
                                        a: "Go to the Chat Rooms section from the Messages page, browse available rooms, and click 'Join' on any room you'd like to participate in.",
                                    },
                                    {
                                        q: "How do I upload media?",
                                        a: "Visit your profile, go to the Media section, and click 'Upload Media'. You can organize your content into albums and add tags for easy discovery.",
                                    },
                                    {
                                        q: "How do I change my theme?",
                                        a: "Go to Settings > Appearance and toggle between Light and Dark mode according to your preference.",
                                    },
                                ].map((faq, i) => (
                                    <div key={i} className="p-4 rounded-lg bg-background/50">
                                        <h3 className="font-semibold mb-2">{faq.q}</h3>
                                        <p className="text-sm text-muted-foreground">{faq.a}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-royal-purple/20 bg-card/50">
                            <CardHeader>
                                <CardTitle className="text-gradient flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5"/>
                                    Contact Support
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form className="space-y-4">
                                    <div>
                                        <Label>Your Email</Label>
                                        <Input type="email" placeholder="your@email.com" className="mt-2"/>
                                    </div>
                                    <div>
                                        <Label>Subject</Label>
                                        <Input placeholder="What do you need help with?" className="mt-2"/>
                                    </div>
                                    <div>
                                        <Label>Message</Label>
                                        <Textarea placeholder="Describe your issue or question..." className="mt-2"
                                                  rows={6}/>
                                    </div>
                                    <Button className="w-full bg-gradient-to-r from-royal-purple to-royal-blue">
                                        <Mail className="h-4 w-4 mr-2"/>
                                        Send Message
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </>
    );
}

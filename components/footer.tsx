import Link from "next/link";
import {VelvetLogo} from "@/components/velvet-logo";

export function Footer() {
    return (
        <footer className="border-t border-border bg-gradient-to-b from-card to-card/50 backdrop-blur">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <VelvetLogo size="md" showText/>
                        <p className="text-sm text-muted-foreground">
                            Connect with your community, share experiences, and build meaningful connections.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gradient">About</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about"
                                      className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    About Velvet Galaxy
                                </Link>
                            </li>
                            <li>
                                <Link href="/help"
                                      className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    Help & FAQ
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/terms"
                                      className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/policies/privacy"
                                      className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gradient">Community</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/discover"
                                      className="text-sm text-muted-foreground hover:text-royal-blue transition-colors">
                                    Discover People
                                </Link>
                            </li>
                            <li>
                                <Link href="/groups"
                                      className="text-sm text-muted-foreground hover:text-royal-green transition-colors">
                                    Groups
                                </Link>
                            </li>
                            <li>
                                <Link href="/events"
                                      className="text-sm text-muted-foreground hover:text-royal-orange transition-colors">
                                    Events
                                </Link>
                            </li>
                            <li>
                                <Link href="/marketplace"
                                      className="text-sm text-muted-foreground hover:text-royal-green transition-colors">
                                    Marketplace
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-lg mb-4 text-gradient">Contact</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/help"
                                      className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    Support
                                </Link>
                            </li>
                            <li>
                                <a href="mailto:support@velvetgalaxy.com"
                                   className="text-sm text-muted-foreground hover:text-royal-purple transition-colors">
                                    support@velvetgalaxy.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Velvet Galaxy. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

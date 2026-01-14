import Link from "next/link";
import {VelvetLogo} from "@/components/velvet-logo";
import {Button} from "@/components/ui/button";
import {ThemeToggle} from "@/components/theme-toggle";
import {LanguageSelector} from "@/components/language-selector";

export function AuthNavigation() {
    return (
        <nav
            aria-label="Authentication navigation"
            className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-gradient-to-r from-card/95 via-card/98 to-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80"
        >
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2" aria-label="Go to home">
                    <VelvetLogo size="sm"/>
                </Link>

                <div className="flex items-center gap-3">
                    <LanguageSelector/>
                    <ThemeToggle/>
                    <Button
                        asChild
                        variant="ghost"
                        className="hover:bg-royal-purple/10 hover:text-royal-purple"
                    >
                        <Link href="/auth/login">Log In</Link>
                    </Button>
                    <Button
                        asChild
                        className="bg-gradient-to-r from-royal-auburn to-royal-purple hover:from-royal-auburn-dark hover:to-royal-purple-dark text-white shadow-lg shadow-royal-purple/30"
                    >
                        <Link href="/auth/sign-up">Enter the Galaxy</Link>
                    </Button>
                </div>
            </div>
        </nav>
    );
}

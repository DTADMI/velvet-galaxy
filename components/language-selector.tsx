"use client";

import { Globe } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/provider";

const languageAbbreviations: Record<Locale, string> = {
    en: "EN",
    fr: "FR",
    es: "ES",
    de: "DE",
};

export function LanguageSelector() {
    const { locale, setLocale } = useI18n();
    const router = useRouter();

    const handleLanguageChange = (next: Locale) => {
        // setLocale updates state, localStorage and the locale cookie.
        setLocale(next);
        // Refresh server components so their resolved locale follows the cookie.
        router.refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{languageAbbreviations[locale]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {locales.map((code) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        className={locale === code ? "bg-accent" : ""}
                    >
                        <span className="font-semibold mr-2">{languageAbbreviations[code]}</span>
                        {localeNames[code]}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

"use client";

import {Globe} from "lucide-react";
import {useEffect, useState} from "react";

import {Button} from "@/components/ui/button";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import {type Language, languages} from "@/lib/i18n";

const languageAbbreviations: Record<Language, string> = {
    en: "EN",
    fr: "FR",
    es: "ES",
    de: "DE",
    it: "IT",
    pt: "PT",
};

export function LanguageSelector() {
    const [currentLanguage, setCurrentLanguage] = useState<Language>("en");

    useEffect(() => {
        const saved = localStorage.getItem("velvet_galaxy-language") as Language;
        if (saved && languages[saved]) {
            setCurrentLanguage(saved);
        }
    }, []);

    const handleLanguageChange = (lang: Language) => {
        setCurrentLanguage(lang);
        localStorage.setItem("velvet_galaxy-language", lang);
        window.location.reload();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Globe className="h-4 w-4"/>
                    <span>{languageAbbreviations[currentLanguage]}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(languages).map(([code, name]) => (
                    <DropdownMenuItem
                        key={code}
                        onClick={() => handleLanguageChange(code as Language)}
                        className={currentLanguage === code ? "bg-accent" : ""}
                    >
                        <span className="font-semibold mr-2">{languageAbbreviations[code as Language]}</span>
                        {name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

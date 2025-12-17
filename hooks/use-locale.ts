"use client";

import {useEffect, useState} from "react";

import type {Locale} from "@/lib/i18n/config";
import {defaultLocale} from "@/lib/i18n/config";

export function useLocale() {
    const [locale, setLocaleState] = useState<Locale>(defaultLocale);

    useEffect(() => {
        const cookieLocale = document.cookie
            .split("; ")
            .find((row) => row.startsWith("NEXT_LOCALE="))
            ?.split("=")[1] as Locale | undefined;

        if (cookieLocale) {
            setLocaleState(cookieLocale);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
        setLocaleState(newLocale);
        window.location.reload();
    };

    return {locale, setLocale};
}

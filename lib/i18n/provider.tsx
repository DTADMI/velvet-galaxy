"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const SUPPORTED_LOCALES = ["en", "fr"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = "fr";
const STORAGE_KEY = "velvet_galaxy-locale";

type TranslationDict = Record<string, any>;

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key: string, fallback?: string) => fallback ?? key,
});

function resolveNested(obj: TranslationDict, path: string): string | undefined {
    return path.split(".").reduce((current, key) => current?.[key], obj as any);
}

function getStoredLocale(): Locale {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "fr") return stored;
    } catch {}
    if (typeof navigator !== "undefined") {
        const browserLang = navigator.language?.split("-")[0];
        if (browserLang === "fr") return "fr";
    }
    return DEFAULT_LOCALE;
}

async function loadDict(locale: Locale): Promise<TranslationDict> {
    try {
        if (locale === "fr") {
            const mod = await import("@/lib/i18n/dictionaries/fr.json");
            return (mod as any).default ?? mod;
        }
        const mod = await import("@/lib/i18n/dictionaries/en.json");
        return (mod as any).default ?? mod;
    } catch {
        return {};
    }
}

export function I18nProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale ?? getStoredLocale);
    const [dictionary, setDictionary] = useState<TranslationDict>({});

    useEffect(() => {
        loadDict(locale).then(setDictionary);
    }, [locale]);

    const setLocale = useCallback((next: Locale) => {
        setLocaleState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
            document.cookie = `${STORAGE_KEY}=${next};path=/;max-age=31536000;samesite=lax`;
        } catch {}
    }, []);

    const t = useCallback(
        (key: string, fallback?: string): string => {
            const value = resolveNested(dictionary, key);
            if (typeof value === "string") return value;
            return fallback ?? key;
        },
        [dictionary]
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    return useContext(I18nContext);
}

export function useTranslation() {
    const { t, locale, setLocale } = useContext(I18nContext);
    return { t, locale, setLocale };
}

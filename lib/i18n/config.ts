export const defaultLocale = "en" as const;
export const locales = ["en", "fr", "es", "de"] as const;

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    en: "English",
    fr: "Français",
    es: "Español",
    de: "Deutsch",
};

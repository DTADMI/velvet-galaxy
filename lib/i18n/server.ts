import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

const COOKIE_NAME = "velvet_galaxy-locale";

async function resolveLocale(): Promise<Locale> {
  try {
    const c = await cookies();
    const v = c.get(COOKIE_NAME)?.value;
    if (v && (locales as readonly string[]).includes(v)) return v as Locale;
  } catch {}
  try {
    const h = await headers();
    const m = (h.get("accept-language") || "").match(/[a-z]{2}(?:-[A-Z]{2})?/g);
    if (m) {
      for (const l of m) {
        const b = l.split("-")[0].toLowerCase();
        if (b === "fr") return "fr";
        if (b === "en") return "en";
        if (b === "es") return "es";
        if (b === "de") return "de";
      }
    }
  } catch {}
  return defaultLocale;
}

export async function getServerTranslations() {
  const locale = await resolveLocale();
  const dictionary = await getDictionary(locale);

  function t(key: string, fallback?: string): string {
    const keys = key.split(".");
    let value: unknown = dictionary;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        return fallback ?? key;
      }
    }
    return typeof value === "string" ? value : (fallback ?? key);
  }

  return { locale, t };
}

export { resolveLocale };

# Velvet Galaxy — i18n Status Audit

**Audit Date**: 2026-05-29 (updated)

## Approach

| Aspect | Value |
|--------|-------|
| Pattern | React Context with JSON dictionaries |
| Config | `lib/i18n/config.ts` |
| Provider | `lib/i18n/provider.tsx` (I18nProvider, useI18n, useTranslation hooks) |
| Translation format | JSON dictionaries (`lib/i18n/dictionaries/*.json`) |
| Default locale | `fr` (correct) |
| Locale resolution | localStorage → navigator.language → default `fr` |

## Locale Configuration

| Setting | Value |
|---------|-------|
| Default locale | `fr` (correct) |
| Supported locales | en, fr |
| Cookie name | `velvet_galaxy-locale` |

## Translation Key Counts

| Locale | Keys | Status |
|--------|------|--------|
| EN | 358 | Baseline |
| FR | 358 | Fully synced |

## Quebec French Conventions

| Convention | Count | Notes |
|------------|-------|-------|
| "connexion" (vs "login") | 10 occurrences | All auth keys use Quebec French |
| "courriel" (vs "email") | 3 occurrences | Settings keys use Quebec French |
| "mot de passe" (vs "password") | 3 occurrences | Settings keys use Quebec French |
| "langue d'affichage" (vs "language") | 1 occurrence | Fixed in settings key |
| "téléchargement" (vs "download" noun) | 1 occurrence | Fixed from verb form |

## Migration Status

The i18n provider (`lib/i18n/provider.tsx`) is built and ready. Components can use:

```tsx
import { useI18n } from "@/lib/i18n/provider";
const { t, locale, setLocale } = useI18n();
// t('auth.welcomeBack') → "Bon retour" (fr) or "Welcome Back" (en)
```

**Component migration is in progress** — most components still use hardcoded English strings. The provider, hooks, and dictionaries are fully functional.

## Assessment

- Dictionary parity: Complete (358 EN = 358 FR)
- Default locale `fr` is correct
- React Context provider + hooks implemented (`lib/i18n/provider.tsx`)
- Quebec French conventions adopted in all FR dictionary values
- Component-level i18n migration is ongoing

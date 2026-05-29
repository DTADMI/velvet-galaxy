# Velvet Galaxy — i18n Status Audit

**Audit Date**: 2026-05-29

## Approach

| Aspect | Value |
|--------|-------|
| Pattern | Cross-project Context pattern (dictionary-based variant) |
| Config | `lib/i18n/config.ts` |
| Provider | `lib/i18n/dictionaries.ts` (loads JSON dictionaries) |
| Translation format | JSON dictionaries (`lib/i18n/dictionaries/*.json`) |
| Locale resolution | Via dictionary loader, default `fr` |

## Locale Configuration

| Setting | Value |
|---------|-------|
| Default locale | `fr` (correct) |
| Supported locales | en, fr, es, de |
| Cookie name | Not explicitly named (uses React state + localStorage) |

## Translation Key Counts

| Locale | Keys | Status |
|--------|------|--------|
| EN | 358 | Baseline |
| FR | 358 | Fully synced |
| ES | ~358 | Available |
| DE | ~358 | Available |

## Quebec French Conventions

| Convention | Count | Notes |
|------------|-------|-------|
| "connexion" (vs "login") | 10 occurrences | Good — all auth keys use Quebec French |
| "courriel" (vs "email") | 3 occurrences | Good — "Changer le courriel" used in settings |
| "mot de passe" (vs "password") | 3 occurrences | Good — "Changer le mot de passe" used in settings |
| "langue d'affichage" (vs "language") | 1 occurrence | Fixed — was "Langue" now "Langue d'affichage" |
| "téléchargement" (vs "download" noun) | 1 occurrence | Fixed — was "Télécharger" (verb) now "Téléchargement" (noun) |
| "login" / "Log in" in FR | 0 occurrences | Cleaned |
| "email" in FR | 0 occurrences | Cleaned |
| "password" in FR | 0 occurrences | Cleaned |
| Hardcoded `t('en', ...)` | 0 | Clean |

## Missing Translations

- No missing FR key parity issues (358 EN = 358 FR)
- Quebec French conventions: all known Anglicisms resolved

## Assessment

- FR key parity is complete (358/358)
- Default locale `fr` is correct
- Uses cross-project Context pattern (dictionary variant - functionally equivalent)
- Quebec French conventions partially adopted; ~14 locations use Anglicisms instead
- Multi-locale support for ES and DE is a bonus
- No hardcoded English locale argument calls found

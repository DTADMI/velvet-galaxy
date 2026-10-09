export const defaultLocale = "fr" as const;

// Langues PROPOSEES dans le selecteur. La regle : une langue proposee doit etre
// COMPLETE (100 % des cles de la reference anglaise).
//
// L'espagnol et l'allemand ne sont pas listes ici : leurs dictionnaires ne
// contenaient que 36 cles sur 469, soit 7,7 %. Les proposer donnait une interface
// a 92 % anglaise apres un choix explicite de l'utilisateur, sans aucun message.
// Une langue a moitie traduite vaut moins qu'une langue absente.
//
// Pour ajouter une langue : completer son dictionnaire, puis l'ajouter ici. La
// garde `scripts/check-i18n-completeness.mjs` refusera toute locale proposee qui
// ne serait pas complete.
export const locales = ["en", "fr"] as const;

export type Locale = (typeof locales)[number]

export const localeNames: Record<Locale, string> = {
    en: "English",
    fr: "Français",
};

/**
 * Dictionnaires presents sur le disque mais NON proposes, parce qu'incomplets.
 * Ils restent suivis ici pour que le travail commence ne soit pas perdu, sans
 * pour autant etre offert a l'utilisateur.
 */
export const pendingLocales = ["es", "de"] as const;

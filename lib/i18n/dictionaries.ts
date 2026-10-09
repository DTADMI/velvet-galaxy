import type {Locale} from "./config";

// Seules les langues COMPLETES sont cablees. Les dictionnaires es.json et de.json
// existent sur le disque (36 cles sur 469) mais ne sont pas branches : le type
// `Locale` ne les connait pas, donc les referencer ne compilerait pas. C'est
// volontaire : ca rend impossible d'offrir une langue a moitie traduite par
// inadvertance.
const dictionaries = {
    en: () => import("./dictionaries/en.json").then((module) => module.default),
    fr: () => import("./dictionaries/fr.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    return dictionaries[locale]();
};

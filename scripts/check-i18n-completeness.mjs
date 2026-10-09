#!/usr/bin/env node
// check-i18n-completeness.mjs - une locale proposee doit etre COMPLETE.
//
// POURQUOI CETTE GARDE
//   Velvet Galaxy offrait quatre langues (en, fr, es, de) dans le selecteur.
//   L'anglais et le francais comptaient 469 cles chacune ; l'espagnol et
//   l'allemand en comptaient 36, soit 8 %. Un utilisateur qui choisissait
//   « Espanol » obtenait donc une interface a 92 % anglaise, sans aucun message.
//   C'est une fonctionnalite a demi-faite presentee comme terminee : le pire cas,
//   parce qu'elle ne produit aucune erreur.
//
// CE QU'ELLE VERIFIE
//   1. chaque locale declaree dans `config.locales` (donc PROPOSEE) possede au
//      moins `SEUIL` % des cles de la reference (anglais) ;
//   2. les dictionnaires presents sur le disque mais NON declares sont SIGNALES
//      avec leur taux, sans faire echouer : c'est un chantier, pas une faute.
//
// USAGE
//   node scripts/check-i18n-completeness.mjs           # rapport
//   node scripts/check-i18n-completeness.mjs --strict  # code 1 si une locale proposee est incomplete
import fs from "node:fs";
import path from "node:path";

const STRICT = process.argv.includes("--strict");
const REFERENCE = "en";
const THRESHOLD = 100;

const CONFIG = "lib/i18n/config.ts";
const DICT_DIR = "lib/i18n/dictionaries";

/** Aplatit un dictionnaire imbrique en cles pointees. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) Object.assign(out, flatten(v, key));
    else out[key] = v;
  }
  return out;
}

function readDictionary(locale) {
  const file = path.join(DICT_DIR, `${locale}.json`);
  if (!fs.existsSync(file)) return null;
  return flatten(JSON.parse(fs.readFileSync(file, "utf-8")));
}

/** Lit les locales proposees depuis la source de verite (`config.locales`). */
function declaredLocales() {
  if (!fs.existsSync(CONFIG)) return null;
  const src = fs.readFileSync(CONFIG, "utf-8");
  const m = src.match(/export const locales\s*=\s*\[([^\]]*)\]/);
  if (!m) return null;
  return (m[1].match(/["']([a-z]{2})["']/g) ?? []).map((s) => s.replace(/["']/g, ""));
}

const declared = declaredLocales();
if (declared === null) {
  console.error(`  ✗ ${CONFIG} : impossible de lire les locales declarees.`);
  process.exit(STRICT ? 1 : 0);
}

const reference = readDictionary(REFERENCE);
if (reference === null) {
  console.error(`  ✗ dictionnaire de reference introuvable : ${DICT_DIR}/${REFERENCE}.json`);
  process.exit(STRICT ? 1 : 0);
}
const referenceKeys = new Set(Object.keys(reference));

const onDisk = fs
  .readdirSync(DICT_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();

const failures = [];
console.log(`Verification i18n : reference ${REFERENCE} (${referenceKeys.size} cles), seuil ${THRESHOLD} %.`);
console.log("");
console.log(`  Locales proposees : ${declared.join(", ")}`);

for (const locale of declared) {
  const dict = readDictionary(locale);
  if (dict === null) {
    failures.push(`${locale} : declaree mais aucun dictionnaire`);
    console.log(`  ✗ ${locale} : declaree mais aucun dictionnaire`);
    continue;
  }
  const keys = new Set(Object.keys(dict));
  const covered = [...referenceKeys].filter((k) => k in dict).length;
  const pct = ((covered / referenceKeys.size) * 100).toFixed(1);
  const ok = Number(pct) >= THRESHOLD;
  console.log(`  ${ok ? "✓" : "✗"} ${locale} : ${keys.size} cles, ${pct} % de la reference`);
  if (!ok) failures.push(`${locale} : ${pct} % (${referenceKeys.size - covered} cles manquantes)`);
}

const undeclared = onDisk.filter((l) => !declared.includes(l));
if (undeclared.length > 0) {
  console.log("");
  console.log("  Dictionnaires sur le disque mais non proposes (chantier, non bloquant) :");
  for (const locale of undeclared) {
    const dict = readDictionary(locale);
    const covered = [...referenceKeys].filter((k) => k in (dict ?? {})).length;
    const pct = ((covered / referenceKeys.size) * 100).toFixed(1);
    console.log(`    - ${locale} : ${pct} % — proposer cette langue exigerait de la completer a ${THRESHOLD} %`);
  }
}

console.log("");
if (failures.length > 0) {
  console.log(`${failures.length} locale(s) proposee(s) incomplete(s) :`);
  for (const f of failures) console.log(`  - ${f}`);
  console.log("Completer la locale, ou la retirer de config.locales : une langue a moitie traduite vaut moins qu'une langue absente.");
}

process.exit(STRICT && failures.length > 0 ? 1 : 0);

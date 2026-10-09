# Velvet Galaxy - Etat de l'i18n

**Derniere mise a jour** : 2026-10-08

## Approche

| Aspect | Valeur |
| --- | --- |
| Motif | React Context avec dictionnaires JSON |
| Configuration | `lib/i18n/config.ts` |
| Fournisseur | `lib/i18n/provider.tsx` (`I18nProvider`, `useI18n`, `useTranslation`) |
| Format | `lib/i18n/dictionaries/*.json` |
| Langue par defaut | `fr` |
| Resolution | localStorage, puis `navigator.language`, puis `fr` |
| Cookie | `velvet_galaxy-locale` |

## Langues proposees

**Deux langues, et elles doivent etre completes** : `en` et `fr`.

| Langue | Cles | Etat |
| --- | --- | --- |
| EN (reference) | 469 | complet |
| FR | 469 | complet, parite exacte |

## Langues presentes mais NON proposees

| Langue | Cles | Taux | Raison |
| --- | --- | --- | --- |
| ES | 36 | 7,7 % | incomplet |
| DE | 36 | 7,7 % | incomplet |

**Decision du 2026-10-08.** L'espagnol et l'allemand etaient **offerts dans le selecteur** alors que leurs dictionnaires ne couvraient que 36 cles sur 469. Un utilisateur qui choisissait « Espanol » obtenait donc une interface a **92 % anglaise**, sans aucun message : une fonctionnalite a demi-faite presentee comme terminee, et le pire cas, parce qu'elle ne produit aucune erreur.

Les deux langues ont donc ete **retirees des langues proposees** (`locales`), pas supprimees :

- `config.locales = ["en", "fr"]` ;
- `config.pendingLocales = ["es", "de"]` documente le chantier en cours ;
- `lib/i18n/dictionaries.ts` ne cable que les langues completes : le type `Locale` ne connait pas `es` ni `de`, donc **les referencer ne compilerait pas**. Une langue a moitie traduite ne peut plus etre offerte par inadvertance, meme par erreur ;
- `lib/i18n/server.ts` ne resout plus `es` ni `de` depuis `Accept-Language` : un navigateur en espagnol obtient le defaut francais, ce qui est plus honnete qu'une interface anglaise deguisee.

Le repli sur l'anglais **reste en place** (`provider.tsx`) pour les cles manquantes a l'interieur d'une langue complete. Il protege contre un oubli ponctuel ; il ne doit pas servir a couvrir une langue entiere.

## Garde

```bash
pnpm check:i18n        # ou: node scripts/check-i18n-completeness.mjs --strict
```

Le script lit `config.locales` (la source de verite, pas une liste ecrite ailleurs) et **echoue** si une langue proposee couvre moins de **100 %** des cles de la reference anglaise. Il signale aussi, sans echouer, les dictionnaires presents sur le disque mais non proposes, avec leur taux.

La garde est branchee a deux endroits : `.githooks/pre-commit` et `pnpm run-all-checks`.

## Pour ajouter une langue

1. completer son dictionnaire JSON jusqu'a 100 % des cles anglaises ;
2. ajouter la langue a `config.locales` et a `localeNames` ;
3. la retirer de `config.pendingLocales` ;
4. la cabler dans `dictionaries.ts`.

L'etape 4 est impossible avant l'etape 1 : c'est le type qui l'impose, pas une consigne.

## Conventions de francais quebecois

| Convention | Exemple |
| --- | --- |
| « connexion » plutot que « login » | cles d'authentification |
| « courriel » plutot que « email » | cles de parametres |
| « mot de passe » | cles de parametres |
| « langue d'affichage » | parametres |
| « telechargement » (nom) | cles de fichiers |

## Limite connue

La migration des composants vers l'i18n est **partielle** : une partie des composants porte encore des chaines en dur. Le fournisseur, les crochets et les dictionnaires sont fonctionnels ; le travail restant est au niveau des composants, pas de l'infrastructure.

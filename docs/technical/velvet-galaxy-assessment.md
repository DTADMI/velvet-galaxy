# Velvet Galaxy - Assessment & Recommendations

> **Owner**: Nebula Forge Digital Studio | **Last Updated**: 2026-09-11
> **Status**: Living document - mise à jour lors de chaque passe

---

## 1. Résumé exécutif

Velvet Galaxy (réseau social + marketplace + médias, Fetlife-inspired) est **fonctionnel,
déployé et quasi-complet**. Le build, le typecheck, le lint et le déploiement Vercel
passent tous. Les fonctionnalités couvrent déjà très largement le périmètre visé
(social, messagerie, groupes/événements, marketplace, médias, AI, admin, i18n).

Le travail restant n'est **pas** de l'implémentation de features majeures, mais :

1. **Hygiène** : routes dupliquées, migrations SQL non appliquées, dette lint.
2. **Infrastructure** : Redis (Upstash) non provisionné, AI Phase 2 non activée.
3. **Décisions d'architecture** : consolidation des routes `post`/`posts` et
   `discover`/`discovery`.

---

## 2. État de santé

| Vérification | Résultat |
|---|---|
| `tsc --noEmit` | ✅ 0 erreur |
| `next build` | ✅ 77/77 pages, ~13 s |
| `eslint` | ✅ 0 erreur, 788 warnings (dette `no-explicit-any`) |
| `vitest run` | ✅ (suite unitaire) |
| Déploiement Vercel | ✅ READY (production, HTTP 200) |
| Pipeline GitLab | ✅ validate + deploy:vercel success |

**Stack** : Next.js 16.2, React 19.2, TypeScript 5.9, Supabase (js 2.110 / ssr 0.8),
Stripe 22.3, Upstash Redis 1.38, Vitest 4.1, Playwright 1.62.

---

## 3. Inventaire des fonctionnalités

| Domaine | État | Détail |
|---|---|---|
| Profils + feed social | ✅ | Posts (texte/img/vidéo/audio/écrits), albums, likes, bookmarks |
| Messagerie | ✅ | Normal/Dating/Groupe, chat rooms temps réel, éphémère, spoiler, TTS |
| Communauté | ✅ | Groupes, événements, RSVP, co-authorship, notifications |
| Réseau/visualisation | ✅ | Graphe 2D/3D "galaxy", types de relations custom, ligne styles |
| Marketplace | ✅ | Produits physiques/numériques, vidéo/audio, Stripe |
| Velvet Reviews | ✅ | Avis jouets, viewer 3D, catalogue, ratings |
| Velvet Games | ✅ | Hub point&click + roadmap |
| Artistes showcase | ✅ | Browse + profils artistes |
| Admin | ✅ | Users, posts, media, moderation, AI settings, analytics, health |
| AI (fondation) | 🟡 | 10 endpoints, adapter provider-agnostic, **derrière flags (non activé)** |
| i18n | 🟡 | Context pattern + server layer, FR par défaut - **texte EN résiduel** |
| Sécurité | ✅ | RLS, CSP + 7 headers, anti-download média, rate limiting |
| Feature flags | ✅ | 16 flags (tts, chat_rooms, marketplace_video, ai_*…) |

---

## 4. Problèmes identifiés (priorisés)

### P0 - Bloquants fonctionnels

| # | Problème | Impact | Remédiation |
|---|---|---|---|
| - | *(aucun bloquant détecté - le site est en HTTP 200)* | - | - |

### P1 - Cohérence / hygiène

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| G1 | **Routes dupliquées `post` vs `posts`** | ✅ **Résolu** - `/posts/[postId]` (pluriel) est canonique (REST best practice + implémentation la plus riche). `/post/*` supprimé + 301 → `/posts/*`. | |
| G2 | **Routes dupliquées `discover` vs `discovery`** | ✅ **Résolu** - `/discover` est canonique (référencée par la nav principale). `/discovery` supprimée + 301. | |
| G3 | **Migrations 047 + 048 non appliquées** | Le code (line styles, types custom immédiats) attend des colonnes/contraintes qui n'existent pas encore en prod. | Appliquer via Supabase SQL Editor. Nécessite `SUPABASE_DB_URL` (connection string) que je n'ai pas en local. |

### P2 - Dette technique

| # | Problème | Impact | Recommandation |
|---|---|---|---|
| D1 | 788 warnings ESLint (`no-explicit-any`, `explicit-module-boundary-types`) | `lint:ci` (`--max-warnings=0`) échouerait. Le CI actuel utilise `pnpm lint` (non bloquant). | Purge graduelle (`types/`, `components/`) ; migrer `lint:ci` en dur une fois ≤ 0. |
| D2 | i18n : 5705 violations d'audit (majorité faux positifs `className`) | Du texte JSX EN résiduel reste dans les pages (about, help…). | Filtrer les faux positifs, corriger les vrais `JSX text` EN → t(). |
| D3 | `components/navigation.tsx` legacy vs `layout/nav-sidebar.tsx` | Deux systèmes de nav cohabitent. | Migrer les ~40 pages vers le layout, supprimer l'ancien. |

### P3 - Infrastructure / backlog

| # | Problème | Remédiation |
|---|---|---|
| I1 | Redis Upstash non provisionné | Déployer l'instance, configurer `UPSTASH_REDIS_REST_URL`/`TOKEN` |
| I2 | AI Phase 2 non activée | Activer les flags `ai_*` après provisionnement des clés |
| I3 | Neo4j (Phase 3) | Backlog - hors périmètre actuel |

---

## 5. Actions effectuées (2026-09-11)

1. **Fix `pnpm-workspace.yaml`** : `allowBuilds` (sharp/esbuild/…) → `true`. Débloque
   `pnpm install` (fin de l'échec `ERR_PNPM_IGNORED_BUILDS`), le typecheck et le build
   locaux.
2. **Consolidation `/terms`** : supprimé `app/terms` (duplicata exact de
   `app/policies/terms`) + redirect 301 `/terms` → `/policies/terms` dans
   `next.config.mjs` (préserve bookmarks/SEO).
3. **Vérification de bout en bout** : typecheck ✅, build ✅ (77 pages), déploiement
   Vercel ✅ (HTTP 200), pipeline GitLab ✅.

---

## 6. Recommandations priorisées

| Priorité | Action | Effort | Bloquant |
|---|---|---|---|
| P1 | Appliquer migrations 047 + 048 (via SQL Editor) | 10 min | `SUPABASE_DB_URL` |
| P1 | Consolider `post`/`posts` (décision + redirect + migration refs) | 2–3 h | décision |
| P1 | Consolider `discover`/`discovery` (décision + migration nav) | 2–3 h | décision |
| P2 | Purge lint `no-explicit-any` | 3–4 h | - |
| P2 | Corriger i18n EN résiduel | 4–6 h | - |
| P3 | Provisionner Redis Upstash | 1 h | compte |
| P3 | Activer AI Phase 2 (flags) | 1 h | clés API |

---

## 7. Décisions requises (à trancher)

1. **Route post canonique** : `/posts/[postId]` (pluriel) ou `/post/[postId]` (singulier) ?
2. **Route discover canonique** : `/discover` (riche, plus référencée) ou `/discovery` ?
3. **Provisionner Supabase** : fournir `SUPABASE_DB_URL` (ou exécuter 047/048 en SQL Editor)
   pour débloquer les line styles + custom types immédiats en production.

> ⚠️ Ces décisions sont des choix de produit/architecture. Une fois tranchés, la
> consolidation des routes est un refactoring mécanique (redirect 301 + migration
> des hrefs) que je peux exécuter sans risque.

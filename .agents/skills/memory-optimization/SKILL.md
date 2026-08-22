# Memory Optimization — Règle Transversale NF

**Owner:** Nebula Forge Digital Studio  
**Last Updated:** 2026-08-22  
**Type:** Règle transversale (root scope) + Skill (per-project)  
**Applies to:** Tous les projets NF (Next.js, React, Tauri)

---

## Principe

> Toute allocation mémoire dans une application NF doit être nécessaire, dimensionnée, et libérée. La mémoire est un coût — CPU, argent (Vercel/Railway), et expérience utilisateur (crashs, lenteurs).

Cette règle couvre 4 couches :

| Couche | Périmètre | Exemples |
|---|---|---|
| **Bundle** | JS/CSS livrés au navigateur | Tree-shaking, lazy-load, code splitting |
| **Runtime** | Mémoire pendant l'exécution | useMemo, useCallback, cleanup, observer teardown |
| **Build** | Mémoire pendant la compilation | Next.js 16 Turbopack, worker threads, `--max-old-space-size` |
| **Infra** | Mémoire serveur | `standalone` output, connection pooling, cache TTL |

---

## Règle NF-MEM-001 : Minimiser le Bundle Initial

### Obligatoire

Pour chaque projet Next.js, le `next.config` DOIT inclure :

```js
// next.config.mjs / next.config.ts
{
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      // + ALL @radix-ui/* packages used by the project
    ],
    staleTimes: { dynamic: 30, static: 300 },
  },
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
}
```

### Recommandé

```js
{
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error'] }
      : false,
  },
}
```

### Checklist par projet

```
☐ optimizePackageImports avec TOUS les packages Radix UI utilisés
☐ staleTimes configuré (30s dynamic / 300s static)
☐ productionBrowserSourceMaps: false
☐ poweredByHeader: false
☐ compress: true
☐ removeConsole en production (sauf error)
☐ Bundle analyzer configuré (ANALYZE=1)
```

---

## Règle NF-MEM-002 : Lazy-Load Tout ce qui n'est pas Above-the-Fold

### Composants lourds → `next/dynamic`

```tsx
// ✅ CORRECT — La modale n'est chargée qu'à l'ouverture
const SettingsModal = dynamic(() => import('./SettingsModal'), {
  ssr: false,
  loading: () => <Skeleton />,
});

// ❌ INCORRECT — import statique, toujours dans le bundle
import { SettingsModal } from './SettingsModal';
```

### Librairies lourdes → dynamic import

```tsx
// ✅ CORRECT — Monaco n'est chargé qu'au focus de l'éditeur
const loadMonaco = async () => {
  const monaco = await import('monaco-editor');
  return monaco;
};
```

### Seuils de lazy-load

| Poids (gzip) | Stratégie |
|---|---|
| < 5 KB | Import statique OK |
| 5–20 KB | `next/dynamic` avec SSR false |
| 20–50 KB | `next/dynamic` + loading skeleton |
| > 50 KB | Split en chunk dédié + prefetch on hover |

---

## Règle NF-MEM-003 : Nettoyer les Effets et Observers

### useEffect cleanup obligatoire

```tsx
// ✅ CORRECT — cleanup explicite
useEffect(() => {
  const observer = new IntersectionObserver(callback);
  observer.observe(el);
  return () => observer.disconnect(); // ← cleanup
}, []);

useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // ← cleanup
}, []);
```

### Event listeners → cleanup

```tsx
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);
```

### AbortController → cleanup

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetch(url, { signal: controller.signal }).then(setData);
  return () => controller.abort();
}, [url]);
```

---

## Règle NF-MEM-004 : Cache et Déduplication

### React.cache() pour les fonctions serveur

```tsx
// ✅ CORRECT — déduplique les appels dans un même render tree
import { cache } from 'react';

export const getServerClient = cache(() => {
  return createClient();
});
```

### TanStack Query → staleTime

```tsx
// ✅ CORRECT — évite les refetchs inutiles
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 30 * 60 * 1000,   // 30 minutes (anciennement cacheTime)
});
```

### Images → sizes + priority

```tsx
// ✅ CORRECT — le navigateur sait quelle taille charger
<Image
  src={cover}
  sizes="(max-width: 768px) 100vw, 640px"
  priority={isHero}
  alt="Cover"
/>
```

---

## Règle NF-MEM-005 : Éviter les Fuites Mémoire React

### useMemo → valeurs calculées coûteuses

```tsx
// ✅ CORRECT — filtre mémorisé, recalculé seulement si deps changent
const activeUsers = useMemo(
  () => users.filter(u => u.active).sort(byName),
  [users]
);
```

### useCallback → quand passé à des enfants avec React.memo

```tsx
// ✅ CORRECT — référence stable pour React.memo
const handleClick = useCallback((id: string) => {
  setSelected(id);
}, []);
```

### Jamais de setState dans le corps du render

```tsx
// ❌ INCORRECT — boucle infinie de renders
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ← jamais ici !
  return <div>{count}</div>;
}
```

### Jamais de new Object/Array dans le corps du render sans useMemo

```tsx
// ❌ INCORRECT — nouvelle référence à chaque render → re-renders inutiles
<Child options={{ page: 1, size: 10 }} />

// ✅ CORRECT — référence stable
const options = useMemo(() => ({ page: 1, size: 10 }), []);
<Child options={options} />
```

---

## Règle NF-MEM-006 : Build & CI Memory

### Next.js build → limiter la mémoire

```bash
# Dans le CI workflow
NODE_OPTIONS="--max-old-space-size=4096" next build
```

### pnpm → éviter les fuites pendant l'install

```bash
# Dans le CI workflow
pnpm install --frozen-lockfile --prefer-offline
```

### Turbopack → activé pour dev

```bash
# next dev --turbopack (Next.js 16+ : par défaut)
```

---

## Règle NF-MEM-007 : Monitoring

### Script d'audit

Chaque projet DOIT avoir accès au script d'audit mémoire root :

```bash
node ../scripts/audit-memory.mjs --project quest-hunt-web
```

Ce script vérifie :
- Config `next.config` conforme à NF-MEM-001
- Présence de `cache()` sur les fonctions server
- `useEffect` avec cleanup manquant
- Composants lourds sans dynamic import
- `gcTime` / `staleTime` sur les queries TanStack
- `priority` sur les images LCP

---

## Projet par Projet — Conformité Actuelle

| Projet | NF-MEM-001 | NF-MEM-002 | NF-MEM-004 | Notes |
|---|---|---|---|---|
| quest-hunt-web | ✅ Complet (29 packages) | ✅ Carousel dynamique | ✅ React.cache sur Supabase | Optimisé |
| velvet-galaxy | ✅ Complet (26+ packages + removeConsole) | 🟡 | ✅ cacheComponents:true | Bonne config |
| gamehub | ✅ Complet (22 packages + Turbopack) | ✅ Carousel documenté | ✅ cacheComponents:true | Monorepo complexe |
| libra-keeper | ⚠️ Minimal (3 packages) | 🟡 | 🟡 next-intl tiers | À optimiser |
| story-forge | ⚠️ Minimal (3 packages) | 🟡 | 🟡 | À optimiser |
| pi-studio | N/A (Vite) | ✅ Lazy routes | ✅ React.cache | Desktop, règles différentes |

---

## Références

- **Next.js Memory Usage Guide** — https://nextjs.org/docs/app/guides/memory-usage
- **Next.js Package Bundling** — https://nextjs.org/docs/app/guides/package-bundling
- **React 19 useMemo/useCallback** — https://react.dev/reference/react/useMemo
- **pnpm Peer Resolution Memory** — https://github.com/pnpm/pnpm/pull/13538
- **V8 Heap Profiling** — https://nodejs.org/en/learn/diagnostics/memory/using-heap-profiler

---

*Skill maintenu par Nebula Forge Digital Studio — Août 2026*
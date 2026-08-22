# RAM Optimization — Règle Transversale NF

**Owner:** Nebula Forge Digital Studio  
**Last Updated:** 2026-08-22  
**Type:** Règle transversale (root scope) + Skill (per-project)  
**Applies to:** Tous les projets NF (Next.js, React, Tauri, Node.js)

---

## Principe

> La RAM est le facteur de coût #1 sur Vercel/Railway et la cause #1 des crashs en production. Chaque Mo économisé = fonction plus rapide, facture plus légère, moins de timeouts.

Ce skill couvre **exclusivement** la mémoire vive (heap, RSS, stack) — pas le bundle size (voir `memory-optimization/SKILL.md`).

---

## Règle NF-RAM-001 : Server Memory = Money

### Next.js → standalone output

```js
// next.config.ts — réduit la mémoire serveur de ~40%
{
  output: 'standalone',
}
```

### Connection pooling → pas de fuites

```ts
// ❌ INCORRECT — nouvelle connexion à chaque requête = fuite mémoire
function getClient() {
  return createClient(); // jamais libéré
}

// ✅ CORRECT — cache + réutilisation
import { cache } from 'react';
export const getClient = cache(() => createClient());
```

### Supabase realtime → cleanup obligatoire

```tsx
useEffect(() => {
  const channel = supabase.channel('updates')
    .on('postgres_changes', { event: '*' }, handler)
    .subscribe();

  return () => {
    supabase.removeChannel(channel); // ← OBLIGATOIRE
  };
}, []);
```

---

## Règle NF-RAM-002 : Cache avec TTL, pas cache infini

### Upstash Redis → TTL sur chaque clé

```ts
// ❌ INCORRECT — clé sans expiration = mémoire infinie
await redis.set('heavy-data', JSON.stringify(payload));

// ✅ CORRECT — TTL explicite
await redis.set('heavy-data', JSON.stringify(payload), { ex: 3600 }); // 1 heure
```

### In-memory Map → LRU éviction

```ts
// ✅ CORRECT — LRU cache avec limite
class LRUCache<K, V> {
  #map = new Map<K, V>();
  #max: number;
  constructor(max: number) { this.#max = max; }
  get(key: K) {
    const v = this.#map.get(key);
    if (v !== undefined) {
      this.#map.delete(key);
      this.#map.set(key, v); // move to end (most recent)
    }
    return v;
  }
  set(key: K, value: V) {
    this.#map.delete(key);
    this.#map.set(key, value);
    if (this.#map.size > this.#max) {
      this.#map.delete(this.#map.keys().next().value); // evict oldest
    }
  }
}
```

---

## Règle NF-RAM-003 : Stream, ne buffer pas

### API Routes → ReadableStream

```ts
// ❌ INCORRECT — charge tout en mémoire
export async function GET() {
  const allRows = await db.select().from('large_table');
  return Response.json(allRows); // 500 MB en RAM !
}

// ✅ CORRECT — stream ligne par ligne
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      const cursor = db.select().from('large_table').stream();
      for await (const row of cursor) {
        controller.enqueue(JSON.stringify(row) + '\n');
      }
      controller.close();
    },
  });
  return new Response(stream);
}
```

### File uploads → pas de buffer entier

```ts
// ❌ INCORRECT — charge tout le fichier en RAM
const buffer = Buffer.concat(chunks);

// ✅ CORRECT — stream vers le stockage
const uploadStream = supabase.storage.from('media').upload(path, file.stream());
```

---

## Règle NF-RAM-004 : Nettoyer les Observers et Timers

### IntersectionObserver → disconnect()

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(handler);
  observer.observe(element);
  return () => observer.disconnect(); // ← OBLIGATOIRE
}, []);
```

### setInterval → clearInterval

```tsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id); // ← OBLIGATOIRE
}, []);
```

### Event listeners → removeEventListener

```tsx
useEffect(() => {
  const handler = () => { /* ... */ };
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler); // ← OBLIGATOIRE
}, []);
```

---

## Règle NF-RAM-005 : Limiter la Taille des Données en Mémoire

### Paginer les listes

```ts
// ❌ INCORRECT — charge tout
const allItems = await db.select().from('items');

// ✅ CORRECT — pagine
const page = await db.select().from('items').limit(20).offset(skip);
```

### Limiter les champs sélectionnés

```ts
// ❌ INCORRECT — charge toutes les colonnes (incluant text_content, JSONB, etc.)
const { data } = await supabase.from('quests').select('*');

// ✅ CORRECT — seulement les colonnes nécessaires
const { data } = await supabase.from('quests').select('id,title,status');
```

### Truncate les logs en mémoire

```ts
// ✅ CORRECT — garde uniquement les N dernières entrées
const MAX_LOGS = 500;
function addLog(logs: Log[], entry: Log): Log[] {
  return [...logs.slice(-(MAX_LOGS - 1)), entry];
}
```

---

## Règle NF-RAM-006 : Workers et Processus

### Tauri → sidecar lifecycle

```rust
// ✅ CORRECT — kill le sidecar quand inactif > 5 min
fn manage_sidecar(idle: Duration) {
    if idle > Duration::from_secs(300) {
        sidecar.kill();
        sidecar = None;
    }
}
```

### Next.js → pas de workers inutiles

```js
// webpack dans next.config.ts — pas de threads supplémentaires
// sauf nécessité absolue
```

---

## Règle NF-RAM-007 : Monitoring RAM

### Vercel → vérifier les pics

```bash
# Dans Vercel Dashboard → Functions → sélectionner une fonction → Memory
# Si > 80% de la limite, passer à l'échelon supérieur ou optimiser
```

### Local → vérifier avec --inspect

```bash
node --inspect --max-old-space-size=512 node_modules/.bin/next dev
# Ouvre chrome://inspect → Memory → Take heap snapshot
```

### Script d'audit

```bash
node scripts/audit-memory.mjs --project <name>
# Vérifie: standalone output, cache() usage, useEffect cleanup,
#   realtime channel removal, TTL sur Redis, pagination
```

---

## Projet par Projet — Conformité RAM

| Projet | Standalone | React.cache | Realtime Cleanup | Pagination | TTL |
|---|---|---|---|---|---|
| quest-hunt-web | 🟡 | ✅ | ✅ | ✅ | ✅ Upstash |
| velvet-galaxy | 🟡 | ✅ | ✅ | ✅ | N/A |
| gamehub | ✅ (standalone option) | 🟡 | ✅ | ✅ | N/A |
| libra-keeper | ✅ | 🟡 | ✅ | ✅ | ✅ Upstash |
| story-forge | ✅ | 🟡 | ✅ | 🟡 | N/A |
| pi-studio | N/A (Tauri) | ✅ | ✅ | ✅ | N/A |

---

## Quick Wins — 5 min par projet

```bash
# 1. Standalone output
# Ajouter `output: 'standalone'` dans next.config

# 2. React.cache sur le client Supabase
# import { cache } from 'react';
# export const getClient = cache(() => createClient());

# 3. TTL sur les clés Redis
# Toujours passer `ex:` dans redis.set()

# 4. Pagination sur les SELECT
# Toujours .limit() sur les requêtes sans filtre unique
```

---

## Références

- **Next.js Memory Usage** — https://nextjs.org/docs/app/guides/memory-usage  
- **V8 Heap Profiler** — https://nodejs.org/en/learn/diagnostics/memory/using-heap-profiler  
- **Vercel Function Limits** — https://vercel.com/docs/functions/configuring-functions/memory  
- **Supabase Realtime Cleanup** — https://supabase.com/docs/guides/realtime  
- **Upstash Redis TTL** — https://upstash.com/docs/redis/sdks/ts/commands/generic/expire  

---

*Skill maintenu par Nebula Forge Digital Studio — Août 2026*
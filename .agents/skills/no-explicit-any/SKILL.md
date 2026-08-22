# No Explicit `any` — Règle Transversale NF

**Owner:** Nebula Forge Digital Studio  
**Last Updated:** 2026-08-22  
**Type:** Règle transversale (root scope) + Skill (per-project)  
**Applies to:** Tous les projets NF (Next.js, React, Tauri, Node.js)  
**Severity:** `error` en CI, `warn` en dev local  

---

## Principe

> `any` désactive le vérificateur de type. Chaque `any` est un trou dans le filet de sécurité TypeScript — une exception qui s'accumule et rend la base de code progressivement moins sûre. Cette règle impose `"error"` sur `@typescript-eslint/no-explicit-any` avec un mécanisme d'exception documenté pour les cas légitimes.

---

## NF-NOANY-001 : Bannir `any`, Préférer `unknown`

### ❌ Incorrect

```ts
// Désactive toute vérification de type — le compilateur ne peut plus aider
function parseResponse(data: any) {
  return data.user.name; // pas d'erreur, crash au runtime
}

const config: any = loadConfig(); // toutes les propriétés sont any
const items: any[] = await fetchItems(); // les éléments sont any
```

### ✅ Correct

```ts
// 1. unknown + type guard (quand la forme est inconnue)
function parseResponse(data: unknown): string {
  if (
    typeof data === 'object' &&
    data !== null &&
    'user' in data &&
    typeof (data as Record<string, unknown>).user === 'object'
  ) {
    const user = (data as { user: { name: unknown } }).user;
    if (typeof user.name === 'string') return user.name;
  }
  throw new Error('Unexpected response shape');
}

// 2. Zod / Valibot (runtime + compile-time)
import { z } from 'zod';
const ResponseSchema = z.object({ user: z.object({ name: z.string() }) });
function parseResponse(data: unknown) {
  return ResponseSchema.parse(data).user.name;
}

// 3. Type générique
async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  return res.json() as T;
}
const data = await fetchJson<{ user: { name: string } }>('/api/user');
data.user.name; // ✅ string, vérifié à la compilation
```

---

## NF-NOANY-002 : Alternatives à `any` par Contexte

### Objet dont on connaît les clés → `interface` / `type`

```ts
// ❌ any
function processData(data: any) { ... }

// ✅ interface
interface UserPayload { id: string; name: string; email: string; }
function processData(data: UserPayload) { ... }
```

### Objet dont on ne connaît PAS les clés → `Record<K, V>` ou index signature

```ts
// ❌ any
const cache: any = {};

// ✅ Record
const cache: Record<string, unknown> = {};

// ✅ Index signature (si besoin de propriétés spécifiques + clés arbitraires)
interface CacheEntry { value: unknown; ttl: number; }
interface Cache {
  [key: string]: CacheEntry | undefined;
}
```

### Objet JSON inconnu → `unknown` + validation

```ts
// ❌ any
const body: any = await request.json();

// ✅ unknown + Zod
const body: unknown = await request.json();
const parsed = RequestSchema.parse(body);
```

### Callback dont les paramètres sont inconnus → `never[]` + `unknown`

```ts
// ❌ any
type AnyCallback = (...args: any[]) => any;

// ✅ never + unknown
type AnyCallback = (...args: never[]) => unknown;
```

### État d'union discriminée → `type` avec `status`

```ts
// ❌ any + optional fields
interface State { loading?: any; data?: any; error?: any; }

// ✅ Union discriminée
type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };
```

### Supabase query result (dynamic) → générique ou `unknown` + assertion

```ts
// ❌ any
const { data } = await supabase.from('table').select('*');
// data is any[] | null

// ✅ type générique
const { data } = await supabase
  .from('table')
  .select('id, name, email')
  .returns<{ id: string; name: string; email: string }[]>();

// ✅ unknown + type guard si vraiment dynamique
const { data }: { data: unknown } = await supabase.from('table').select('*');
if (Array.isArray(data) && data.every(isValidRow)) { ... }
```

### React Synthetic Event → type spécifique

```ts
// ❌ any
function handleChange(e: any) { ... }

// ✅ type spécifique
function handleChange(e: React.ChangeEvent<HTMLInputElement>) { ... }
function handleClick(e: React.MouseEvent<HTMLButtonElement>) { ... }
function handleSubmit(e: React.FormEvent<HTMLFormElement>) { ... }
```

---

## NF-NOANY-003 : Mécanisme d'Exception

Quand `any` est **vraiment** nécessaire (échappatoire légitime), utiliser un commentaire de désactivation ESLint **avec justification obligatoire** :

```ts
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party library 'untyped-lib' has no @types package (issue #1234)
function wrapUntypedLib(...args: any[]): any {
  return untypedLib.apply(null, args);
}
```

### Cas légitimes acceptés

| Cas | Exemple | Justification typique |
|---|---|---|
| Librairie sans types | Module npm sans `@types/*` ni déclarations | `-- no @types package available for 'xyz'` |
| Migration progressive | Code JavaScript en cours de portage | `-- migration WIP, will type by YYYY-MM-DD` |
| Contrainte TS complexe | Pattern impossible à exprimer avec le système de types actuel | `-- TS cannot express this pattern (conditional mapped generic)` |
| Rest parameters (`...args: any[]`) | Si `ignoreRestArgs: false` (défaut) | `-- passthrough wrapper, types erased by decorator` |

### Cas NON acceptés (toujours remplacer)

- `data: any` sur un `fetch` → `unknown` + Zod
- `event: any` sur un handler → type React ou DOM spécifique
- `props: any` sur un composant → `interface Props { ... }`
- `state: any` → union discriminée
- `err: any` dans un `catch` → `unknown` + `instanceof Error`

---

## NF-NOANY-004 : Configuration

### ESLint (flat config — tous les projets NF)

```js
// eslint.config.mjs — ajouter dans la section rules:
{
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
  }
}
```

Pour le fix automatique (convertit `: any` → `: unknown`) :

```bash
pnpm eslint --fix --rule '@typescript-eslint/no-explicit-any: ["error", {"fixToUnknown": true}]' .
```

**Attention** : `--fix` remplace `any` par `unknown`, ce qui causera des erreurs de compilation. Corriger chaque occurrence manuellement après le fix.

### tsconfig — bonus complémentaire

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`noUncheckedIndexedAccess` n'est pas activé par `strict` mais attrape une autre classe de bugs : `arr[0]` retourne `T | undefined` au lieu de `T`.

---

## NF-NOANY-005 : Audit et Migration

### Audit : compter les `any` existants

```bash
rg ": any|as any|<any>" --glob '*.{ts,tsx}' --glob '!node_modules' --glob '!.next' . | wc -l
```

### Migration progressive recommandée

1. **Jour 1** : Ajouter `no-explicit-any: "warn"` → 0 nouveaux `any`
2. **Sprint 1** : Corriger les `any` dans `lib/` et `types/` (couche la plus critique)
3. **Sprint 2** : Corriger les `any` dans `components/` (UI)
4. **Sprint 3** : Corriger les `any` dans `app/` (pages et API routes)
5. **Sprint 4** : Passer `no-explicit-any: "error"` et activer en CI

### Baseline project actuelle (août 2026)

| Projet | `any` count | Config | Priorité |
|---|---|---|---|
| quest-hunt-web | 653 | ❌ missing | 🔴 Haute |
| velvet-galaxy | 207 | ❌ missing | 🔴 Haute |
| gamehub | 234 | ❌ missing | 🔴 Haute |
| pi-studio | 164 | `"off"` | 🔴 Haute |
| story-forge | 135 | `"warn"` ✅ | 🟡 Moyenne |
| libra-keeper | 4 | `"warn"` ✅ | 🟢 Basse |
| ascent-legacy | 22 | `"warn"` ✅ | 🟢 Basse |
| **TOTAL** | **1,419** | | |

---

## Pourquoi c'est important — en une phrase

> Chaque `any` dans ta codebase est un bug qui attend d'être découvert en production. `unknown` + type guard te force à le découvrir à la compilation.

---

## Références externes

- [typescript-eslint: no-explicit-any](https://typescript-eslint.io/rules/no-explicit-any/)
- [TypeScript Handbook: any vs unknown](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any)
- [Avoiding anys with Linting and TypeScript](https://typescript-eslint.io/blog/avoiding-anys/)
- [TypeScript Best Practices for Production Code in 2026](https://dev.to/_d7eb1c1703182e3ce1782/typescript-best-practices-for-production-code-in-2026-lb0)

---

*Skill maintenu par Nebula Forge Digital Studio — Août 2026*
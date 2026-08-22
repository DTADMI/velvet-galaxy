# Typage par Inférence vs Interface — Règle Transversale NF

**Owner:** Nebula Forge Digital Studio  
**Last Updated:** 2026-08-22  
**Type:** Règle transversale (root scope) + Skill (per-project)  
**Applies to:** Tous les projets NF (TypeScript, React, Next.js, Tauri)  
**Severity:** `warn` recommandé pour `@typescript-eslint/explicit-module-boundary-types` sur les exports  

---

## Principe

> Ni l'inférence partout, ni l'annotation partout. La question n'est pas « est-ce que TypeScript peut inférer ? » (il peut presque toujours) — mais « est-ce qu'une annotation explicite ajoute de la clarté que l'inférence seule ne fournit pas ? »

Cette règle établit **quand** annoter et **quand** laisser inférer, avec des critères objectifs.

---

## La Règle Fondamentale : Boundary vs Internal

| Contexte | Stratégie | Raison |
|---|---|---|
| **Paramètres de fonction** | Toujours annoter | L'inférence ne remonte pas depuis les appels |
| **Return type exporté** | Toujours annoter | Contrat public, documentation, vérification d'implémentation |
| **Return type interne** | Inférer (sauf complexe) | Moins de boilerplate, refactoring plus facile |
| **Variables locales** | Inférer si RHS évident | `const x = 5` n'a pas besoin de `: number` |
| **Litéraux d'objets** | Annoter si destinés à une interface | Attrape les propriétés manquantes au point de définition |
| **Tableaux vides** | Toujours annoter | `[]` infère `never[]` |
| **Callbacks** | Inférer si le contexte les type déjà | `arr.map(x => x.name)` — `x` est déjà typé |
| **Constantes de config** | `as const` ou annotation | Préserve les litéraux, pas d'élargissement en `string` |

---

## NF-TYPE-001 : Annoter aux Frontières, Inférer à l'Intérieur

### ✅ Fonction exportée → return type annoté

```ts
// ✅ Le return type est un CONTRAT. Si l'implémentation est incorrecte,
//    l'erreur est ici, pas chez le consommateur.
export async function getUser(userId: string): Promise<User | null> {
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return data ?? null;
}

// ❌ Sans annotation, si on oublie une propriété, le type inféré
//    devient le nouveau contrat — silencieusement.
export async function getUser(userId: string) {
  const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  return data;
  // Type inféré : { id: string; name: string } | null
  // Mais si on voulait renvoyer User (avec email, avatar...), aucune erreur.
}
```

### ✅ Fonction interne → inférer

```ts
// ✅ Fonction privée, utilisée une seule fois, logique simple
function formatName(first: string, last: string) {
  return `${first} ${last}`;
  // Type inféré : string — parfaitement clair
}
```

### ✅ Objet littéral passé à une fonction typée → annoter

```ts
interface CreateQuestInput {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

// ✅ L'annotation attrape les erreurs AU POINT DE DÉFINITION
const input: CreateQuestInput = {
  title: "My Quest",
  descripion: "...", // ← erreur ici, pas 20 lignes plus bas
  difficulty: "ez",   // ← erreur aussi
};

await createQuest(input);
```

### ✅ Callback dont le type est fourni par le contexte → inférer

```ts
// ✅ user est typé automatiquement par le .map<User, ...>
const names = users.map((user) => user.name);

// ❌ Annotation redondante
const names = users.map((user: User) => user.name);
```

### ✅ Tableau vide → annoter

```ts
// ❌ TypeScript infère never[] — inutilisable
const results = [];

// ✅ Annoter
const results: QuestResult[] = [];

// ✅ Ou initialiser avec un élément
const results = [getDefaultQuest()];
```

---

## NF-TYPE-002 : `as const` pour les Litéraux, `satisfies` pour les Objets

### `as const` — quand vous voulez le type LITTÉRAL, pas le type élargi

```ts
// ❌ Inféré comme string[] — l'info "north"|"south"|... est perdue
const DIRECTIONS = ["north", "south", "east", "west"];

// ✅ Inféré comme readonly ["north", "south", "east", "west"]
const DIRECTIONS = ["north", "south", "east", "west"] as const;
type Direction = (typeof DIRECTIONS)[number]; // "north" | "south" | "east" | "west"

// ✅ Configuration objects
const CONFIG = {
  maxRetries: 3,
  endpoint: "https://api.example.com",
  features: ["search", "export"],
} as const;
// Type: { readonly maxRetries: 3; readonly endpoint: "https://api.example.com"; ... }
```

### `satisfies` — valider SANS élargir (TS 4.9+)

```ts
type Palette = Record<string, string>;

// ❌ : Palette → toutes les valeurs élargies en string
const colors: Palette = { red: "#FF0000", blue: "#0000FF" };
colors.red; // type: string (le littéral est perdu)

// ❌ as const → pas de validation
const colors = { red: "#FF0000", invalid: 123 } as const; // pas d'erreur

// ✅ satisfies → validation + préservation des litéraux
const colors = { red: "#FF0000", blue: "#0000FF" } satisfies Palette;
colors.red; // type: string (validé) — toutes les clés sont vérifiées ✅
```

---

## NF-TYPE-003 : Unions Discriminées > Optional Fields

```ts
// ❌ Anti-pattern : champs optionnels → impossible de savoir l'état
interface QuestState {
  loading?: boolean;
  data?: Quest;
  error?: string;
}
// Bug possible : { loading: true, error: "x" } est valide

// ✅ Union discriminée → chaque état est explicite et exclusif
type QuestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: Quest }
  | { status: "error"; error: string };

function render(state: QuestState) {
  switch (state.status) {
    case "idle": return <Placeholder />;
    case "loading": return <Spinner />;
    case "success": return <QuestView quest={state.data} />;
    //          state.data est Quest, pas Quest | undefined ✅
    case "error": return <ErrorBanner msg={state.error} />;
  }
}
```

---

## NF-TYPE-004 : `interface` vs `type` — Quand Utiliser Quoi

| Cas | Recommandation | Raison |
|---|---|---|
| Objet simple (props, DTO, model) | `interface` | Extensible, plus rapide à compiler, message d'erreur + clair |
| Union, intersection, mapped type | `type` | `interface` ne supporte pas les unions |
| Type utilitaire dérivé | `type` | `Pick<User, "id">`, `Partial<T>`, `Omit<...>` |
| Tuple | `type` | `type Point = [number, number]` |
| Extension d'un type existant | `interface` | `interface AdminUser extends User { ... }` |
| API publique d'un package | `interface` | Declaration merging possible pour les consommateurs |

```ts
// ✅ interface pour les shapes d'objets
interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
}

// ✅ type pour les unions et dérivations
type QuestState = { status: "loading" } | { status: "ready"; quest: Quest };
type QuestId = Quest["id"];
type CreateQuestInput = Omit<Quest, "id" | "created_at">;
```

---

## NF-TYPE-005 : Génériques — Inférer le Paramètre, Annoter la Contrainte

```ts
// ✅ Le paramètre générique est inféré depuis l'appel
//    La contrainte est explicite via extends
function getFirst<T extends { id: string }>(items: T[]): T | undefined {
  return items[0];
}

// ✅ Return type inféré à partir du paramètre
function pick<T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  return keys.reduce((acc, k) => ({ ...acc, [k]: obj[k] }), {} as Pick<T, K>);
}
```

---

## NF-TYPE-006 : Quand l'Inférence est Moins Performante

> Source : [TypeScript Wiki — Performance](https://github.com/microsoft/TypeScript/wiki/Performance)

Quand TypeScript infère un type complexe (objet avec 20 propriétés), il produit un type anonyme volumineux. Le déclarer explicitement avec un nom (`interface` ou `type`) produit un type nommé — plus compact, plus rapide à comparer, et plus lisible dans les messages d'erreur.

```ts
// ❌ Type inféré anonyme — lent à comparer, messages d'erreur illisibles
function getConfig() {
  return {
    retries: 3,
    timeout: 5000,
    endpoint: "https://api.example.com",
    // ... 10+ propriétés
  };
}

// ✅ Type nommé — compilation plus rapide, erreurs plus claires
interface Config {
  retries: number;
  timeout: number;
  endpoint: string;
}
function getConfig(): Config {
  return { retries: 3, timeout: 5000, endpoint: "https://api.example.com" };
}
```

**Règle pratique** : Si le type a plus de ~5 propriétés, le nommer. Si la fonction est exportée, toujours nommer.

---

## NF-TYPE-007 : Checklist de Code Review

Quand vous code-review, vérifiez :

- [ ] Les fonctions **exportées** ont un return type explicite
- [ ] Les **paramètres** de fonction sont tous annotés
- [ ] Les **tableaux vides** sont annotés (`const x: T[] = []`)
- [ ] Les **objets passés à des fonctions** sont annotés si l'interface existe
- [ ] `as const` est utilisé pour les constantes de configuration
- [ ] `satisfies` est utilisé plutôt que `: Type` quand on veut préserver les litéraux
- [ ] Pas de `: any` (→ `no-explicit-any: error`)
- [ ] Pas d'annotation redondante sur les callbacks déjà typés par le contexte
- [ ] `noImplicitAny: true` (inclus dans `strict: true`)

---

## Exemple Récapitulatif — Un Fichier Bien Typé

```ts
// ─── Types (toujours nommés, au début du fichier) ─────────

interface Quest {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
}

type QuestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; quests: Quest[] };

// ─── Constantes (as const) ─────────────────────────────────

const DEFAULT_DIFFICULTY = "medium" as const;
const RETRY_CONFIG = { maxRetries: 3, backoffMs: 1000 } as const;

// ─── Fonction exportée (return type annoté) ────────────────

export async function fetchQuests(difficulty?: string): Promise<Quest[]> {
  const { data } = await supabase
    .from("quests")
    .select("id, title, difficulty")
    .eq("difficulty", difficulty ?? DEFAULT_DIFFICULTY)
    .returns<Quest[]>();
  return data ?? [];
}

// ─── Fonction interne (return type inféré) ─────────────────

function filterByDifficulty(quests: Quest[], diff: string) {
  return quests.filter((q) => q.difficulty === diff);
  // Type inféré : Quest[] — parfaitement clair, pas besoin d'annotation
}

// ─── Hook React (props via interface) ──────────────────────

export function QuestList({ quests }: { quests: Quest[] }) {
  // useState infère QuestState depuis l'initialiseur
  const [state, setState] = useState<QuestState>({ status: "idle" });
  // Generic requis ici car l'union ne peut pas être inférée depuis "idle" seul
  // ...
}
```

---

## Références externes

- [TypeScript Wiki — Performance](https://github.com/microsoft/TypeScript/wiki/Performance)
- [TypeScript Handbook — Type Inference](https://www.typescriptlang.org/docs/handbook/type-inference.html)
- [TypeScript Handbook — Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [typescript-eslint — explicit-module-boundary-types](https://typescript-eslint.io/rules/explicit-module-boundary-types/)
- [David Gomes — TypeScript: Annotate vs Infer](https://davidgomes.com/annotate-vs-type-inference/)
- [Paul Und — Type Annotations vs Type Inference](https://paulund.co.uk/notebook/typescript/type-annotations-vs-type-inference)
- [Total TypeScript — Don't Use Return Types (Unless...)](https://www.totaltypescript.com/tips/dont-use-return-types-unless)

---

*Skill maintenu par Nebula Forge Digital Studio — Août 2026*
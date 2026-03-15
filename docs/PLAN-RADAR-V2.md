# Plan d'implémentation — Radar Client V2

## Objectif

Transformer le Radar Client d'une "fiche d'identité statique" en un **brief stratégique d'entreprise** interactif. Le consultant doit pouvoir scanner en 2 minutes, approfondir ce qui l'intéresse, et repartir avec des éléments actionnables pour son RDV.

---

## Vue d'ensemble des changements

| Composant | Fichier(s) | Nature du changement |
|---|---|---|
| Type `ClientRadar` | `src/lib/brief/types.ts` | Enrichir l'interface |
| Prompt LLM | `src/lib/llm/prompts/sections/client-radar.ts` | Restructurer le JSON attendu |
| Recherche web | `src/lib/research/search-orchestrator.ts` | Ajouter des queries ciblées |
| Composant UI | `src/components/brief/client-radar-card.tsx` | Refonte complète |
| Confidence | `src/lib/brief/confidence.ts` | Adapter le scoring |
| Export PDF | `src/lib/brief/export-brief.ts` | Mettre à jour le HTML radar |
| Store | `src/store/brief-store.ts` | Ajouter les interactions (bookmarks) |

---

## Phase 1 — Enrichissement des données

### 1.1 Étendre le type `ClientRadar`

**Fichier :** `src/lib/brief/types.ts`

Ajouter les champs suivants à l'interface `ClientRadar` :

```typescript
export interface ClientRadar {
  // -- Existant (inchangé) --
  companyName: string;
  sector: string;
  size: string | null;           // PME / ETI / Grand Groupe
  revenue: string | null;
  headquarters: string | null;
  recentNews: Array<{
    headline: string;
    date: string;
    source: Source;
    businessSignal?: string;     // NOUVEAU — lien avec un besoin potentiel CGI
  }>;
  keyFacts: string[];
  sources: Source[];
  missingInfo?: string;

  // -- Nouveaux champs --
  financialTrend: {              // Santé financière
    direction: "growth" | "stable" | "decline" | "unknown";
    details: string;             // Ex: "CA en hausse de 12% sur 2025"
    source: Source | null;
  };
  strategicIssues: Array<{      // Enjeux stratégiques catégorisés
    category: "digital" | "rh" | "reglementaire" | "croissance" | "restructuration" | "innovation" | "autre";
    title: string;
    description: string;
    source: Source | null;
  }>;
  ecosystem: {                   // Écosystème concurrentiel
    competitors: string[];       // Noms des concurrents principaux
    knownPartners: string[];     // Partenaires technologiques connus
    marketPosition: string;      // Ex: "Leader sur le marché français des..."
    source: Source | null;
  };
  digitalMaturity: {             // Maturité digitale
    level: "avancee" | "en_cours" | "emergente" | "inconnue";
    signals: string[];           // Ex: "Migration cloud AWS en cours", "Recrutement data engineers"
    source: Source | null;
  };
  elevatorPitch: string;         // Phrase d'accroche contextuelle prête à l'emploi
  keyNumbers: string[];          // 3 chiffres clés à retenir pour le RDV (max 3)
}
```

### 1.2 Enrichir les requêtes de recherche

**Fichier :** `src/lib/research/search-orchestrator.ts`

Modifier `buildSearchQueries()` pour ajouter 2 queries ciblées :

```typescript
// Query existante "company" — enrichir le template :
`${companyName} entreprise chiffres clés résultats financiers stratégie ${year}`

// NOUVELLE query "ecosystem" :
{
  query: `${companyName} concurrents marché ${sector} partenaires`,
  category: "company"  // rattacher à la catégorie company (pas de nouvelle catégorie)
}

// NOUVELLE query "digital" :
{
  query: `${companyName} transformation digitale IT cloud data recrutement tech`,
  category: "company"
}
```

> **Note :** On ne crée pas de nouvelle catégorie dans `ResearchResults` pour éviter de casser l'interface. On ajoute simplement des queries supplémentaires dans la catégorie `company`, ce qui alimente le LLM avec plus de résultats.

### 1.3 Refondre le prompt LLM

**Fichier :** `src/lib/llm/prompts/sections/client-radar.ts`

Restructurer `buildClientRadarPrompt()` pour :
- Demander les nouveaux champs (financialTrend, strategicIssues, ecosystem, digitalMaturity)
- Générer un `elevatorPitch` contextuel
- Extraire les `keyNumbers` (max 3 chiffres marquants)
- Pour chaque `recentNews`, ajouter un `businessSignal` (optionnel — le lien avec un besoin CGI)
- Conserver la règle de zéro fabrication : "unknown" / "inconnue" / tableaux vides si pas d'info

Le JSON attendu en sortie du LLM doit correspondre exactement au nouveau type `ClientRadar`.

---

## Phase 2 — Refonte de l'UI

### 2.1 Restructurer le composant `ClientRadarCard`

**Fichier :** `src/components/brief/client-radar-card.tsx`

Réorganiser en sections visuellement distinctes avec collapsibles :

#### Structure cible :

```
┌─────────────────────────────────────────────────┐
│ 🏢 [Nom entreprise]                             │
│ [Secteur] [Taille] [CA] [📍Siège]              │
│ [Tendance: ↗ Croissance — "CA +12% en 2025"]   │
├─────────────────────────────────────────────────┤
│ ⚡ À RETENIR (toujours visible)                 │
│  • "450M€ de CA en 2025"              [📌]      │
│  • "3 200 collaborateurs"             [📌]      │
│  • "Leader cloud santé en France"     [📌]      │
│                                                  │
│ 💬 Accroche suggérée                            │
│  "J'ai vu que vous accélériez votre migration   │
│   cloud dans le contexte de..."                  │
├─────────────────────────────────────────────────┤
│ ▸ Enjeux stratégiques (3)            [déplier]  │
│ ▸ Actualités récentes (4)            [déplier]  │
│ ▸ Écosystème & concurrence           [déplier]  │
│ ▸ Maturité digitale                  [déplier]  │
│ ▸ Faits clés (5)                     [déplier]  │
├─────────────────────────────────────────────────┤
│ Sources (6)    ⚠ Non trouvé : effectif exact    │
└─────────────────────────────────────────────────┘
```

#### Principes UI :

1. **Zone "À retenir"** — Toujours visible, pas collapsible. Affiche `keyNumbers` + `elevatorPitch`. C'est le "pocket summary" du consultant.

2. **Sections collapsibles** — Utiliser le composant `Collapsible` de shadcn/ui (à installer si absent). Chaque section s'ouvre/ferme indépendamment. La première section ("Enjeux stratégiques") est ouverte par défaut.

3. **Badges catégorie** — Les `strategicIssues` affichent un badge de couleur par catégorie (digital=bleu, rh=violet, réglementaire=orange, etc.)

4. **Signaux business sur les actus** — Si `businessSignal` est renseigné, afficher en italique sous l'actu avec une icône flèche

5. **Tendance financière** — Icône directionnelle (↗ vert, → gris, ↘ rouge) avec le détail

### 2.2 Ajouter le système de bookmarks

**Fichier :** `src/store/brief-store.ts` + nouveau composant

Permettre au consultant de "épingler" des éléments du Radar pour les retrouver facilement :

- Ajouter dans le store : `radarBookmarks: Set<string>` (IDs des éléments épinglés)
- Actions : `toggleRadarBookmark(id: string)`, `clearRadarBookmarks()`
- Chaque élément épinglable (keyNumber, keyFact, news headline, strategic issue) a une icône 📌 cliquable
- Les bookmarks sont utilisés dans l'export PDF (section "Mes points clés" en haut)

### 2.3 Ajouter le bouton "Approfondir"

**Fichier :** `src/components/brief/client-radar-card.tsx`

Sur chaque section collapsible, ajouter un petit bouton "Approfondir" qui :
- Envoie un message automatique dans le chat (F4 - affinage)
- Le message est pré-formulé : "Cherche plus d'informations sur [titre de la section] de [entreprise]"
- Utilise un callback passé en props depuis le BriefPanel

**Fichier :** `src/components/brief/brief-panel.tsx`

- Ajouter une prop `onDeepen?: (topic: string) => void` au `ClientRadarCard`
- Le BriefPanel connecte ce callback au chat via un custom event ou un hook partagé

---

## Phase 3 — Adaptation du scoring et de l'export

### 3.1 Mettre à jour le scoring de confiance

**Fichier :** `src/lib/brief/confidence.ts`

Nouveau calcul pour `getClientRadarConfidence()` :

```typescript
function getClientRadarConfidence(data: ClientRadar): ConfidenceScore {
  let score = 0;

  // Sources de base
  score += data.sources.length;               // +1 par source
  score += data.recentNews.length;            // +1 par actu

  // Nouveaux critères
  score += data.strategicIssues.length;       // +1 par enjeu identifié
  if (data.financialTrend.direction !== "unknown") score += 2;
  if (data.digitalMaturity.level !== "inconnue") score += 1;
  if (data.ecosystem.competitors.length > 0) score += 1;
  if (data.keyNumbers.length >= 3) score += 1;

  // Seuils ajustés
  if (score >= 10) return { level: "high", ... };
  if (score >= 5) return { level: "medium", ... };
  return { level: "low", ... };
}
```

### 3.2 Mettre à jour l'export PDF

**Fichier :** `src/lib/brief/export-brief.ts`

Modifier la section Radar dans `generateBriefHTML()` :

1. **Ajouter "Mes points clés"** en haut si des bookmarks existent
2. **Ajouter "Accroche suggérée"** (`elevatorPitch`)
3. **Ajouter "Chiffres clés"** (`keyNumbers`)
4. **Ajouter "Enjeux stratégiques"** avec badges catégorie (en CSS inline pour le print)
5. **Ajouter "Écosystème"** (concurrents, partenaires, position)
6. **Ajouter "Maturité digitale"** (niveau + signaux)
7. Conserver les sections existantes (actus, faits clés, sources)

---

## Phase 4 — Tests

### 4.1 Tests unitaires

**Nouveau fichier :** `src/lib/brief/__tests__/confidence.test.ts`

| Test | Description |
|---|---|
| `radar confidence — high score` | ClientRadar avec 5+ sources, 3+ actus, enjeux, financialTrend connu → "high" |
| `radar confidence — medium score` | ClientRadar partiel (2 sources, 1 actu, pas d'enjeux) → "medium" |
| `radar confidence — low score` | ClientRadar minimal (1 source, 0 actu, tout "unknown") → "low" |
| `radar confidence — empty data` | ClientRadar avec tableaux vides et tous les "unknown" → "low" |

**Nouveau fichier :** `src/lib/brief/__tests__/types.test.ts`

| Test | Description |
|---|---|
| `ClientRadar structure` | Vérifier que `createMockClientRadar()` est conforme au type (test TypeScript) |
| `financialTrend directions` | Vérifier les 4 valeurs possibles |
| `strategicIssues categories` | Vérifier les 7 catégories |
| `digitalMaturity levels` | Vérifier les 4 niveaux |

**Nouveau fichier :** `src/lib/research/__tests__/search-orchestrator.test.ts`

| Test | Description |
|---|---|
| `buildSearchQueries count` | Vérifier que le nombre de queries a augmenté (7 au lieu de 5) |
| `buildSearchQueries includes ecosystem query` | Vérifier présence d'une query "concurrents marché" |
| `buildSearchQueries includes digital query` | Vérifier présence d'une query "transformation digitale" |

### 4.2 Tests du prompt LLM

**Nouveau fichier :** `src/lib/llm/prompts/__tests__/client-radar-prompt.test.ts`

| Test | Description |
|---|---|
| `prompt includes all new fields` | Vérifier que le prompt mentionne financialTrend, strategicIssues, etc. |
| `prompt enforces zero fabrication` | Vérifier la présence des règles "unknown"/"inconnue" |
| `prompt output schema matches type` | Parser le JSON template du prompt et vérifier la structure |

### 4.3 Tests de composants UI

**Nouveau fichier :** `src/components/brief/__tests__/client-radar-card.test.tsx`

> Utiliser `@testing-library/react` + `vitest` (ou le setup de test existant du projet)

| Test | Description |
|---|---|
| `renders company header` | Nom, secteur, badges visibles |
| `renders key numbers section` | 3 chiffres affichés dans la zone "À retenir" |
| `renders elevator pitch` | Accroche visible |
| `renders financial trend with correct icon` | ↗ pour growth, → pour stable, ↘ pour decline |
| `collapsible sections toggle` | Clic sur "Enjeux" → section s'ouvre/se ferme |
| `strategic issues show category badges` | Badge couleur par catégorie |
| `news with business signal` | Signal affiché en italique sous l'actu |
| `bookmark toggle` | Clic sur 📌 → élément ajouté/retiré des bookmarks |
| `deepen button sends message` | Clic sur "Approfondir" → callback appelé avec le bon topic |
| `missing info displayed` | Bandeau "Non trouvé" visible quand missingInfo renseigné |
| `sources are clickable` | Liens avec target="_blank" |
| `handles empty/unknown gracefully` | Pas de crash avec financialTrend "unknown", tableaux vides |

### 4.4 Test d'intégration E2E

**Test manuel** (checklist à suivre dans le navigateur) :

```markdown
## Checklist de test E2E — Radar V2

### Génération initiale
- [ ] Lancer un chat avec "J'ai un RDV avec Capgemini, secteur IT services"
- [ ] Confirmer le lancement du brief
- [ ] Vérifier que le Radar s'affiche avec tous les nouveaux champs
- [ ] Vérifier que les sections collapsibles fonctionnent
- [ ] Vérifier que les chiffres clés sont pertinents et sourcés
- [ ] Vérifier que l'accroche est contextuelle (pas générique)
- [ ] Vérifier la tendance financière (icône + détail)

### Interactions
- [ ] Épingler un chiffre clé → vérifier l'icône active
- [ ] Épingler une actu → vérifier l'icône active
- [ ] Cliquer "Approfondir" sur "Enjeux stratégiques" → message envoyé dans le chat
- [ ] Vérifier que la recherche ciblée se lance
- [ ] Vérifier que le Radar se met à jour avec les nouvelles données

### Export
- [ ] Exporter en PDF
- [ ] Vérifier que les bookmarks apparaissent dans "Mes points clés"
- [ ] Vérifier que l'accroche est dans le PDF
- [ ] Vérifier que les enjeux et l'écosystème sont dans le PDF

### Edge cases
- [ ] Entreprise inconnue → vérifier les "unknown"/"inconnue" (pas de crash)
- [ ] Entreprise sans actus → section actus masquée
- [ ] Aucun concurrent trouvé → section écosystème affiche "Données non disponibles"
- [ ] Mode Ollama (local) → même comportement qu'avec Gemini
```

---

## Ordre d'implémentation recommandé

```
1. types.ts          — Étendre ClientRadar (5 min)
2. search-orchestrator.ts — Ajouter queries (10 min)
3. client-radar.ts   — Refondre le prompt (30 min)
4. client-radar-card.tsx — Refonte UI complète (45 min)
5. brief-store.ts    — Ajouter bookmarks (10 min)
6. brief-panel.tsx   — Connecter "Approfondir" (15 min)
7. confidence.ts     — Nouveau scoring (10 min)
8. export-brief.ts   — MAJ export PDF (20 min)
9. Tests unitaires   — confidence + types + prompt (20 min)
10. Tests composants — client-radar-card (30 min)
11. Test E2E manuel  — Checklist complète (15 min)
```

**Total estimé : ~3h30 de dev + tests**

---

## Fichiers impactés (résumé)

| Fichier | Action |
|---|---|
| `src/lib/brief/types.ts` | Modifier |
| `src/lib/research/search-orchestrator.ts` | Modifier |
| `src/lib/llm/prompts/sections/client-radar.ts` | Modifier |
| `src/components/brief/client-radar-card.tsx` | Réécrire |
| `src/store/brief-store.ts` | Modifier |
| `src/components/brief/brief-panel.tsx` | Modifier |
| `src/lib/brief/confidence.ts` | Modifier |
| `src/lib/brief/export-brief.ts` | Modifier |
| `src/lib/brief/__tests__/confidence.test.ts` | Créer |
| `src/lib/brief/__tests__/types.test.ts` | Créer |
| `src/lib/research/__tests__/search-orchestrator.test.ts` | Créer |
| `src/lib/llm/prompts/__tests__/client-radar-prompt.test.ts` | Créer |
| `src/components/brief/__tests__/client-radar-card.test.tsx` | Créer |

## Ce qui ne change PAS

- `route.ts` — Le tool call `generateBriefSection("clientRadar")` reste identique, seul le JSON retourné est plus riche
- `section-generator.ts` — Aucun changement, il appelle toujours `buildClientRadarPrompt()` et parse le JSON
- Les autres sections du brief (contact, offres, questions, alertes) — Aucun impact
- `ResearchResults` interface — Inchangée (les nouvelles queries utilisent la catégorie `company` existante)

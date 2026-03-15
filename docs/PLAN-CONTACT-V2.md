# Plan d'implémentation — Profil Contact V2

## Objectif

Transformer le Profil Contact d'une "fiche d'identité vide ou minimaliste" en un **coach de préparation relationnel**. Le consultant doit comprendre en 30 secondes à qui il parle, comment calibrer son discours, et quels arguments mobiliser — même quand aucune info publique n'est trouvée sur la personne.

### Problème actuel

Le prompt interdit toute déduction ("ZÉRO FABRICATION" total). Résultat : pour 80% des interlocuteurs (non-publics), la section retourne `dataFound: false` avec un message "Aucune information trouvée". Le consultant se retrouve avec **rien** — aucun conseil, aucun insight, aucune valeur ajoutée.

### Solution

Introduire **deux niveaux d'information clairement séparés** :

| Niveau | Contenu | Marquage | Source |
|---|---|---|---|
| **Faits vérifiés** | Parcours, publications, interventions | Badge "Sourcé" + URL | Recherche web |
| **Insights rôle** | Enjeux typiques du poste, ton recommandé, arguments clés, pièges à éviter | Badge "Basé sur le rôle" | Déduit du poste + secteur + contexte |

La section est **toujours utile**, qu'on ait trouvé des infos publiques ou non.

---

## Vue d'ensemble des changements

| Composant | Fichier(s) | Nature du changement |
|---|---|---|
| Type `ContactProfile` | `src/lib/brief/types.ts` | Enrichir l'interface |
| Prompt LLM | `src/lib/llm/prompts/sections/contact-profile.ts` | Refonte complète |
| Recherche web | `src/lib/research/search-orchestrator.ts` | Ajouter une query LinkedIn ciblée |
| Composant UI | `src/components/brief/contact-profile-card.tsx` | Refonte complète |
| Confidence | `src/lib/brief/confidence.ts` | Adapter le scoring |
| Export PDF | `src/lib/brief/export-brief.ts` | Mettre à jour le HTML contact |
| Store | `src/store/brief-store.ts` | Aucun changement (le setter existe déjà) |

---

## Phase 1 — Enrichissement des données

### 1.1 Étendre le type `ContactProfile`

**Fichier :** `src/lib/brief/types.ts`

Remplacer l'interface `ContactProfile` actuelle par :

```typescript
// F3b — Profil Interlocuteur
export interface ContactProfile {
  // -- Identité (inchangé) --
  dataFound: boolean;          // true si au moins 1 info sourcée trouvée
  name: string;
  role: string;
  linkedinUrl: string | null;

  // -- Faits sourcés (existant, restructuré) --
  verifiedInfo: {
    background: string;        // Parcours pro si trouvé, sinon ""
    keyFacts: string[];        // Faits vérifiables trouvés
    publications: string[];    // Articles, interventions, podcasts, talks
    sources: Source[];
  };

  // -- Insights rôle (NOUVEAU — toujours rempli) --
  roleInsights: {
    typicalChallenges: string[];   // 3-5 enjeux typiques du poste dans ce secteur
    communicationStyle: {
      tone: string;                // Ex: "Factuel et orienté risques"
      doList: string[];            // Ce qui résonne : "Chiffrer le ROI", "Montrer des cas clients similaires"
      dontList: string[];          // Ce qui fait fuir : "Jargon trop commercial", "Promettre sans preuve"
    };
    decisionFactors: string[];     // Ce qui influence sa décision : "Conformité", "Budget", "Quick wins"
    icebreakers: string[];         // 2-3 accroches contextuelles pour démarrer la conversation
  };

  // -- Méta --
  missingInfo: string;             // Ce qu'on n'a pas trouvé (transparent)
}
```

**Pourquoi ce découpage :**
- `verifiedInfo` = tout ce qui vient des sources web → le consultant sait que c'est fiable
- `roleInsights` = tout ce qui est déduit du rôle + secteur → le consultant sait que c'est un guide, pas une certitude
- Plus de `keyFacts` racine ambigus — chaque info est dans la bonne catégorie

### 1.2 Ajouter une query de recherche LinkedIn

**Fichier :** `src/lib/research/search-orchestrator.ts`

Modifier `buildSearchQueries()` pour enrichir la recherche contact :

```typescript
// Query existante "contact" — la garder telle quelle :
{
  query: `${ctx.contactName} ${ctx.contactRole || ""} ${ctx.companyName}`,
  category: "contact",
}

// NOUVELLE query "contact-linkedin" :
if (ctx.contactName && ctx.companyName) {
  queries.push({
    query: `${ctx.contactName} ${ctx.companyName} LinkedIn profil parcours`,
    category: "contact",   // même catégorie, enrichit les résultats
  });
}
```

> **Note :** On ne crée pas de nouvelle catégorie dans `ResearchResults`. On ajoute une 2e query dans `contact` pour avoir plus de chances de trouver le profil LinkedIn ou des traces publiques.

### 1.3 Refondre le prompt LLM

**Fichier :** `src/lib/llm/prompts/sections/contact-profile.ts`

Refonte complète de `buildContactProfilePrompt()`. Le nouveau prompt doit :

1. **Séparer les deux niveaux** : d'abord analyser les résultats de recherche pour `verifiedInfo`, puis générer les `roleInsights` basés sur le poste + secteur
2. **Toujours remplir `roleInsights`** : même si `dataFound` est false, cette section est TOUJOURS utile
3. **Générer des `icebreakers` contextuels** : basés sur le secteur, l'offre CGI visée, et les enjeux trouvés dans le radar client
4. **Maintenir la transparence** : distinguer clairement "trouvé" vs "déduit"

Le prompt doit recevoir en paramètres additionnels :
- `sector` (déjà passé)
- `cgiOffering` (optionnel — l'offre que le consultant veut pousser)
- `companyContext` (optionnel — infos clés du radar client si déjà généré, pour contextualiser les icebreakers)

Signature mise à jour :

```typescript
export function buildContactProfilePrompt(
  contactName: string,
  contactRole: string,
  companyName: string,
  sector: string,
  research: ResearchResults,
  cgiOffering?: string,
  companyContext?: string   // résumé des keyFacts du radar si disponible
): string
```

Le JSON de sortie attendu doit correspondre exactement au nouveau type `ContactProfile`.

**Règles dans le prompt :**
- `verifiedInfo` : ZÉRO fabrication — uniquement ce qui est dans les résultats de recherche
- `roleInsights` : déductions ATTENDUES et MARQUÉES comme telles — basées sur le rôle + secteur
- `communicationStyle.tone` : une phrase courte décrivant le style de communication adapté
- `icebreakers` : accroches qui mentionnent le secteur ou l'actualité de l'entreprise (si dispo)
- `missingInfo` : toujours honnête sur ce qu'on n'a pas trouvé

### 1.4 Mettre à jour le générateur de section

**Fichier :** `src/lib/brief/section-generator.ts`

Modifier l'appel dans le `case "contactProfile"` pour passer les nouveaux paramètres :
- `context.cgiOffering` (déjà dans `MeetingContext`)
- Un résumé du `clientRadar` si déjà généré (passer depuis la session serveur ou le caller)

Cela implique potentiellement de modifier la signature de `generateSection()` pour recevoir le `clientRadar` en contexte optionnel, ou de le récupérer depuis la session.

---

## Phase 2 — Refonte de l'UI

### 2.1 Restructurer le composant `ContactProfileCard`

**Fichier :** `src/components/brief/contact-profile-card.tsx`

Réorganiser en sections visuellement hiérarchisées :

#### Structure cible :

```
┌─────────────────────────────────────────────────┐
│ 👤 [Nom]                              🔗 LinkedIn│
│ [Poste] — [Entreprise]                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ 💡 COMMENT LUI PARLER (toujours visible)         │
│  Ton : "Factuel et orienté risques"             │
│                                                  │
│  ✅ À faire                                      │
│  • Chiffrer le ROI dès les premières minutes    │
│  • Montrer des cas clients dans son secteur     │
│                                                  │
│  ❌ À éviter                                     │
│  • Jargon commercial sans substance             │
│  • Promesses sans preuve technique              │
│                                                  │
│ 💬 Accroches suggérées                           │
│  • "J'ai vu que [entreprise] accélérait sa..."  │
│  • "En tant que [rôle], vous devez faire face..." │
│                                                  │
├─────────────────────────────────────────────────┤
│ ▸ Enjeux typiques du poste (3)      [déplier]   │
│ ▸ Facteurs de décision (4)          [déplier]   │
│ ▸ Parcours vérifié                  [déplier]   │
│ ▸ Publications & interventions      [déplier]   │
├─────────────────────────────────────────────────┤
│ Sources (2)    ⚠ Note : parcours non trouvé     │
│ 🏷 Basé sur le rôle de DSI dans les Télécoms    │
└─────────────────────────────────────────────────┘
```

#### Principes UI :

1. **Zone "Comment lui parler"** — Toujours visible, jamais collapsible. C'est le "pocket guide" du consultant. Affiche `communicationStyle` (tone, doList, dontList) + `icebreakers`. Même si `dataFound=false`, cette zone est remplie.

2. **Sections collapsibles** — Utiliser le composant `Collapsible` de shadcn/ui. 4 sections :
   - "Enjeux typiques du poste" → `roleInsights.typicalChallenges`
   - "Facteurs de décision" → `roleInsights.decisionFactors`
   - "Parcours vérifié" → `verifiedInfo.background` + `verifiedInfo.keyFacts` (masqué si vide)
   - "Publications & interventions" → `verifiedInfo.publications` (masqué si vide)

3. **Badges de provenance** — En bas de la card, un badge gris indique "Basé sur le rôle de [role] dans le secteur [sector]" pour que le consultant sache d'où viennent les insights.

4. **Masquage intelligent** — Les sections collapsibles vides (`verifiedInfo` sans données) ne s'affichent pas du tout, au lieu d'afficher "Aucune information" qui fait vide.

5. **Do/Don't list** — Utiliser des couleurs subtiles : vert pour les "À faire", rouge doux pour les "À éviter". Icônes CheckCircle / XCircle.

### 2.2 Ajouter le bouton "Approfondir"

**Fichier :** `src/components/brief/contact-profile-card.tsx`

Sur la section "Parcours vérifié" (quand elle est collapsible ou quand `dataFound=false`), ajouter un bouton "Approfondir la recherche" qui :
- Envoie un message dans le chat : "Cherche plus d'informations sur le profil de [nom] [rôle] chez [entreprise]"
- Utilise un callback `onDeepen?: (topic: string) => void` passé en props

**Fichier :** `src/components/brief/brief-panel.tsx`

- Ajouter la prop `onDeepen` au `ContactProfileCard`
- Connecter au même mécanisme que le Radar V2 (custom event ou hook partagé)

---

## Phase 3 — Adaptation du scoring et de l'export

### 3.1 Mettre à jour le scoring de confiance

**Fichier :** `src/lib/brief/confidence.ts`

Nouveau calcul pour `getContactProfileConfidence()` :

```typescript
function getContactProfileConfidence(data: ContactProfile | null): ConfidenceScore | null {
  if (!data) return null;

  let score = 0;

  // Infos vérifiées (poids fort)
  score += data.verifiedInfo.sources.length;         // +1 par source
  if (data.verifiedInfo.background) score += 2;       // +2 si parcours trouvé
  score += data.verifiedInfo.publications.length;      // +1 par publication

  // Insights rôle (poids moyen — toujours présents)
  if (data.roleInsights.typicalChallenges.length >= 3) score += 1;
  if (data.roleInsights.icebreakers.length >= 2) score += 1;

  // Seuils
  if (score >= 5) return { level: "high", label: "Confiance haute", sourceCount: score };
  if (score >= 2) return { level: "medium", label: "Confiance moyenne", sourceCount: score };
  return { level: "low", label: "Confiance basse", sourceCount: score };
}
```

**Logique :** Le score ne peut plus être "null" car les `roleInsights` apportent toujours au minimum 2 points. Un score "low" signifie que seuls les insights rôle sont présents (pas de données sourcées).

### 3.2 Mettre à jour l'export PDF

**Fichier :** `src/lib/brief/export-brief.ts`

Modifier la section Contact dans `generateBriefHTML()` :

1. **Remplacer le bloc Contact existant** (lignes 180-200) par la nouvelle structure :
   - Header : nom + rôle + lien LinkedIn
   - Section "Comment aborder l'entretien" : tone + doList + dontList
   - Section "Accroches suggérées" : icebreakers
   - Section "Enjeux typiques" : typicalChallenges
   - Section "Facteurs de décision" : decisionFactors
   - Section "Parcours" (si verifiedInfo.background non vide)
   - Section "Publications" (si verifiedInfo.publications non vide)
   - Sources (si present)
   - Note transparence : "Les conseils d'approche sont basés sur le rôle de [role] dans le secteur [sector]"

2. **Styles CSS à ajouter** :
   - `.do-item` : fond vert très léger, bordure gauche verte
   - `.dont-item` : fond rouge très léger, bordure gauche rouge
   - `.insight-badge` : badge gris "Basé sur le rôle"
   - `.icebreaker` : fond gris léger, guillemets stylisés

---

## Phase 4 — Tests

### 4.1 Tests unitaires — Confidence

**Nouveau fichier :** `src/lib/brief/__tests__/contact-confidence.test.ts`

| Test | Description |
|---|---|
| `contact confidence — high score` | ContactProfile avec 3+ sources, background, 1 publication → "high" |
| `contact confidence — medium score` | ContactProfile avec 0 sources mais roleInsights complets → "medium" |
| `contact confidence — low score` | ContactProfile minimal (dataFound=false, roleInsights partiels) → "low" |
| `contact confidence — null data` | `null` → retourne `null` |

### 4.2 Tests unitaires — Prompt

**Nouveau fichier :** `src/lib/llm/prompts/__tests__/contact-profile-prompt.test.ts`

| Test | Description |
|---|---|
| `prompt includes verifiedInfo fields` | Vérifier que le prompt mentionne background, keyFacts, publications, sources |
| `prompt includes roleInsights fields` | Vérifier typicalChallenges, communicationStyle, decisionFactors, icebreakers |
| `prompt always requests roleInsights` | Vérifier que le prompt dit "TOUJOURS remplir roleInsights" même sans résultats |
| `prompt passes cgiOffering when provided` | Vérifier que l'offre CGI apparaît dans le prompt |
| `prompt passes companyContext when provided` | Vérifier que le contexte entreprise est intégré |
| `prompt enforces zero fabrication on verifiedInfo` | Vérifier la règle de sourçage sur verifiedInfo |
| `prompt output schema matches ContactProfile type` | Parser le JSON template et vérifier la structure |

### 4.3 Tests unitaires — Search orchestrator

**Fichier existant ou nouveau :** `src/lib/research/__tests__/search-orchestrator.test.ts`

| Test | Description |
|---|---|
| `buildSearchQueries includes linkedin query` | Quand contactName + companyName fournis → query LinkedIn présente |
| `buildSearchQueries contact queries count` | Vérifier 2 queries contact (générale + LinkedIn) au lieu de 1 |
| `buildSearchQueries no contact without name` | Sans contactName → 0 query contact |

### 4.4 Tests de composants UI

**Nouveau fichier :** `src/components/brief/__tests__/contact-profile-card.test.tsx`

> Utiliser `@testing-library/react` + `vitest`

| Test | Description |
|---|---|
| `renders name and role` | Nom affiché en titre, rôle en sous-titre |
| `renders linkedin link when available` | Lien externe visible avec icône |
| `renders communication style always` | Tone, doList, dontList visibles même sans données vérifiées |
| `renders icebreakers` | Accroches affichées dans la zone "Comment lui parler" |
| `renders do list with green indicators` | Items "À faire" avec icône CheckCircle verte |
| `renders dont list with red indicators` | Items "À éviter" avec icône XCircle rouge |
| `renders typical challenges in collapsible` | Section collapsible "Enjeux typiques" s'ouvre/ferme |
| `renders decision factors in collapsible` | Section collapsible "Facteurs de décision" s'ouvre/ferme |
| `renders verified background when available` | Section "Parcours vérifié" visible si background non vide |
| `hides verified background when empty` | Section masquée si background vide |
| `renders publications when available` | Publications affichées si non vide |
| `hides publications when empty` | Section masquée si tableau vide |
| `renders sources when available` | Liens SourceLink cliquables |
| `renders provenance badge` | Badge "Basé sur le rôle de DSI dans les Télécoms" visible |
| `renders deepen button` | Bouton "Approfondir la recherche" présent |
| `deepen button calls callback` | Clic → callback `onDeepen` appelé avec le bon message |
| `handles dataFound=false gracefully` | Pas de crash, roleInsights toujours affichés, warning visible |
| `no crash with empty arrays` | Tableaux vides partout → pas d'erreur |

### 4.5 Test d'intégration E2E

**Test manuel** (checklist à suivre dans le navigateur) :

```markdown
## Checklist de test E2E — Contact V2

### Génération initiale — avec contact connu
- [ ] Lancer un chat avec "J'ai un RDV avec le DSI de Capgemini, Jean-Pierre Martin, pour du cloud"
- [ ] Confirmer le lancement du brief
- [ ] Aller sur l'onglet "Contact"
- [ ] Vérifier la zone "Comment lui parler" est remplie (tone, do/don't, icebreakers)
- [ ] Vérifier que les icebreakers mentionnent le secteur ou l'entreprise
- [ ] Vérifier les sections collapsibles (Enjeux, Facteurs de décision)
- [ ] Si parcours trouvé → vérifier la section "Parcours vérifié" avec sources
- [ ] Vérifier le badge de provenance en bas

### Génération initiale — sans contact connu
- [ ] Lancer un nouveau chat avec "RDV prospection avec Bouygues Telecom, je ne connais pas encore l'interlocuteur"
- [ ] L'IA doit demander au minimum le poste
- [ ] Répondre "Le RSSI"
- [ ] Vérifier que le brief se génère
- [ ] La section Contact doit afficher roleInsights (pas vide)
- [ ] Pas de section "Parcours vérifié" (nom inconnu = pas de recherche)
- [ ] Le badge doit dire "Basé sur le rôle de RSSI dans les Télécoms"

### Interactions
- [ ] Cliquer "Approfondir la recherche" → message envoyé dans le chat
- [ ] Vérifier que la recherche ciblée se lance
- [ ] Vérifier que le profil se met à jour avec les nouvelles données

### Export PDF
- [ ] Exporter en PDF
- [ ] Vérifier section "Comment aborder l'entretien" (do/don't)
- [ ] Vérifier accroches suggérées dans le PDF
- [ ] Vérifier mention "basé sur le rôle" en bas de section
- [ ] Vérifier sources cliquables si présentes

### Edge cases
- [ ] Contact sans poste → roleInsights génériques (pas de crash)
- [ ] Contact sans entreprise → insights limités mais présents
- [ ] Résultats de recherche vides → dataFound=false, roleInsights quand même remplis
- [ ] Mode Ollama (local) → même comportement qu'avec Gemini
- [ ] Affinage "reformule les conseils pour un profil plus technique" → MAJ de la section
```

---

## Ordre d'implémentation recommandé

```
1. types.ts                  — Étendre ContactProfile
2. search-orchestrator.ts    — Ajouter query LinkedIn
3. contact-profile.ts        — Refondre le prompt LLM (+ signature)
4. section-generator.ts      — Passer les nouveaux params au prompt
5. contact-profile-card.tsx  — Refonte UI complète
6. brief-panel.tsx           — Connecter onDeepen
7. confidence.ts             — Nouveau scoring contact
8. export-brief.ts           — MAJ export PDF section contact
9. Tests unitaires           — confidence + prompt + orchestrator
10. Tests composants         — contact-profile-card
11. Test E2E manuel          — Checklist complète
```

---

## Fichiers impactés (résumé)

| Fichier | Action |
|---|---|
| `src/lib/brief/types.ts` | Modifier — interface ContactProfile |
| `src/lib/research/search-orchestrator.ts` | Modifier — ajouter query LinkedIn |
| `src/lib/llm/prompts/sections/contact-profile.ts` | Réécrire — prompt + signature |
| `src/lib/brief/section-generator.ts` | Modifier — passer cgiOffering + companyContext |
| `src/components/brief/contact-profile-card.tsx` | Réécrire — UI complète |
| `src/components/brief/brief-panel.tsx` | Modifier — prop onDeepen |
| `src/lib/brief/confidence.ts` | Modifier — scoring contact |
| `src/lib/brief/export-brief.ts` | Modifier — HTML section contact |
| `src/lib/brief/__tests__/contact-confidence.test.ts` | Créer |
| `src/lib/llm/prompts/__tests__/contact-profile-prompt.test.ts` | Créer |
| `src/lib/research/__tests__/search-orchestrator.test.ts` | Créer ou modifier |
| `src/components/brief/__tests__/contact-profile-card.test.tsx` | Créer |

## Ce qui ne change PAS

- `route.ts` — Le tool call `generateBriefSection("contactProfile")` reste identique, seul le JSON retourné est plus riche
- `brief-store.ts` — `setContactProfile()` accepte déjà n'importe quel `ContactProfile`, aucun changement
- `session/store.ts` — Aucun changement
- Les autres sections du brief (radar, offres, questions, alertes) — Aucun impact
- `ResearchResults` interface — Inchangée (la query LinkedIn utilise la catégorie `contact` existante)

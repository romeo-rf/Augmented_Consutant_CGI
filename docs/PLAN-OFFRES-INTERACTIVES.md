# Plan d'implémentation — Section Offres Interactive

> **Objectif** : Transformer la section "Mapping Enjeux → Offres CGI" d'un tableau statique en un outil de préparation commerciale interactif.

---

## État actuel

| Élément | Status |
|---------|--------|
| Catalogue CGI (16 offres, JSON) | ✅ Existe |
| Prompt LLM → génère `OfferingMatch[]` | ✅ Existe |
| Composant d'affichage (`OfferingsMappingCard`) | ✅ Existe (lecture seule) |
| Store Zustand (`setOfferingsMapping`) | ✅ Existe (set uniquement, pas d'update partiel) |
| Composant Dialog/Sheet | ❌ Absent |
| Bibliothèque drag & drop | ❌ Absente |

---

## Fonctionnalités à implémenter

### F-OFF-1 : Valider / Rejeter une offre
**Priorité : Haute** — C'est le minimum pour que le consultant s'approprie les recommandations.

**Comportement :**
- Chaque carte offre affiche deux boutons : ✓ (garder) et ✗ (rejeter)
- Par défaut, toutes les offres sont en état "pending" (ni validées, ni rejetées)
- Une offre rejetée passe en grisé avec opacité réduite et se déplace en bas de la liste
- Une offre validée reçoit un indicateur visuel vert
- Un compteur "X offres retenues / Y total" s'affiche en haut de la section
- Action réversible : on peut re-valider une offre rejetée

**Modifications :**

| Fichier | Changement |
|---------|------------|
| `src/lib/brief/types.ts` | Ajouter `status: "pending" \| "accepted" \| "rejected"` à `OfferingMatch` |
| `src/store/brief-store.ts` | Ajouter `updateOfferingStatus(offeringId, status)` |
| `src/components/brief/offerings-mapping-card.tsx` | Ajouter boutons valider/rejeter, tri par status, compteur |

---

### F-OFF-2 : Détail d'une offre (panneau latéral)
**Priorité : Haute** — Le consultant doit comprendre l'offre pour en parler.

**Comportement :**
- Clic sur une carte offre → ouvre un panneau latéral (Sheet) à droite
- Le panneau affiche :
  - **Nom de l'offre** CGI
  - **Description complète** (depuis le catalogue)
  - **Proposition de valeur** (depuis le catalogue)
  - **Secteurs cibles** (badges)
  - **Enjeu client identifié** + raisonnement du mapping
  - **Score de pertinence** avec explication visuelle
- Bouton "Fermer" ou clic extérieur pour fermer

**Modifications :**

| Fichier | Changement |
|---------|------------|
| `src/components/ui/sheet.tsx` | **Créer** — Composant Sheet basé sur Radix Dialog |
| `src/components/brief/offering-detail-sheet.tsx` | **Créer** — Panneau détail offre |
| `src/components/brief/offerings-mapping-card.tsx` | Rendre chaque carte cliquable, gérer l'état d'ouverture |
| `src/lib/brief/types.ts` | Étendre `OfferingMatch` avec un champ optionnel `catalogDetail?: CgiOffering` |

---

### F-OFF-3 : Ajouter une offre manuellement
**Priorité : Moyenne** — Le consultant connaît son terrain, il doit pouvoir compléter l'IA.

**Comportement :**
- Bouton "+ Ajouter une offre" en bas de la liste
- Ouvre un dialog avec :
  - Un champ de recherche filtrant le catalogue CGI en temps réel
  - La liste des offres du catalogue non encore présentes dans le mapping
  - Clic sur une offre → formulaire rapide :
    - Enjeu client (champ texte, requis) — pourquoi cette offre ?
    - L'offre est ajoutée avec `status: "accepted"` et `relevanceScore: 100` (choix manuel = pertinence maximale)
- L'offre ajoutée manuellement est marquée visuellement (badge "Ajout manuel")

**Modifications :**

| Fichier | Changement |
|---------|------------|
| `src/components/ui/dialog.tsx` | **Créer** — Composant Dialog basé sur Radix Dialog |
| `src/components/brief/add-offering-dialog.tsx` | **Créer** — Dialog d'ajout avec recherche catalogue |
| `src/store/brief-store.ts` | Ajouter `addOffering(match: OfferingMatch)` et `removeOffering(id: string)` |
| `src/lib/brief/types.ts` | Ajouter `isManual?: boolean` à `OfferingMatch` |
| `src/components/brief/offerings-mapping-card.tsx` | Ajouter bouton d'ajout, badge "Ajout manuel" |

---

### F-OFF-4 : Réordonner par drag & drop
**Priorité : Moyenne** — Permet au consultant de prioriser sa stratégie.

**Comportement :**
- Chaque carte offre a une poignée de drag (icône grip à gauche)
- Drag & drop pour réordonner les offres selon la stratégie du consultant
- L'ordre est persisté dans le store Zustand
- Les offres rejetées restent en bas, non déplaçables
- Animation fluide pendant le drag

**Modifications :**

| Fichier | Changement |
|---------|------------|
| `package.json` | Ajouter `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` |
| `src/components/brief/offerings-mapping-card.tsx` | Wrapper DnD, poignée de drag, logique de réordonnancement |
| `src/store/brief-store.ts` | Ajouter `updateOfferingsOrder(offerings: OfferingMatch[])` |
| `src/lib/brief/types.ts` | Ajouter `order: number` à `OfferingMatch` |

---

### F-OFF-5 : Éléments de pitch par offre
**Priorité : Basse** — Valeur ajoutée forte mais plus complexe (appel LLM supplémentaire).

**Comportement :**
- Dans le panneau détail (F-OFF-2), bouton "Générer des éléments de pitch"
- Appelle le LLM avec le contexte (entreprise, enjeu, offre) pour générer :
  - 2-3 phrases d'accroche adaptées au client
  - Arguments clés de la proposition de valeur
  - Question d'ouverture suggérée
- Les éléments générés sont affichés dans le panneau et sauvegardés
- Bouton copier pour chaque élément

**Modifications :**

| Fichier | Changement |
|---------|------------|
| `src/lib/llm/prompts/sections/offering-pitch.ts` | **Créer** — Prompt de génération de pitch |
| `src/lib/brief/types.ts` | Ajouter `pitchElements?: PitchElements` à `OfferingMatch` |
| `src/app/api/brief/generate-pitch/route.ts` | **Créer** — API route pour génération de pitch |
| `src/components/brief/offering-detail-sheet.tsx` | Ajouter section pitch avec bouton générer + affichage |
| `src/store/brief-store.ts` | Ajouter `updateOfferingPitch(offeringId, pitch)` |

---

## Nouveaux types

```typescript
// Ajouts dans src/lib/brief/types.ts

interface OfferingMatch {
  // Existants
  issueName: string;
  issueDescription: string;
  offering: Pick<CgiOffering, "id" | "name">;
  reasoning: string;
  relevanceScore: number;
  // Nouveaux
  status: "pending" | "accepted" | "rejected";  // F-OFF-1
  order: number;                                  // F-OFF-4
  isManual?: boolean;                             // F-OFF-3
  catalogDetail?: CgiOffering;                    // F-OFF-2 (enrichi côté client)
  pitchElements?: PitchElements;                  // F-OFF-5
}

interface PitchElements {
  hookPhrases: string[];      // 2-3 phrases d'accroche
  keyArguments: string[];     // Arguments de la proposition de valeur
  openingQuestion: string;    // Question d'ouverture suggérée
  generatedAt: string;        // ISO timestamp
}
```

---

## Nouveaux composants UI

### `src/components/ui/sheet.tsx`
- Basé sur Radix Dialog (déjà dans `radix-ui`)
- Slide-in depuis la droite
- Overlay semi-transparent
- Accessible (focus trap, Escape pour fermer)

### `src/components/ui/dialog.tsx`
- Basé sur Radix Dialog
- Centré, avec overlay
- Accessible

---

## Ordre d'implémentation

```
Phase 1 — Fondations (composants UI + types)
│
├── Étape 1.1 : Mettre à jour les types (OfferingMatch enrichi)
├── Étape 1.2 : Créer le composant Sheet (ui/sheet.tsx)
├── Étape 1.3 : Créer le composant Dialog (ui/dialog.tsx)
└── Étape 1.4 : Mettre à jour le store Zustand (nouvelles actions)

Phase 2 — Valider/Rejeter (F-OFF-1)
│
├── Étape 2.1 : Ajouter boutons valider/rejeter sur chaque carte
├── Étape 2.2 : Logique de tri (validées > pending > rejetées)
├── Étape 2.3 : Compteur d'offres retenues
└── Étape 2.4 : Tester — vérifier les transitions d'état visuelles

Phase 3 — Détail offre (F-OFF-2)
│
├── Étape 3.1 : Créer OfferingDetailSheet avec affichage catalogue
├── Étape 3.2 : Rendre les cartes cliquables → ouvrir le sheet
├── Étape 3.3 : Enrichir OfferingMatch avec catalogDetail au moment du mapping
└── Étape 3.4 : Tester — vérifier ouverture/fermeture, contenu affiché

Phase 4 — Ajout manuel (F-OFF-3)
│
├── Étape 4.1 : Créer AddOfferingDialog avec recherche catalogue
├── Étape 4.2 : Filtrage en temps réel du catalogue
├── Étape 4.3 : Formulaire d'ajout (enjeu client)
├── Étape 4.4 : Badge "Ajout manuel" + intégration dans la liste
└── Étape 4.5 : Tester — recherche, ajout, affichage, suppression

Phase 5 — Drag & drop (F-OFF-4)
│
├── Étape 5.1 : Installer @dnd-kit
├── Étape 5.2 : Wrapper DndContext + SortableContext
├── Étape 5.3 : Rendre chaque carte sortable avec poignée
├── Étape 5.4 : Logique de réordonnancement (offres rejetées exclues du drag)
└── Étape 5.5 : Tester — drag, drop, persistance de l'ordre, exclusion rejetées

Phase 6 — Pitch (F-OFF-5)
│
├── Étape 6.1 : Créer le prompt LLM pour le pitch
├── Étape 6.2 : Créer la route API generate-pitch
├── Étape 6.3 : Ajouter la section pitch dans le sheet détail
├── Étape 6.4 : Bouton copier pour chaque élément de pitch
└── Étape 6.5 : Tester — génération, affichage, copie, rechargement
```

---

## Plan de test

### Tests manuels par phase

#### Phase 2 — Valider/Rejeter
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Clic sur ✓ d'une offre pending | L'offre passe en vert, status = "accepted" |
| 2 | Clic sur ✗ d'une offre pending | L'offre est grisée, glisse en bas de liste |
| 3 | Clic sur ✓ d'une offre rejetée | L'offre redevient active, remonte dans la liste |
| 4 | Vérifier le compteur | "2 offres retenues / 5 total" s'affiche correctement |
| 5 | Recharger la page | Les états sont perdus (POC, pas de persistance) — OK attendu |

#### Phase 3 — Détail offre
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Clic sur une carte offre | Le sheet s'ouvre à droite avec le détail complet |
| 2 | Vérifier le contenu | Description, proposition de valeur, secteurs, enjeu, score affichés |
| 3 | Clic hors du sheet | Le sheet se ferme |
| 4 | Touche Escape | Le sheet se ferme |
| 5 | Offre sans détail catalogue | Affichage gracieux (pas de crash), message "Détail non disponible" |

#### Phase 4 — Ajout manuel
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Clic sur "+ Ajouter une offre" | Le dialog s'ouvre avec la liste du catalogue |
| 2 | Taper "cyber" dans la recherche | Seule "Cybersécurité & Conformité" apparaît |
| 3 | Sélectionner une offre déjà dans le mapping | Elle n'apparaît pas dans la liste (filtrée) |
| 4 | Ajouter une offre avec enjeu client | L'offre apparaît dans la liste avec badge "Ajout manuel" |
| 5 | Champ enjeu vide | Le bouton d'ajout est désactivé |
| 6 | Supprimer une offre ajoutée manuellement | L'offre disparaît de la liste |

#### Phase 5 — Drag & drop
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Drag d'une offre vers le haut | L'offre change de position, animation fluide |
| 2 | Drop en position | L'ordre est sauvegardé dans le store |
| 3 | Drag d'une offre rejetée | Impossible (poignée absente ou désactivée) |
| 4 | Drag au clavier (Tab + Espace + Flèches) | Fonctionne (accessibilité @dnd-kit) |

#### Phase 6 — Pitch
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Clic "Générer des éléments de pitch" | Loading visible, puis phrases d'accroche + arguments affichés |
| 2 | Pitch déjà généré | Les éléments s'affichent directement, bouton "Regénérer" |
| 3 | Clic copier sur une phrase d'accroche | Copié dans le presse-papier, feedback visuel |
| 4 | Erreur LLM | Message d'erreur affiché dans le sheet, pas de crash |

### Test d'intégration global
| # | Scénario | Résultat attendu |
|---|----------|------------------|
| 1 | Lancer un brief complet via le chat | Les offres générées apparaissent avec les nouveaux contrôles |
| 2 | Valider 2 offres, rejeter 1, ajouter 1 manuellement | La liste reflète les 4 états correctement |
| 3 | Ouvrir le détail d'une offre ajoutée manuellement | Le sheet affiche le détail catalogue complet |
| 4 | Drag & drop sur les offres validées | L'ordre est respecté, les rejetées restent en bas |
| 5 | Naviguer entre les onglets du brief | Les données offres sont préservées |
| 6 | Utiliser le chat d'affinage pour demander plus d'infos sur une offre | Le LLM peut re-rechercher et mettre à jour la section |

---

## Estimation de complexité

| Phase | Fichiers touchés | Fichiers créés | Complexité |
|-------|-----------------|----------------|------------|
| Phase 1 — Fondations | 2 | 2 | Faible |
| Phase 2 — Valider/Rejeter | 1 | 0 | Faible |
| Phase 3 — Détail offre | 2 | 1 | Moyenne |
| Phase 4 — Ajout manuel | 2 | 1 | Moyenne |
| Phase 5 — Drag & drop | 2 | 0 | Moyenne |
| Phase 6 — Pitch | 2 | 2 | Haute |

---

## Dépendances à installer

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

> Note : Radix Dialog est déjà disponible via le package `radix-ui` existant. Pas besoin d'install supplémentaire pour Sheet et Dialog.

---

## Hors scope (POC)
- Persistance des choix du consultant (pas de DB)
- Export PDF de la sélection d'offres
- Historique des modifications
- Collaboration multi-utilisateurs
- Analytics sur les offres les plus sélectionnées

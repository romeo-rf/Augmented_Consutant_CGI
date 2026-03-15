# Plan d'implémentation — Questions interactives (F3d+)

## Objectif

Transformer la section Questions d'un affichage statique en un **outil de préparation interactif** où le consultant peut réorganiser, supprimer, ajouter et prioriser ses questions avant un RDV.

---

## État actuel

| Élément | Statut |
|---|---|
| Affichage groupé par phase (4 phases, timeline) | ✅ Fait |
| Expand/collapse par phase | ✅ Fait |
| Copier une question au clic | ✅ Fait |
| Export PDF avec questions | ✅ Fait |
| Store Zustand (`setQuestions`, `updateQuestionOrder`) | ✅ Fait |
| Drag & drop | ❌ Absent |
| Supprimer une question | ❌ Absent |
| Ajouter une question custom | ❌ Absent |
| Marquer comme prioritaire | ❌ Absent |
| Compteur mis à jour dynamiquement | ❌ Absent |

---

## Fonctionnalités à implémenter

### F1 — Drag & drop des questions

**Quoi** : Le consultant peut réordonner les questions **au sein d'une phase** et **entre phases** par glisser-déposer.

**Fichiers impactés** :
- `src/components/brief/questions-card.tsx` — Refonte majeure du composant
- `src/store/brief-store.ts` — `updateQuestionOrder` existe déjà, suffisant
- `package.json` — Ajout de `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`

**Détails techniques** :
1. Installer `@dnd-kit` (léger, accessible, React 19 compatible, 0 dépendance)
2. Wrapper chaque phase dans un `SortableContext` (items = IDs des questions de la phase)
3. Chaque `QuestionItem` devient un `useSortable` avec handle de drag (icône grip)
4. `DndContext` global avec `DragOverlay` pour le feedback visuel
5. Sur `onDragEnd` :
   - Si même container (phase) → réordonner localement
   - Si container différent → changer la `phase` de la question et réordonner
6. Appeler `updateQuestionOrder(newQuestions)` dans le store après chaque drop
7. Animation de transition avec `CSS.Transform` de dnd-kit

**Contraintes** :
- Le drag doit cohabiter avec l'expand/collapse des phases
- Handle de drag explicite (icône `GripVertical`) pour ne pas interférer avec le clic sur la question
- Mobile : le drag doit fonctionner au touch (dnd-kit le supporte nativement)

---

### F2 — Supprimer une question

**Quoi** : Bouton de suppression sur chaque question (visible au hover, comme le bouton copier).

**Fichiers impactés** :
- `src/components/brief/questions-card.tsx` — Ajout du bouton dans `QuestionItem`
- `src/store/brief-store.ts` — Ajout d'une action `deleteQuestion(id: string)`
- `src/lib/brief/confidence.ts` — Aucun changement (recalcul automatique car basé sur `data.length`)
- `src/lib/brief/export-brief.ts` — Aucun changement (exporte ce qui est dans le store)

**Détails techniques** :
1. Ajouter une icône `Trash2` (lucide) à côté de `Copy` dans `QuestionItem`
2. Au clic : confirmation légère (pas de modale, juste une animation de disparition)
3. Action store : `deleteQuestion: (id) => set(state => ({ questions: state.questions.filter(q => q.id !== id) }))`
4. Recalcul automatique des numéros (déjà dynamique via `questionIndex`)
5. Si la phase devient vide après suppression, elle disparaît naturellement (le `if (!questions || questions.length === 0) return null` existe déjà)

---

### F3 — Ajouter une question custom

**Quoi** : Le consultant peut ajouter sa propre question dans une phase donnée.

**Fichiers impactés** :
- `src/components/brief/questions-card.tsx` — Formulaire d'ajout par phase
- `src/store/brief-store.ts` — Ajout d'une action `addQuestion(question: SmartQuestion)`
- `src/lib/brief/types.ts` — Ajout optionnel d'un champ `isCustom?: boolean` sur `SmartQuestion`

**Détails techniques** :
1. Bouton `+ Ajouter une question` en bas de chaque phase (style discret, apparaît au hover de la phase)
2. Au clic → affiche un mini-formulaire inline (pas de modale) :
   - Input pour la question (placeholder : "Votre question...")
   - Input pour l'intention (placeholder : "Pourquoi poser cette question ?", optionnel)
   - Boutons Valider / Annuler
3. Génération de l'ID : `nanoid()` (déjà dans les dépendances)
4. `order` = dernier `order` de la phase + 1
5. `isCustom: true` pour distinguer visuellement les questions ajoutées manuellement (badge ou icône `User`)
6. Action store : `addQuestion: (q) => set(state => ({ questions: [...state.questions, q] }))`

**UX** :
- La question custom s'ajoute en bas de la phase
- Style légèrement différent (bordure en pointillés ou badge "Perso") pour la distinguer des questions IA

---

### F4 — Marquer comme prioritaire

**Quoi** : Toggle "prioritaire" sur chaque question. Les questions prioritaires sont visuellement mises en avant.

**Fichiers impactés** :
- `src/lib/brief/types.ts` — Ajout de `priority?: boolean` sur `SmartQuestion`
- `src/components/brief/questions-card.tsx` — Toggle et style conditionnel
- `src/store/brief-store.ts` — Ajout de `toggleQuestionPriority(id: string)`
- `src/lib/brief/export-brief.ts` — Marquage visuel dans le PDF (étoile ou gras)

**Détails techniques** :
1. Icône `Star` (lucide) à gauche du numéro, cliquable
2. État : étoile vide par défaut, étoile pleine jaune si prioritaire
3. Style prioritaire : fond légèrement doré (`bg-amber-50`), texte en semi-bold
4. Action store : `toggleQuestionPriority: (id) => set(state => ({ questions: state.questions.map(q => q.id === id ? { ...q, priority: !q.priority } : q) }))`
5. Export PDF : les questions prioritaires sont marquées avec ⭐ devant le texte

---

## Ordre d'implémentation

| Étape | Fonctionnalité | Justification |
|---|---|---|
| 1 | F2 — Supprimer | Le plus simple, aucune dépendance externe, pose les bases de l'interactivité |
| 2 | F4 — Prioritaire | Simple aussi, ajoute de la valeur immédiate |
| 3 | F3 — Ajouter custom | Formulaire inline, complexité modérée |
| 4 | F1 — Drag & drop | Le plus complexe, dépendance externe, mais bâtit sur les 3 précédentes |

---

## Modifications par fichier (résumé)

### `src/lib/brief/types.ts`
```diff
export interface SmartQuestion {
  id: string;
  phase: "ouverture" | "decouverte" | "approfondissement" | "conclusion";
  question: string;
  intent: string;
  order: number;
+ priority?: boolean;
+ isCustom?: boolean;
}
```

### `src/store/brief-store.ts`
```diff
interface BriefStore extends BriefState {
  // ... existant
+ deleteQuestion: (id: string) => void;
+ addQuestion: (question: SmartQuestion) => void;
+ toggleQuestionPriority: (id: string) => void;
}
```

### `src/components/brief/questions-card.tsx`
- Refonte complète du composant :
  - Intégration `@dnd-kit` (DndContext, SortableContext, useSortable)
  - Ajout des boutons d'action (supprimer, priorité) dans `QuestionItem`
  - Formulaire inline d'ajout par phase
  - Handle de drag (GripVertical)
  - Style conditionnel pour prioritaire et custom

### `src/lib/brief/export-brief.ts`
- Questions prioritaires marquées ⭐ dans l'export
- Questions custom identifiées (optionnel)

### `package.json`
```diff
+ "@dnd-kit/core": "^6.x",
+ "@dnd-kit/sortable": "^10.x",
+ "@dnd-kit/utilities": "^3.x"
```

---

## Plan de test

### Tests manuels (pas de framework de test configuré dans le projet)

#### F2 — Supprimer
| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Hover sur une question → icône poubelle visible | Icône apparaît à côté de l'icône copier |
| 2 | Clic sur poubelle | Question disparaît avec animation, compteurs mis à jour |
| 3 | Supprimer toutes les questions d'une phase | La phase disparaît de l'affichage |
| 4 | Supprimer toutes les questions | Message "Aucune question" affiché |
| 5 | Export PDF après suppression | Le PDF ne contient que les questions restantes |

#### F4 — Prioritaire
| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Clic sur l'étoile d'une question | Étoile devient jaune, fond doré |
| 2 | Re-clic sur l'étoile | Retour à l'état normal |
| 3 | Export PDF avec questions prioritaires | ⭐ affiché devant les questions marquées |
| 4 | Marquer plusieurs questions prioritaires | Chacune a son style indépendamment |

#### F3 — Ajouter custom
| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Clic sur "+ Ajouter une question" dans une phase | Formulaire inline apparaît |
| 2 | Remplir la question + valider | Question ajoutée en bas de la phase avec badge "Perso" |
| 3 | Valider sans texte | Le bouton est désactivé / rien ne se passe |
| 4 | Annuler le formulaire | Le formulaire disparaît, rien n'est ajouté |
| 5 | Ajouter sans intention | La question s'ajoute, l'intention est vide ou un texte par défaut |
| 6 | Export PDF avec question custom | La question apparaît normalement dans la trame |

#### F1 — Drag & drop
| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Drag via le handle (grip) d'une question | Overlay visuel suit le curseur |
| 2 | Drop dans la même phase | Question réordonnée, numéros recalculés |
| 3 | Drop dans une phase différente | Question change de phase, les deux phases se mettent à jour |
| 4 | Drag sur mobile (touch) | Fonctionne au doigt |
| 5 | Drag quand une phase est collapse | La phase ne s'ouvre pas (on ne peut pas drop dans une phase fermée) |
| 6 | Export PDF après réorganisation | L'ordre du PDF reflète le nouvel ordre |

#### Tests transversaux
| # | Scénario | Résultat attendu |
|---|---|---|
| 1 | Combinaison : ajouter, prioriser, supprimer, réordonner | Tout fonctionne ensemble sans conflit |
| 2 | Refresh page (state Zustand non persisté) | Les modifications sont perdues (comportement attendu POC) |
| 3 | Régénérer le brief via le chat | Les questions sont remplacées par les nouvelles |
| 4 | Badge de confiance après modifications | Se met à jour (count change si ajout/suppression) |
| 5 | Responsive mobile (< 640px) | Les boutons d'action restent visibles (pas de hover sur mobile) |

---

## Estimation de complexité

| Fonctionnalité | Complexité | Lignes estimées |
|---|---|---|
| F2 — Supprimer | Faible | ~30 lignes (store + composant) |
| F4 — Prioritaire | Faible | ~40 lignes (types + store + composant + export) |
| F3 — Ajouter custom | Moyenne | ~80 lignes (formulaire + store + composant) |
| F1 — Drag & drop | Élevée | ~150 lignes (setup dnd-kit + refonte composant) |
| **Total** | | **~300 lignes de code nouveau** |

---

## Risques et décisions

| Risque | Mitigation |
|---|---|
| `@dnd-kit` pas compatible React 19 | Vérifier la compat avant install — alternative : HTML5 drag natif |
| Performance avec 15+ questions draggables | dnd-kit est optimisé, pas de souci à cette échelle |
| Conflit drag vs expand/collapse | Handle de drag explicite (grip icon) distinct du header de phase |
| Perte de modifications au refresh | Acceptable pour un POC — documenter le comportement |

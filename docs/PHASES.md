# Phases d'Implémentation — Consultant Augmenté CGI

## Vue d'ensemble

Le développement est découpé en 10 phases séquentielles. Chaque phase produit un résultat testable.

```
Phase 0   Phase 1     Phase 2      Phase 3       Phase 4      Phase 5
 Docs  → Scaffolding → Chat basic → Extraction → Recherche → Catalogue
  ✅        │            │            │             │            │
            ▼            ▼            ▼             ▼            ▼
         Phase 6      Phase 7     Phase 8       Phase 9     Phase 10
         Brief gen → UI Brief → Layout/Polish → Affinage → Tests
```

---

## Phase 0 — Documentation (terminée)

### Objectif
Poser les bases du projet avec une documentation claire avant d'écrire du code.

### Livrables
| Fichier | Rôle |
|---|---|
| `CLAUDE.md` | Règles du projet pour l'assistant IA (stack, conventions, commandes) |
| `docs/ARCHITECTURE.md` | Architecture technique, modules, types, flux de données |
| `docs/FEATURES.md` | Spécifications fonctionnelles F1→F5 avec critères d'acceptation |
| `docs/PROMPTS.md` | Stratégie de prompts LLM (templates, règles) |
| `docs/PHASES.md` | Ce document |

### Résultat testable
Les documents existent et sont cohérents entre eux.

---

## Phase 1 — Scaffolding

### Objectif
Initialiser le projet Next.js avec toutes les dépendances et la structure de dossiers.

### Actions
1. Créer le projet Next.js 14+ avec App Router et TypeScript
2. Installer et configurer Tailwind CSS
3. Installer et configurer shadcn/ui (composants de base : button, card, tabs, input, badge...)
4. Installer les dépendances principales :
   - `ai`, `@ai-sdk/react`, `@ai-sdk/google` — Vercel AI SDK
   - `ollama-ai-provider` — Provider Ollama pour le AI SDK
   - `@tavily/core` — Client Tavily
   - `zod` — Validation de schémas
   - `zustand` — State management
   - `nanoid` — Génération d'IDs
5. Créer `.env.example` avec les variables d'environnement (sans les valeurs)
6. Créer `.gitignore` (inclut `.env.local`)
7. Créer l'arborescence de dossiers (`src/lib/`, `src/components/`, `src/hooks/`, `src/store/`)
8. Configurer le thème CGI (couleurs rouge/blanc/gris dans Tailwind)

### Résultat testable
`npm run dev` lance le serveur, on voit une page blanche avec le logo CGI.

---

## Phase 2 — LLM Abstraction + Chat basique

### Objectif
Avoir un chat fonctionnel qui communique avec le LLM en streaming.

### Actions
1. Créer `src/lib/llm/config.ts` — lecture des variables d'env (LLM_PROVIDER, modèles, URLs)
2. Créer `src/lib/llm/provider.ts` — factory `getModel()` qui retourne Gemini ou Ollama
3. Créer `src/app/api/chat/route.ts` — route API minimale :
   - Reçoit les messages via le protocole AI SDK
   - Appelle `streamText(getModel(), messages)`
   - Retourne le stream
4. Créer les composants chat :
   - `ChatPanel` — conteneur du chat
   - `MessageBubble` — bulle de message (utilisateur ou assistant)
   - `ChatInput` — zone de saisie + bouton envoyer
5. Brancher `useChat` du AI SDK sur la page principale

### Fichiers créés
```
src/lib/llm/config.ts
src/lib/llm/provider.ts
src/app/api/chat/route.ts
src/components/chat/chat-panel.tsx
src/components/chat/message-bubble.tsx
src/components/chat/chat-input.tsx
```

### Résultat testable
On tape un message → le LLM répond en streaming dans le chat. Fonctionne avec Gemini. Si Ollama est installé, fonctionne aussi en changeant `LLM_PROVIDER=ollama`.

---

## Phase 3 — Extraction du contexte meeting

### Objectif
L'IA extrait automatiquement les informations du RDV à partir de la conversation et pose des questions si des infos manquent.

### Actions
1. Créer `src/lib/types/meeting.ts` — type `MeetingContext` (companyName, sector, contactName, contactRole, meetingType, cgiOffering, completeness, missingFields)
2. Créer `src/lib/session/store.ts` — `Map<sessionId, SessionState>` en mémoire côté serveur
3. Créer `src/lib/llm/prompts/system-briefing.ts` — prompt système dynamique qui s'adapte à la phase (collecte / recherche / affinage)
4. Ajouter le tool `extractMeetingContext` dans la route `/api/chat` :
   - Le LLM l'appelle à chaque message pour extraire les infos
   - Met à jour le SessionStore
5. Ajouter la logique de questions : si des champs obligatoires manquent, l'IA pose une question ciblée
6. Afficher le contexte extrait dans l'UI (petit encadré montrant ce que l'IA a compris)

### Fichiers créés
```
src/lib/types/meeting.ts
src/lib/session/store.ts
src/lib/llm/prompts/system-briefing.ts
```

### Fichiers modifiés
```
src/app/api/chat/route.ts          # Ajout du tool extractMeetingContext + system prompt
src/app/page.tsx                    # Affichage du contexte extrait
```

### Résultat testable
```
Moi : "J'ai un RDV avec Carrefour pour du cyber"
IA  : extrait {companyName: "Carrefour", cgiOffering: "cybersécurité"}
IA  : "Qui sera votre interlocuteur ?"
Moi : "Le DSI, Marc Lefebvre"
IA  : extrait {contactName: "Marc Lefebvre", contactRole: "DSI"}
```

---

## Phase 4 — Recherche web (Tavily)

### Objectif
L'IA lance automatiquement des recherches web quand le contexte est suffisant, avec des sources traçables.

### Actions
1. Créer `src/lib/research/types.ts` — types SearchQuery, SearchResult, ResearchResults
2. Créer `src/lib/research/tavily-client.ts` — wrapper autour de `@tavily/core`
3. Créer `src/lib/research/search-orchestrator.ts` — lance 3-5 recherches Tavily en parallèle et agrège les résultats
4. Ajouter le tool `triggerResearch` dans la route `/api/chat` :
   - Le LLM décide quand lancer la recherche (contexte suffisant)
   - Construit les requêtes adaptées au contexte
   - Stocke les résultats dans le SessionStore
5. Afficher un indicateur "Recherche en cours..." dans le chat

### Fichiers créés
```
src/lib/research/types.ts
src/lib/research/tavily-client.ts
src/lib/research/search-orchestrator.ts
```

### Fichiers modifiés
```
src/app/api/chat/route.ts          # Ajout du tool triggerResearch
```

### Résultat testable
Après avoir donné le contexte, l'IA dit "Je lance les recherches..." → les résultats Tavily sont récupérés (visibles dans les logs serveur). Chaque résultat a un titre, une URL et du contenu.

---

## Phase 5 — Catalogue CGI

### Objectif
Créer la base de données locale des offres CGI simulées.

### Actions
1. Créer `src/lib/catalog/cgi-offerings.json` — 15-20 offres CGI couvrant :
   - Transformation digitale
   - Cybersécurité & conformité
   - Migration cloud (AWS, Azure, GCP)
   - Data & Intelligence Artificielle
   - ERP / SAP / Oracle
   - Conseil en management
   - Développement applicatif
   - Intégration de systèmes
   - DevOps & automatisation
   - Expérience client digital
   - IoT & industrie 4.0
   - Infrastructure & réseaux
   - GreenIT & sobriété numérique
   - RH & conduite du changement
   - Blockchain & traçabilité
2. Chaque offre a : id, name, description, targetSectors, keywords, valueProposition
3. Créer `src/lib/catalog/loader.ts` — chargement typé du JSON

### Fichiers créés
```
src/lib/catalog/cgi-offerings.json
src/lib/catalog/loader.ts
```

### Résultat testable
Le loader retourne un tableau typé d'offres CGI. On peut chercher une offre par mot-clé.

---

## Phase 6 — Génération du brief

### Objectif
L'IA génère les 5 sections du brief (F3a→F3e) à partir du contexte et des recherches.

### Actions
1. Créer `src/lib/brief/types.ts` — types pour chaque section : ClientRadar, ContactProfile, OfferingMatch, SmartQuestion, AlertItem, BriefState
2. Créer les prompts par section dans `src/lib/llm/prompts/sections/` :
   - `client-radar.ts` (F3a)
   - `contact-profile.ts` (F3b)
   - `offerings-mapping.ts` (F3c) — injecte le catalogue CGI
   - `questions.ts` (F3d)
   - `alerts.ts` (F3e)
3. Créer `src/lib/brief/section-generator.ts` — appelle le LLM avec le prompt de section + contexte + recherche, parse le JSON retourné, valide avec Zod
4. Ajouter le tool `generateBriefSection` dans la route `/api/chat`
5. Créer `src/store/brief-store.ts` — store Zustand qui stocke les 5 sections

### Fichiers créés
```
src/lib/brief/types.ts
src/lib/brief/section-generator.ts
src/lib/llm/prompts/sections/client-radar.ts
src/lib/llm/prompts/sections/contact-profile.ts
src/lib/llm/prompts/sections/offerings-mapping.ts
src/lib/llm/prompts/sections/questions.ts
src/lib/llm/prompts/sections/alerts.ts
src/store/brief-store.ts
```

### Fichiers modifiés
```
src/app/api/chat/route.ts          # Ajout du tool generateBriefSection
```

### Résultat testable
Après la recherche, l'IA génère les 5 sections. Les données JSON sont dans le Zustand store (vérifiable via React DevTools). Pas encore d'affichage — ça vient en Phase 7.

---

## Phase 7 — UI du Brief

### Objectif
Afficher les 5 sections du brief dans un panneau avec onglets à droite du chat.

### Actions
1. Créer `src/components/brief/brief-panel.tsx` — conteneur avec onglets shadcn/ui Tabs
2. Créer `src/components/brief/brief-header.tsx` — titre du brief, statut, timestamp
3. Créer les 5 cartes de section :
   - `client-radar-card.tsx` (F3a) — carte d'identité entreprise, actualités, faits marquants
   - `contact-profile-card.tsx` (F3b) — profil, parcours, conseils d'approche
   - `offerings-mapping-card.tsx` (F3c) — tableau enjeux → offres avec score
   - `questions-card.tsx` (F3d) — liste de questions groupées par phase, drag & drop
   - `alerts-card.tsx` (F3e) — alertes colorées par sévérité
4. Créer `src/components/brief/source-link.tsx` — composant réutilisable pour les sources cliquables
5. Créer `src/components/shared/loading-section.tsx` — skeleton de chargement
6. Brancher les composants sur le Zustand store
7. Connecter les `onToolCall` de useChat pour mettre à jour le store en temps réel

### Fichiers créés
```
src/components/brief/brief-panel.tsx
src/components/brief/brief-header.tsx
src/components/brief/client-radar-card.tsx
src/components/brief/contact-profile-card.tsx
src/components/brief/offerings-mapping-card.tsx
src/components/brief/questions-card.tsx
src/components/brief/alerts-card.tsx
src/components/brief/source-link.tsx
src/components/shared/loading-section.tsx
```

### Fichiers modifiés
```
src/app/page.tsx                    # Intégration du BriefPanel à côté du chat
```

### Résultat testable
Après la conversation, le panneau droit affiche les 5 onglets. Chaque section montre les données avec les sources cliquables. Les questions sont réordonnables par drag & drop.

---

## Phase 8 — Layout responsive + Polish

### Objectif
Rendre l'interface professionnelle, responsive, et aux couleurs CGI.

### Actions
1. Créer `src/components/layout/app-shell.tsx` — layout 2 panneaux (chat 45% / brief 55%)
2. Créer `src/components/layout/header.tsx` — barre CGI (logo, titre, badge provider)
3. Créer `src/components/layout/provider-badge.tsx` — affiche "Gemini" ou "Ollama (local)"
4. Créer `src/components/chat/suggested-prompts.tsx` — suggestions au démarrage :
   - "J'ai un RDV avec le DSI de Carrefour pour de la cybersécurité"
   - "Je rencontre le directeur innovation de SNCF mardi"
   - "Prospection chez BNP Paribas sur le cloud"
5. Responsive : sur mobile, afficher un toggle chat/brief au lieu du split
6. Traduire tous les textes UI en français (boutons, placeholders, messages d'erreur)
7. Ajouter des animations de transition (skeleton → contenu)

### Fichiers créés
```
src/components/layout/app-shell.tsx
src/components/layout/header.tsx
src/components/layout/provider-badge.tsx
src/components/chat/suggested-prompts.tsx
```

### Fichiers modifiés
```
src/app/page.tsx                    # Utilisation de AppShell
src/app/globals.css                 # Thème CGI (rouge #E31937, gris, blanc)
tailwind.config.ts                  # Couleurs CGI custom
```

### Résultat testable
L'app ressemble à un produit CGI. Le layout est propre en desktop et mobile. Les prompts suggérés fonctionnent au clic. Le badge affiche le bon provider.

---

## Phase 9 — Chat d'affinage

### Objectif
Permettre au consultant d'affiner le brief via le chat après sa génération.

### Actions
1. Créer `src/lib/llm/prompts/system-refinement.ts` — prompt d'affinage qui inclut le brief actuel
2. Mettre à jour la route `/api/chat` pour détecter le mode affinage (brief déjà généré)
3. L'IA doit pouvoir :
   - Lancer de nouvelles recherches ciblées (`triggerResearch` avec requête spécifique)
   - Mettre à jour une seule section (`generateBriefSection` ciblé)
   - Répondre à des questions sans modifier le brief
4. Afficher un indicateur "Mise à jour..." sur l'onglet concerné pendant l'affinage

### Fichiers créés
```
src/lib/llm/prompts/system-refinement.ts
```

### Fichiers modifiés
```
src/app/api/chat/route.ts          # Logique de détection affinage
src/lib/llm/prompts/system-briefing.ts  # Phase 'ready' enrichie
```

### Résultat testable
```
[Brief déjà généré]
Moi : "Creuse les enjeux cybersécurité dans le retail"
IA  : Nouvelle recherche Tavily ciblée → met à jour Radar + Alertes
Moi : "Ajoute des questions sur le budget IT"
IA  : Met à jour l'onglet Questions avec 2-3 nouvelles questions
```

---

## Phase 10 — Tests & gestion d'erreurs

### Objectif
S'assurer que tout fonctionne de bout en bout, avec les deux providers LLM, et gérer les cas d'erreur.

### Actions
1. Tester le flow complet avec **Gemini 2.5 Flash** :
   - Conversation → extraction → recherche → brief → affinage
2. Tester le flow complet avec **Ollama + Mistral Nemo** :
   - Vérifier que le JSON est bien parsé (modèles 7B moins fiables)
   - Ajouter un retry si le JSON est invalide
3. Gérer les erreurs :
   - Tavily indisponible → message d'erreur explicite, le chat reste fonctionnel
   - Ollama pas lancé → message "Veuillez démarrer Ollama"
   - Clé API manquante → message au démarrage
   - LLM retourne du JSON invalide → retry 1 fois, puis message d'erreur
4. Créer `src/app/api/health/route.ts` — vérification de la connectivité LLM + Tavily
5. Tester le responsive (mobile, tablette)
6. Mettre à jour le `README.md` avec les instructions d'installation et d'utilisation

### Fichiers créés
```
src/app/api/health/route.ts
```

### Fichiers modifiés
```
README.md                           # Instructions complètes
src/app/api/chat/route.ts          # Gestion d'erreurs enrichie
src/lib/research/tavily-client.ts  # Gestion erreur Tavily
src/lib/llm/provider.ts            # Gestion erreur Ollama
```

### Résultat testable
- Flow complet OK avec Gemini
- Flow complet OK avec Ollama (si installé)
- Messages d'erreur clairs si un service est indisponible
- `GET /api/health` retourne le statut de chaque service
- `README.md` permet à quelqu'un de setup le projet from scratch

---

## Résumé des dépendances entre phases

```
Phase 0 (Docs)          ← aucune dépendance
Phase 1 (Scaffolding)   ← Phase 0
Phase 2 (Chat)          ← Phase 1
Phase 3 (Extraction)    ← Phase 2
Phase 4 (Recherche)     ← Phase 3
Phase 5 (Catalogue)     ← Phase 1 (indépendant de 2-4)
Phase 6 (Brief gen)     ← Phase 4 + Phase 5
Phase 7 (UI Brief)      ← Phase 6
Phase 8 (Layout)        ← Phase 7
Phase 9 (Affinage)      ← Phase 7
Phase 10 (Tests)        ← Phase 8 + Phase 9
```

> **Note** : La Phase 5 (Catalogue CGI) peut être faite en parallèle des Phases 2-4.

# Architecture — Consultant Augmenté CGI

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────┐
│                     NAVIGATEUR                           │
│                                                          │
│  ┌────────────────────┐   ┌───────────────────────────┐ │
│  │    Chat Panel       │   │      Brief Panel          │ │
│  │                     │   │                           │ │
│  │  useChat (AI SDK)   │   │  Zustand Store            │ │
│  │  ↕ streaming        │   │  5 onglets (F3a→F3e)     │ │
│  └─────────┬──────────┘   └────────────┬──────────────┘ │
│            │                           │                 │
│            │   onToolCall → update     │                 │
│            └───────────────────────────┘                 │
└────────────────────┬────────────────────────────────────┘
                     │ SSE Stream (AI SDK protocol)
                     ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVEUR NEXT.JS                         │
│                                                          │
│  POST /api/chat                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  streamText(model, messages, tools)              │    │
│  │                                                   │    │
│  │  Tools:                                           │    │
│  │  ├── extractMeetingContext → Session Store        │    │
│  │  ├── triggerResearch ──────→ Tavily API (web)    │    │
│  │  └── generateBriefSection → LLM + prompts        │    │
│  │                                                   │    │
│  │  maxSteps: 5 (multi-step tool use)               │    │
│  └─────────────────────────────────────────────────┘    │
│                                                          │
│  Session Store (Map en mémoire)                          │
│  Catalogue CGI (JSON statique)                           │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ▼                  ▼
        ┌────────────┐    ┌─────────────┐
        │  LLM       │    │  Tavily API │
        │            │    │  (recherche │
        │  Gemini    │    │   web)      │
        │  ou Ollama │    │             │
        └────────────┘    └─────────────┘
```

## Modules

### `src/lib/llm/` — Abstraction LLM

**Responsabilité** : fournir un modèle LLM uniforme quel que soit le provider.

```typescript
// provider.ts — la seule fonction à appeler
getModel(): LanguageModelV1
```

Le Vercel AI SDK fournit l'interface `LanguageModelV1` implémentée par `@ai-sdk/google` et `ollama-ai-provider`. Le switch se fait via `LLM_PROVIDER` dans `.env.local`.

**Pourquoi cette approche** : pas de wrapper custom, on réutilise l'abstraction du SDK. Un seul point de changement.

### `src/lib/llm/prompts/` — Prompts LLM

**Responsabilité** : générer les prompts système dynamiquement selon l'état de la session.

- `system-briefing.ts` : prompt principal de la conversation. Inclut le contexte extrait, les champs manquants, les instructions selon la phase (collecte, recherche, affinage).
- `sections/*.ts` : un prompt par section du brief. Prend le contexte meeting + résultats de recherche + catalogue CGI en entrée, produit du JSON structuré.

**Pourquoi dynamique** : le prompt est reconstruit à chaque appel API. L'IA sait toujours où elle en est (quelles infos manquent, si la recherche a été faite, etc.).

### `src/lib/research/` — Recherche web

**Responsabilité** : interroger le web via Tavily et agréger les résultats.

- `tavily-client.ts` : wrapper mince autour de `@tavily/core`
- `search-orchestrator.ts` : lance 3-5 requêtes en parallèle (entreprise, contact, secteur, concurrents, actualités), agrège les résultats

**Pourquoi Tavily** : conçu pour le RAG, retourne du contenu extrait + URL source directement (pas juste des liens). Free tier de 1000 req/mois suffisant pour le POC.

### `src/lib/catalog/` — Catalogue CGI

**Responsabilité** : fournir les offres CGI pour le matching enjeux/offres.

- `cgi-offerings.json` : 15-20 offres simulées avec id, nom, description, secteurs cibles, mots-clés, proposition de valeur
- `loader.ts` : chargement typé du JSON

**Pourquoi JSON statique** : pas besoin de DB pour un POC. Le fichier est facilement modifiable pour ajouter des offres.

### `src/lib/brief/` — Génération du brief

**Responsabilité** : orchestrer la génération des 5 sections du brief.

- `types.ts` : types TypeScript pour chaque section (ClientRadar, ContactProfile, OfferingMatch, SmartQuestion, AlertItem)
- `section-generator.ts` : pour une section donnée, construit le prompt, appelle le LLM, parse la réponse JSON

### `src/lib/session/` — Sessions

**Responsabilité** : stocker l'état de chaque conversation.

- `store.ts` : `Map<string, SessionState>` en mémoire. Chaque session contient : MeetingContext, ResearchResults, BriefState, historique.

**Pourquoi en mémoire** : POC, pas de persistance nécessaire. Les données sont perdues au redémarrage du serveur.

### `src/app/api/chat/route.ts` — Route principale

**Responsabilité** : point d'entrée unique, orchestre tout le flow via streaming + tool calls.

Le LLM décide de manière autonome :
1. Appeler `extractMeetingContext` pour mettre à jour le contexte
2. Poser des questions si des infos manquent
3. Appeler `triggerResearch` quand le contexte est suffisant
4. Appeler `generateBriefSection` pour générer chaque section
5. Reformuler/affiner si le consultant demande des précisions

**maxSteps: 5** permet au LLM d'enchaîner plusieurs tool calls dans un seul échange.

## Types principaux

```typescript
// Contexte extrait de la conversation
interface MeetingContext {
  companyName: string | null;
  sector: string | null;
  contactName: string | null;
  contactRole: string | null;
  meetingType: string | null;
  cgiOffering: string | null;
  additionalContext: string | null;
  completeness: number;        // 0-100
  missingFields: string[];
}

// Source web (attachée à chaque info)
interface Source {
  url: string;
  title: string;
  snippet?: string;
}

// Sections du brief
interface ClientRadar { ... }        // F3a
interface ContactProfile { ... }     // F3b
interface OfferingMatch { ... }      // F3c
interface SmartQuestion { ... }      // F3d
interface AlertItem { ... }          // F3e

// État global du brief
interface BriefState {
  status: 'idle' | 'gathering' | 'researching' | 'generating' | 'ready' | 'refining';
  meetingContext: MeetingContext;
  clientRadar: ClientRadar | null;
  contactProfile: ContactProfile | null;
  offeringsMapping: OfferingMatch[];
  questions: SmartQuestion[];
  alerts: AlertItem[];
}
```

## Décisions d'architecture

| Décision | Justification |
|---|---|
| Vercel AI SDK pour l'abstraction | Évite un wrapper custom, providers Gemini et Ollama déjà implémentés, streaming inclus |
| Tool calls LLM plutôt que routes séparées | L'IA orchestre elle-même le flow (quand chercher, quand générer), plus naturel et flexible |
| Prompts dynamiques | Le même endpoint gère collecte, recherche et affinage — le prompt s'adapte à la phase |
| Zustand pour le brief | Mis à jour depuis les callbacks `onToolCall` de useChat, évite le prop drilling, fonctionne hors composants React |
| Pas de DB | POC école, les sessions vivent en mémoire le temps du dev/démo |
| Dual-mode LLM | Démontre la faisabilité cloud ET souveraineté locale — argument fort en soutenance |

## Flux de données

```
Message utilisateur
    │
    ▼
useChat POST /api/chat
    │
    ▼
streamText(getModel(), system prompt dynamique, messages, tools)
    │
    ├── Tool: extractMeetingContext
    │   └── Met à jour SessionStore.meetingContext
    │
    ├── Si infos manquantes → LLM génère une question
    │   └── Streamé au client → affiché dans le chat
    │
    ├── Si contexte suffisant → Tool: triggerResearch
    │   ├── 3-5 requêtes Tavily en parallèle
    │   └── Résultats stockés dans SessionStore.researchResults
    │
    ├── Tool: generateBriefSection (x5)
    │   ├── Appelle LLM avec prompt section + contexte + recherche
    │   └── Résultat JSON parsé → retourné au stream
    │
    └── Texte de synthèse streamé au client
         │
         ▼
    Client reçoit le stream :
    ├── Texte → affiché dans le chat
    └── Tool results → Zustand store → Brief panel mis à jour
```

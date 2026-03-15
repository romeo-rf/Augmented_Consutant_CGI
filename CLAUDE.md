# CLAUDE.md — Consultant Augmenté CGI

## Description du projet
Application web "Préparation du Consultant Augmenté" pour les consultants CGI.
Le consultant décrit un RDV de prospection via un chat, l'IA collecte les infos, recherche sur le web, et génère un brief structuré.

## Stack technique
- **Framework** : Next.js 16 (App Router), TypeScript strict
- **UI** : Tailwind CSS + shadcn/ui
- **LLM** : Dual-mode via Vercel AI SDK
  - Cloud : Gemini 2.5 Flash (`@ai-sdk/google`)
  - Local : Ollama + Mistral Nemo (`ollama-ai-provider`)
  - Swappable via `LLM_PROVIDER` dans `.env.local`
- **Recherche web** : Tavily API (`@tavily/core`)
- **State management** : Zustand (brief), `useChat` du AI SDK (chat), Map en mémoire (sessions serveur)
- **Aucune base de données** — POC uniquement

## Commandes
```bash
npm run dev      # Lancer le serveur de développement
npm run build    # Build de production
npm run lint     # Lint du code (ESLint 9 flat config)
```

## Conventions de code

### Langue
- **UI** : tout en français (labels, placeholders, messages d'erreur, titres)
- **Code** : noms de variables/fonctions en anglais
- **Commentaires** : français accepté pour les explications métier, anglais pour le technique
- **Prompts LLM** : en français

### Structure
- Components dans `src/components/`, organisés par domaine (chat/, brief/, layout/, ui/)
- Logique métier dans `src/lib/`
- API routes dans `src/app/api/`
- Types dans `src/lib/types/` et co-localisés quand spécifiques à un module
- Hooks custom dans `src/hooks/`
- Store Zustand dans `src/store/`

### Patterns
- Utiliser `getModel()` de `src/lib/llm/provider.ts` pour TOUT appel LLM (jamais d'import direct de google/ollama)
- Les prompts LLM sont dans `src/lib/llm/prompts/` — jamais de prompt hardcodé dans les routes
- Toute information affichée provenant de la recherche web DOIT avoir une source (URL) cliquable
- Utiliser les tool calls du AI SDK pour l'orchestration (extractMeetingContext, triggerResearch, generateBriefSection)
- Streaming par défaut pour les réponses LLM

### Sécurité
- Ne JAMAIS committer les clés API (.env.local est dans .gitignore)
- .env.example contient les noms de variables sans les valeurs
- Valider les inputs utilisateur avec Zod dans les API routes

## Variables d'environnement
```
GOOGLE_GENERATIVE_AI_API_KEY=   # Clé API Gemini
TAVILY_API_KEY=                  # Clé API Tavily
LLM_PROVIDER=gemini              # "gemini" ou "ollama"
OLLAMA_MODEL=mistral-nemo        # Modèle Ollama (si LLM_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434  # URL Ollama
GEMINI_MODEL=gemini-2.5-flash    # Modèle Gemini
```

## Architecture clé
- `src/lib/llm/provider.ts` — Point d'entrée unique pour le LLM
- `src/app/api/chat/route.ts` — Route principale, gère streaming + tool calls
- `src/lib/llm/prompts/system-briefing.ts` — Prompt système dynamique
- `src/lib/research/search-orchestrator.ts` — Orchestration des recherches Tavily
- `src/store/brief-store.ts` — État global du brief (Zustand)
- `src/lib/catalog/cgi-offerings.json` — Catalogue des offres CGI (données simulées)

## Documentation
- `docs/ARCHITECTURE.md` — Architecture détaillée et décisions
- `docs/FEATURES.md` — Spécifications fonctionnelles
- `docs/PROMPTS.md` — Stratégie de prompts LLM

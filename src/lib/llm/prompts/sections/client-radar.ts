import type { ResearchResults } from "@/lib/research/types";

export function buildClientRadarPrompt(
  companyName: string,
  sector: string,
  research: ResearchResults
): string {
  const companyResults = JSON.stringify(research.company.slice(0, 10));
  const newsResults = JSON.stringify(research.news.slice(0, 5));
  const competitorResults = JSON.stringify(research.competitor.slice(0, 5));

  return `Tu es un analyste business senior spécialisé dans la préparation de rendez-vous de prospection pour des consultants IT (CGI).

Génère un brief stratégique complet de l'entreprise "${companyName}" (secteur : ${sector}).

Ce brief sera utilisé par un consultant pour préparer un RDV de prospection. Il doit pouvoir :
1. Scanner les infos essentielles en 2 minutes
2. Citer des chiffres précis en réunion
3. Rebondir sur les enjeux de l'entreprise
4. Adapter son pitch aux préoccupations du prospect

RÉSULTATS DE RECHERCHE — INFORMATIONS ENTREPRISE :
${companyResults}

RÉSULTATS DE RECHERCHE — ACTUALITÉS :
${newsResults}

RÉSULTATS DE RECHERCHE — ÉCOSYSTÈME & CONCURRENCE :
${competitorResults}

RÈGLE ABSOLUE : ZÉRO FABRICATION
- Extrais UNIQUEMENT les faits vérifiables présents dans les résultats de recherche ci-dessus.
- Chaque fait DOIT être traçable à une source.
- Si une information n'est PAS dans les résultats, mets null ou un tableau vide — ne devine JAMAIS.
- N'extrapole pas : si le CA n'est pas mentionné, revenue = null. Si l'effectif n'est pas clair, employeeCount = null.
- Les actualités doivent être réelles et présentes dans les résultats — n'en invente aucune.
- Pour l'elevatorPitch, base-toi UNIQUEMENT sur des faits extraits des sources.

IMPORTANT — CHAQUE CHAMP DOIT ÊTRE PRÉSENT :
Tous les champs ci-dessous sont OBLIGATOIRES dans ta réponse JSON. Si l'information n'a pas été trouvée dans les résultats de recherche, utilise null pour les strings, [] pour les tableaux, "unknown"/"inconnue" pour les enums. Ne supprime AUCUN champ.

RÉPONDS EN JSON VALIDE (et uniquement du JSON, pas de texte autour) :
{
  "companyName": "string",
  "sector": "string",
  "activity": "string | null (description concrète de ce que fait l'entreprise en 1-2 phrases. Ex: 'Éditeur de logiciels de gestion pour les PME industrielles, spécialisé dans l'ERP et la supply chain'. null si pas trouvé)",
  "size": "PME | ETI | Grand Groupe | null",
  "employeeCount": "string | null (effectif précis. Ex: '3 200 collaborateurs', '~15 000 salariés'. null si pas trouvé)",
  "revenue": "string | null (chiffre d'affaires. Ex: '450M€', '2.3 Mds€'. null si pas trouvé)",
  "headquarters": "string | null (siège social. Ex: 'Paris La Défense'. null si pas trouvé)",
  "geographicPresence": "string | null (empreinte géographique au-delà du siège. Ex: 'Présent dans 12 pays, 45 agences en France'. null si pas trouvé)",
  "mainClients": ["string (clients principaux ou marchés/segments cibles mentionnés dans les sources. Ex: 'Secteur bancaire', 'Airbus', 'PME industrielles'. Tableau vide si pas trouvé)"],
  "recentNews": [
    {
      "headline": "string",
      "date": "string",
      "source": { "url": "string", "title": "string" },
      "businessSignal": "string | undefined (en quoi cette actu révèle un besoin potentiel en conseil IT ? Laisser undefined si pas de lien évident)"
    }
  ],
  "keyFacts": ["string (chaque fait doit provenir des sources)"],
  "sources": [{ "url": "string", "title": "string" }],

  "financialTrend": {
    "direction": "growth | stable | decline | unknown",
    "details": "string (ex: 'CA en hausse de 12% sur 2025'. Chaîne vide si unknown)",
    "source": { "url": "string", "title": "string" } | null
  },
  "strategicIssues": [
    {
      "category": "digital | rh | reglementaire | croissance | restructuration | innovation | autre",
      "title": "string (titre court de l'enjeu)",
      "description": "string (description en 1-2 phrases)",
      "source": { "url": "string", "title": "string" } | null
    }
  ],
  "ecosystem": {
    "competitors": ["string (concurrents principaux)"],
    "knownPartners": ["string (partenaires technologiques)"],
    "marketPosition": "string (position marché en 1 phrase. 'Non déterminé' si pas d'info)",
    "source": { "url": "string", "title": "string" } | null
  },
  "digitalMaturity": {
    "level": "avancee | en_cours | emergente | inconnue",
    "signals": ["string (signaux observés : projets IT, recrutements tech, migrations cloud, etc.)"],
    "source": { "url": "string", "title": "string" } | null
  },
  "elevatorPitch": "string (1-2 phrases d'accroche contextuelle prêtes à l'emploi. Chaîne vide si pas assez d'infos)",
  "keyNumbers": ["string (max 3 chiffres clés à retenir. Ex: '450M€ de CA', '3 200 collaborateurs', 'Présent dans 12 pays'. Tableau vide si aucun chiffre trouvé)"]
}`;
}

import type { MeetingContext } from "@/lib/types/meeting";
import type { ResearchResults } from "@/lib/research/types";

export function buildAlertsPrompt(
  context: MeetingContext,
  research: ResearchResults
): string {
  const allResults = JSON.stringify({
    company: research.company.slice(0, 3).map((r) => ({ content: r.content.slice(0, 300), url: r.url, title: r.title })),
    news: research.news.slice(0, 3).map((r) => ({ content: r.content.slice(0, 300), url: r.url, title: r.title })),
    competitor: research.competitor.slice(0, 3).map((r) => ({ content: r.content.slice(0, 300), url: r.url, title: r.title })),
  });

  return `Tu es un consultant senior qui prépare un collègue pour un RDV. Identifie les points d'attention et risques.

CONTEXTE :
- Entreprise : ${context.companyName} (${context.sector})
- Interlocuteur : ${context.contactRole || "Non précisé"}

RÉSULTATS DE RECHERCHE :
${allResults}

CONSIGNES :
- Identifie les sujets sensibles (restructuration, bad buzz, litiges).
- Identifie les concurrents IT déjà en place.
- Anticipe les objections probables et propose une réponse.
- Identifie les opportunités (appels d'offres, projets annoncés).
- Ne sois pas alarmiste : ne mentionne que ce qui est factuel et sourcé.
- Si aucune alerte pertinente, retourne un tableau vide.

RÉPONDS EN JSON VALIDE (et uniquement du JSON) :
{
  "alerts": [
    {
      "type": "sensible | concurrent | objection | opportunite",
      "title": "string",
      "description": "string",
      "severity": "info | warning | critical",
      "source": { "url": "string", "title": "string" } ou null
    }
  ]
}`;
}

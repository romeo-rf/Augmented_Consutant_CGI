import type { MeetingContext } from "@/lib/types/meeting";
import type { ResearchResults } from "@/lib/research/types";
import type { CgiOffering } from "@/lib/catalog/loader";

export function buildOfferingsMappingPrompt(
  context: MeetingContext,
  research: ResearchResults,
  catalog: CgiOffering[]
): string {
  const researchSummary = JSON.stringify({
    company: research.company.slice(0, 3).map((r) => r.content.slice(0, 300)),
    sector: research.sector.slice(0, 3).map((r) => r.content.slice(0, 300)),
    news: research.news.slice(0, 3).map((r) => r.content.slice(0, 300)),
  });

  const catalogJson = JSON.stringify(
    catalog.map((o) => ({
      id: o.id,
      name: o.name,
      description: o.description.slice(0, 150),
      keywords: o.keywords,
    }))
  );

  return `Tu es un directeur commercial chez CGI. Identifie les enjeux du client et recommande les offres CGI pertinentes.

CONTEXTE DU RENDEZ-VOUS :
- Entreprise : ${context.companyName} (${context.sector})
- Interlocuteur : ${context.contactName || "Non précisé"} (${context.contactRole || "Non précisé"})
- Offre visée par le consultant : ${context.cgiOffering || "Non précisée"}

INFORMATIONS DE RECHERCHE :
${researchSummary}

CATALOGUE DES OFFRES CGI :
${catalogJson}

CONSIGNES :
- Identifie les enjeux du client qui sont EXPLICITEMENT mentionnés ou clairement impliqués dans les résultats de recherche.
- Ne déduis PAS d'enjeux "probables" à partir de rien — chaque enjeu doit être justifié par un élément des recherches.
- Pour chaque enjeu identifié, recommande l'offre CGI la plus pertinente du catalogue.
- Explique le raisonnement en citant l'élément de recherche qui justifie cet enjeu.
- Si le consultant a précisé une offre, inclus-la en priorité.
- Score de pertinence de 1 (faible) à 5 (très pertinent).
- S'il n'y a pas assez d'informations pour identifier des enjeux, retourne un tableau vide plutôt que d'inventer.

RÉPONDS EN JSON VALIDE (et uniquement du JSON) :
{
  "matches": [
    {
      "issueName": "string",
      "issueDescription": "string",
      "offering": { "id": "string", "name": "string" },
      "reasoning": "string",
      "relevanceScore": number
    }
  ]
}`;
}

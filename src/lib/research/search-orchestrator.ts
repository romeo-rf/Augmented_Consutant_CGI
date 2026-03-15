import type { MeetingContext } from "@/lib/types/meeting";
import type { SearchQuery, ResearchResults } from "./types";
import { createEmptyResearchResults } from "./types";
import { searchWeb, searchNews } from "./tavily-client";

export function buildSearchQueries(ctx: MeetingContext): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const year = new Date().getFullYear();

  if (ctx.companyName) {
    // Info entreprise + résultats financiers
    queries.push({
      query: `${ctx.companyName} entreprise chiffres clés résultats financiers stratégie ${year}`,
      category: "company",
    });

    // Actualités
    queries.push({
      query: `${ctx.companyName} actualités ${ctx.sector || ""} ${year}`,
      category: "news",
    });

    // Concurrents IT / prestataires
    queries.push({
      query: `${ctx.companyName} prestataires IT ESN partenaires technologiques`,
      category: "competitor",
    });

    // Écosystème & position marché
    queries.push({
      query: `${ctx.companyName} concurrents marché ${ctx.sector || ""} parts de marché position`,
      category: "company",
    });

    // Maturité digitale & projets IT
    queries.push({
      query: `${ctx.companyName} transformation digitale IT cloud data recrutement tech ${year}`,
      category: "company",
    });

    // Activité, effectif, clients, géographie
    queries.push({
      query: `${ctx.companyName} activité effectifs clients implantations filiales`,
      category: "company",
    });
  }

  // Profil interlocuteur
  if (ctx.contactName && ctx.companyName) {
    queries.push({
      query: `${ctx.contactName} ${ctx.contactRole || ""} ${ctx.companyName}`,
      category: "contact",
    });

    // Recherche LinkedIn ciblée
    queries.push({
      query: `${ctx.contactName} ${ctx.companyName} LinkedIn profil parcours`,
      category: "contact",
    });
  }

  // Enjeux sectoriels
  if (ctx.sector) {
    const offering = ctx.cgiOffering || "transformation digitale";
    queries.push({
      query: `enjeux ${ctx.sector} ${offering} France ${year}`,
      category: "sector",
    });
  }

  return queries;
}

export async function executeResearch(
  queries: SearchQuery[]
): Promise<ResearchResults> {
  const results = createEmptyResearchResults();

  // Lancer toutes les recherches en parallèle
  const promises = queries.map(async (q) => {
    try {
      const searchFn = q.category === "news" ? searchNews : searchWeb;
      const searchResults = await searchFn(q.query, 5);
      return { category: q.category, results: searchResults };
    } catch (error) {
      console.error(`Erreur recherche [${q.category}]: ${q.query}`, error);
      return { category: q.category, results: [] };
    }
  });

  const allResults = await Promise.all(promises);

  for (const { category, results: searchResults } of allResults) {
    results[category] = searchResults;
  }

  results.timestamp = new Date().toISOString();
  return results;
}

export async function executeResearchFromContext(
  ctx: MeetingContext
): Promise<ResearchResults> {
  const queries = buildSearchQueries(ctx);
  return executeResearch(queries);
}

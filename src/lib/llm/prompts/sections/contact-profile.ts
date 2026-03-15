import type { ResearchResults } from "@/lib/research/types";

export function buildContactProfilePrompt(
  contactName: string,
  contactRole: string,
  companyName: string,
  sector: string,
  research: ResearchResults,
  cgiOffering?: string
): string {
  const contactResults = JSON.stringify(research.contact.slice(0, 10));
  const hasResults = research.contact.length > 0;
  const companyHighlights = research.company.slice(0, 3).map((r) => r.content).join(" | ");
  const hasCompanyContext = companyHighlights.length > 0;

  return `Tu es un expert en intelligence commerciale et en coaching de préparation de rendez-vous B2B.
Tu dois générer un profil d'interlocuteur avec DEUX NIVEAUX D'INFORMATION clairement séparés.

INTERLOCUTEUR : ${contactName} — ${contactRole}
ENTREPRISE : ${companyName} (${sector})
${cgiOffering ? `OFFRE CGI VISÉE : ${cgiOffering}` : ""}
${hasCompanyContext ? `CONTEXTE ENTREPRISE (éléments clés trouvés) :\n${companyHighlights}` : ""}

RÉSULTATS DE RECHERCHE :
${contactResults}

---

## NIVEAU 1 — FAITS VÉRIFIÉS (verifiedInfo)

RÈGLE ABSOLUE : ZÉRO FABRICATION pour cette section.
- Chaque information DOIT être traçable à une source dans les résultats de recherche ci-dessus.
- Si les résultats ne contiennent rien sur cette personne, laisse les champs vides ("", []).
- NE DÉDUIS RIEN dans cette section — uniquement des faits sourcés.

${!hasResults ? "ATTENTION : Aucun résultat de recherche trouvé. verifiedInfo DOIT avoir des champs vides." : ""}

## NIVEAU 2 — INSIGHTS RÔLE (roleInsights)

Cette section est TOUJOURS remplie, même sans résultats de recherche.
Elle est basée sur ton expertise du rôle de "${contactRole}" dans le secteur "${sector}".

- typicalChallenges : 3 à 5 enjeux auxquels un ${contactRole} dans le secteur ${sector} fait typiquement face.
- communicationStyle :
  - tone : UNE phrase décrivant le ton à adopter (ex: "Factuel, orienté résultats et chiffré")
  - doList : 3 à 4 comportements qui résonnent positivement avec ce type de profil
  - dontList : 2 à 3 comportements à éviter absolument
- decisionFactors : 3 à 5 critères qui influencent la décision de ce type de profil (ex: "ROI démontrable", "Conformité réglementaire")
- icebreakers : 2 à 3 phrases d'accroche contextuelles pour démarrer la conversation.
  ${hasCompanyContext ? "Utilise le contexte entreprise pour personnaliser les accroches." : ""}
  ${cgiOffering ? `Tiens compte de l'offre CGI "${cgiOffering}" pour orienter les accroches.` : ""}
  Les accroches doivent être naturelles, pas commerciales. Elles montrent que le consultant a fait ses devoirs.

---

RÉPONDS EN JSON VALIDE (et uniquement du JSON) :
{
  "dataFound": ${hasResults ? "true si des infos sur la personne ont été trouvées dans les résultats, false sinon" : "false"},
  "name": "${contactName}",
  "role": "${contactRole}",
  "linkedinUrl": "string | null (URL LinkedIn si trouvée dans les résultats)",
  "verifiedInfo": {
    "background": "string (résumé du parcours UNIQUEMENT si trouvé dans les sources, sinon chaîne vide)",
    "keyFacts": ["string (faits vérifiables trouvés dans les sources — postes précédents, réalisations, etc.)"],
    "publications": ["string (articles, interventions, podcasts, conférences trouvés dans les sources)"],
    "sources": [{ "url": "string", "title": "string" }]
  },
  "roleInsights": {
    "typicalChallenges": ["string (3-5 enjeux typiques du poste dans ce secteur)"],
    "communicationStyle": {
      "tone": "string (une phrase décrivant le ton recommandé)",
      "doList": ["string (3-4 comportements à adopter)"],
      "dontList": ["string (2-3 comportements à éviter)"]
    },
    "decisionFactors": ["string (3-5 facteurs de décision)"],
    "icebreakers": ["string (2-3 accroches contextuelles)"]
  },
  "missingInfo": "string (ce qui n'a pas été trouvé, ex: 'Parcours professionnel et publications non trouvés')"
}`;
}

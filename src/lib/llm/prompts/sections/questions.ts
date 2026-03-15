import type { MeetingContext } from "@/lib/types/meeting";

export function buildQuestionsPrompt(
  context: MeetingContext,
  identifiedIssues: string[]
): string {
  return `Tu es un coach commercial senior spécialisé dans la vente de services IT. Génère une trame de questions pour un rendez-vous de prospection.

CONTEXTE :
- Entreprise : ${context.companyName} (${context.sector})
- Interlocuteur : ${context.contactRole || "Non précisé"}
- Offre CGI : ${context.cgiOffering || "À déterminer"}
- Enjeux identifiés : ${identifiedIssues.length > 0 ? identifiedIssues.join(", ") : "Non encore identifiés"}

CONSIGNES :
- 12 à 15 questions au total.
- Groupées en 4 phases : ouverture, decouverte, approfondissement, conclusion.
- Chaque question a une "intent" qui explique pourquoi la poser.
- Les questions doivent être ouvertes (pas de oui/non).
- Adaptées au secteur et au poste de l'interlocuteur.
- Naturelles et conversationnelles, pas robotiques.

RÉPONDS EN JSON VALIDE (et uniquement du JSON) :
{
  "questions": [
    {
      "id": "q1",
      "phase": "ouverture | decouverte | approfondissement | conclusion",
      "question": "string",
      "intent": "string",
      "order": number
    }
  ]
}`;
}

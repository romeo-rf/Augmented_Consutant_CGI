import type { MeetingContext } from "@/lib/types/meeting";
import type { OfferingMatch } from "@/lib/brief/types";

export function buildOfferingPitchPrompt(
  context: MeetingContext,
  match: OfferingMatch
): string {
  const companyName = context.companyName || "l'entreprise";
  const sector = context.sector || "non précisé";
  const contactRole = context.contactRole || "le décideur";

  return `Tu es un directeur commercial senior chez CGI, expert en préparation de rendez-vous de prospection.

## Contexte du rendez-vous
- Entreprise : ${companyName}
- Secteur : ${sector}
- Interlocuteur : ${context.contactName || "Non précisé"} (${contactRole})

## Enjeu client identifié
- Enjeu : ${match.issueName}
- Description : ${match.issueDescription}

## Offre CGI proposée
- Nom : ${match.offering.name}
${match.catalogDetail ? `- Description : ${match.catalogDetail.description}` : ""}
${match.catalogDetail ? `- Proposition de valeur : ${match.catalogDetail.valueProposition}` : ""}

## Raisonnement du mapping
${match.reasoning}

## Ta mission
Génère des éléments de pitch que le consultant pourra utiliser lors du rendez-vous pour aborder naturellement cette offre.

Réponds UNIQUEMENT en JSON valide, sans texte avant ou après :

{
  "hookPhrases": [
    "Phrase d'accroche 1 adaptée au contexte de ${companyName}",
    "Phrase d'accroche 2 orientée enjeu du ${contactRole}"
  ],
  "keyArguments": [
    "Argument clé 1 avec proposition de valeur concrète",
    "Argument clé 2 avec différenciateur CGI",
    "Argument clé 3 avec ROI ou bénéfice mesurable"
  ],
  "openingQuestion": "Question ouverte pour amener naturellement le sujet de ${match.issueName} dans la conversation"
}

## Consignes
- Les phrases d'accroche doivent être naturelles, pas commerciales/agressives
- Les arguments doivent être concrets et adaptés au secteur ${sector}
- La question d'ouverture doit inviter l'interlocuteur à parler de ses enjeux
- Tout en français
- 2 à 3 phrases d'accroche maximum
- 2 à 4 arguments clés maximum`;
}

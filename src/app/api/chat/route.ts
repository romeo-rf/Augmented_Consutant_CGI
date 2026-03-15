import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { getModel } from "@/lib/llm/provider";
import { buildSystemPrompt } from "@/lib/llm/prompts/system-briefing";
import {
  getOrCreateSession,
  updateMeetingContext,
  setResearchResults,
  appendResearchResults,
  markBriefGenerated,
} from "@/lib/session/store";
import { executeResearch } from "@/lib/research/search-orchestrator";
import { generateSection } from "@/lib/brief/section-generator";
import { createEmptyResearchResults } from "@/lib/research/types";

const meetingContextSchema = z.object({
  companyName: z
    .string()
    .nullable()
    .describe("Nom de l'entreprise cible. null si non mentionné."),
  sector: z
    .string()
    .nullable()
    .describe("Secteur d'activité (ex: télécommunications, banque, retail). null si non mentionné."),
  contactName: z
    .string()
    .nullable()
    .describe("Nom EXACT de l'interlocuteur (prénom et/ou nom). null si le consultant n'a pas donné de nom précis — ne JAMAIS inventer un nom ou mettre un placeholder."),
  contactRole: z
    .string()
    .nullable()
    .describe("Poste de l'interlocuteur (ex: DSI, RSSI, DG). null si non mentionné."),
  meetingType: z
    .string()
    .nullable()
    .describe("Type de rendez-vous (ex: prospection, suivi, avant-vente). null si non mentionné."),
  cgiOffering: z
    .string()
    .nullable()
    .describe("Offre ou domaine CGI concerné (ex: cybersécurité, cloud, data). null si non mentionné."),
  additionalContext: z
    .string()
    .nullable()
    .describe("Tout contexte supplémentaire mentionné. null si rien de particulier."),
});

const researchQueriesSchema = z.object({
  queries: z
    .array(
      z.object({
        query: z.string().describe("La requête de recherche web"),
        category: z
          .enum(["company", "contact", "sector", "competitor", "news"])
          .describe("Catégorie de la recherche"),
      })
    )
    .describe("Liste des recherches à effectuer"),
});

const briefSectionSchema = z.object({
  section: z
    .enum([
      "clientRadar",
      "contactProfile",
      "offeringsMapping",
      "questions",
      "alerts",
    ])
    .describe("La section du brief à générer ou mettre à jour"),
});

export async function POST(req: Request) {
  // En AI SDK v6, le body est { id, messages, trigger, messageId, ...extraBody }
  const body = await req.json();
  const messages: UIMessage[] = body.messages;
  const sessionId: string = body.sessionId || body.id || crypto.randomUUID();

  console.log(`[chat] sessionId=${sessionId}, messages=${messages.length}`);

  const session = getOrCreateSession(sessionId);
  const isRefining = session.briefGenerated;

  const result = streamText({
    model: getModel(),
    system: buildSystemPrompt(session.meetingContext, isRefining),
    messages: await convertToModelMessages(messages),
    tools: {
      extractMeetingContext: tool({
        description:
          "Extraire les informations du rendez-vous depuis le message du consultant. Appeler cet outil à chaque message pour mettre à jour le contexte.",
        inputSchema: meetingContextSchema,
        execute: async (params) => {
          console.log("[tool] extractMeetingContext:", JSON.stringify(params));
          const updated = updateMeetingContext(sessionId, params);
          return {
            updated: true,
            context: updated.meetingContext,
          };
        },
      }),
      triggerResearch: tool({
        description: isRefining
          ? "Lancer des recherches web ciblées pour approfondir un sujet spécifique demandé par le consultant. Les résultats seront ajoutés aux recherches existantes."
          : "Lancer des recherches web quand le contexte du rendez-vous est suffisant (au minimum : nom d'entreprise + secteur). Construis des requêtes pertinentes en français.",
        inputSchema: researchQueriesSchema,
        execute: async ({ queries }) => {
          console.log("[tool] triggerResearch:", queries.length, "queries");
          const results = await executeResearch(queries);

          if (isRefining) {
            appendResearchResults(sessionId, results);
          } else {
            setResearchResults(sessionId, results);
          }

          const summary = {
            company: results.company.length,
            contact: results.contact.length,
            sector: results.sector.length,
            competitor: results.competitor.length,
            news: results.news.length,
          };

          // Identifier les catégories sans résultats pour alerter le LLM
          const emptyCategories = Object.entries(summary)
            .filter(([, count]) => count === 0)
            .map(([cat]) => cat);

          const totalResults = Object.values(summary).reduce((a, b) => a + b, 0);

          console.log("[tool] triggerResearch results:", summary, "empty:", emptyCategories);

          return {
            success: totalResults > 0,
            summary,
            emptyCategories,
            warning: emptyCategories.length > 0
              ? `Attention : aucun résultat trouvé pour les catégories suivantes : ${emptyCategories.join(", ")}. Tu DOIS signaler ces lacunes au consultant et lui demander s'il peut fournir des informations complémentaires. Ne génère PAS de contenu inventé pour combler ces manques.`
              : undefined,
            results,
          };
        },
      }),
      generateBriefSection: tool({
        description: isRefining
          ? "Regénérer une section spécifique du brief avec les données mises à jour. Ne regénérer que les sections impactées par la demande du consultant."
          : "Générer une section du brief de préparation. Appeler après avoir reçu les résultats de recherche. Générer les 5 sections une par une : clientRadar, contactProfile, offeringsMapping, questions, alerts.",
        inputSchema: briefSectionSchema,
        execute: async ({ section }) => {
          console.log("[tool] generateBriefSection:", section);
          const currentSession = getOrCreateSession(sessionId);
          const research =
            currentSession.researchResults || createEmptyResearchResults();

          try {
            const result = await generateSection(
              section,
              currentSession.meetingContext,
              research
            );

            if (section === "alerts" && !isRefining) {
              markBriefGenerated(sessionId);
            }

            console.log("[tool] generateBriefSection done:", section);

            return {
              success: true,
              section: result.section,
              data: result.data,
            };
          } catch (error) {
            console.error(
              `[tool] Erreur génération section ${section}:`,
              error
            );
            return {
              success: false,
              section,
              error: `Erreur lors de la génération de la section ${section}`,
            };
          }
        },
      }),
    },
    stopWhen: stepCountIs(12),
  });

  return result.toUIMessageStreamResponse();
}

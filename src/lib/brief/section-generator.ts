import { generateText } from "ai";
import { getModel } from "@/lib/llm/provider";
import type { MeetingContext } from "@/lib/types/meeting";
import type { ResearchResults } from "@/lib/research/types";
import type {
  BriefSectionName,
  ClientRadar,
  ContactProfile,
  OfferingMatch,
  SmartQuestion,
  AlertItem,
} from "./types";
import { buildClientRadarPrompt } from "@/lib/llm/prompts/sections/client-radar";
import { buildContactProfilePrompt } from "@/lib/llm/prompts/sections/contact-profile";
import { buildOfferingsMappingPrompt } from "@/lib/llm/prompts/sections/offerings-mapping";
import { buildQuestionsPrompt } from "@/lib/llm/prompts/sections/questions";
import { buildAlertsPrompt } from "@/lib/llm/prompts/sections/alerts";
import { getAllOfferings, getOfferingById } from "@/lib/catalog/loader";
import { nanoid } from "nanoid";

type SectionResult =
  | { section: "clientRadar"; data: ClientRadar }
  | { section: "contactProfile"; data: ContactProfile }
  | { section: "offeringsMapping"; data: OfferingMatch[] }
  | { section: "questions"; data: SmartQuestion[] }
  | { section: "alerts"; data: AlertItem[] };

function buildPromptForSection(
  section: BriefSectionName,
  context: MeetingContext,
  research: ResearchResults,
  existingIssues: string[]
): string {
  switch (section) {
    case "clientRadar":
      return buildClientRadarPrompt(
        context.companyName || "",
        context.sector || "",
        research
      );
    case "contactProfile":
      return buildContactProfilePrompt(
        context.contactName || "Non précisé",
        context.contactRole || "Non précisé",
        context.companyName || "",
        context.sector || "",
        research,
        context.cgiOffering || undefined
      );
    case "offeringsMapping":
      return buildOfferingsMappingPrompt(context, research, getAllOfferings());
    case "questions":
      return buildQuestionsPrompt(context, existingIssues);
    case "alerts":
      return buildAlertsPrompt(context, research);
  }
}

function parseJsonResponse(text: string): unknown {
  // Extraire le JSON même si entouré de markdown ```json ... ```
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

export async function generateSection(
  section: BriefSectionName,
  context: MeetingContext,
  research: ResearchResults,
  existingIssues: string[] = []
): Promise<SectionResult> {
  const prompt = buildPromptForSection(section, context, research, existingIssues);

  const { text } = await generateText({
    model: getModel(),
    prompt,
  });

  const parsed = parseJsonResponse(text);

  switch (section) {
    case "clientRadar":
      return { section, data: parsed as ClientRadar };
    case "contactProfile":
      return { section, data: parsed as ContactProfile };
    case "offeringsMapping": {
      const result = parsed as { matches: OfferingMatch[] };
      const enriched = result.matches.map((m, i) => ({
        ...m,
        id: nanoid(),
        status: "pending" as const,
        order: i,
        catalogDetail: getOfferingById(m.offering.id),
      }));
      return { section, data: enriched };
    }
    case "questions": {
      const result = parsed as { questions: SmartQuestion[] };
      return { section, data: result.questions };
    }
    case "alerts": {
      const result = parsed as { alerts: AlertItem[] };
      return { section, data: result.alerts };
    }
  }
}

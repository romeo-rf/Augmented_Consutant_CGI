import { NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel } from "@/lib/llm/provider";
import { buildOfferingPitchPrompt } from "@/lib/llm/prompts/sections/offering-pitch";
import type { MeetingContext } from "@/lib/types/meeting";
import type { OfferingMatch, PitchElements } from "@/lib/brief/types";
import { z } from "zod";

const requestSchema = z.object({
  context: z.object({
    companyName: z.string().nullable(),
    sector: z.string().nullable(),
    contactName: z.string().nullable(),
    contactRole: z.string().nullable(),
  }),
  match: z.object({
    issueName: z.string(),
    issueDescription: z.string(),
    offering: z.object({
      id: z.string(),
      name: z.string(),
    }),
    reasoning: z.string(),
    catalogDetail: z
      .object({
        description: z.string(),
        valueProposition: z.string(),
      })
      .optional(),
  }),
});

function parseJsonResponse(text: string): unknown {
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const prompt = buildOfferingPitchPrompt(
      parsed.data.context as MeetingContext,
      parsed.data.match as OfferingMatch
    );

    const { text } = await generateText({
      model: getModel(),
      prompt,
    });

    const result = parseJsonResponse(text) as Omit<PitchElements, "generatedAt">;

    const pitch: PitchElements = {
      hookPhrases: result.hookPhrases || [],
      keyArguments: result.keyArguments || [],
      openingQuestion: result.openingQuestion || "",
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(pitch);
  } catch (error) {
    console.error("[generate-pitch] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du pitch" },
      { status: 500 }
    );
  }
}

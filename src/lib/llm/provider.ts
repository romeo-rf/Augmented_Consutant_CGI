import { google } from "@ai-sdk/google";
import { createOllama } from "ollama-ai-provider";
import { getLLMConfig } from "./config";
import type { LanguageModel } from "ai";

export function getModel(): LanguageModel {
  const config = getLLMConfig();

  if (config.provider === "ollama") {
    const ollama = createOllama({ baseURL: config.ollama.baseUrl + "/api" });
    // ollama-ai-provider peut retourner LanguageModelV1, cast nécessaire pour AI SDK v6
    return ollama(config.ollama.model) as unknown as LanguageModel;
  }

  return google(config.gemini.model);
}

export function getProviderName(): string {
  return getLLMConfig().provider === "ollama"
    ? "Ollama (local)"
    : "Gemini Flash";
}

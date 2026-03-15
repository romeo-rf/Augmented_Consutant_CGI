export type LLMProvider = "gemini" | "ollama";

export interface LLMConfig {
  provider: LLMProvider;
  gemini: {
    model: string;
  };
  ollama: {
    model: string;
    baseUrl: string;
  };
}

export function getLLMConfig(): LLMConfig {
  return {
    provider: (process.env.LLM_PROVIDER as LLMProvider) || "gemini",
    gemini: {
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    },
    ollama: {
      model: process.env.OLLAMA_MODEL || "mistral-nemo",
      baseUrl: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
    },
  };
}

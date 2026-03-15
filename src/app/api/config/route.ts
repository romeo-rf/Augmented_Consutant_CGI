import { getLLMConfig } from "@/lib/llm/config";

export async function GET() {
  const config = getLLMConfig();
  return Response.json({ provider: config.provider });
}

import { tavily } from "@tavily/core";
import type { SearchResult } from "./types";

function getClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY manquante dans les variables d'environnement");
  }
  return tavily({ apiKey });
}

export async function searchWeb(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  const client = getClient();

  const response = await client.search(query, {
    maxResults,
    searchDepth: "basic",
    topic: "general",
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
    publishedDate: result.publishedDate,
  }));
}

export async function searchNews(
  query: string,
  maxResults = 5
): Promise<SearchResult[]> {
  const client = getClient();

  const response = await client.search(query, {
    maxResults,
    searchDepth: "basic",
    topic: "news",
    timeRange: "month",
  });

  return response.results.map((result) => ({
    title: result.title,
    url: result.url,
    content: result.content,
    score: result.score,
    publishedDate: result.publishedDate,
  }));
}

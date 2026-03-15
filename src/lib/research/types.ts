export interface SearchQuery {
  query: string;
  category: "company" | "contact" | "sector" | "competitor" | "news";
}

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  publishedDate?: string;
}

export interface ResearchResults {
  company: SearchResult[];
  contact: SearchResult[];
  sector: SearchResult[];
  competitor: SearchResult[];
  news: SearchResult[];
  timestamp: string;
}

export function createEmptyResearchResults(): ResearchResults {
  return {
    company: [],
    contact: [],
    sector: [],
    competitor: [],
    news: [],
    timestamp: new Date().toISOString(),
  };
}

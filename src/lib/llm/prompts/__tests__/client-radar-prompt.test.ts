import { describe, it, expect } from "vitest";
import { buildClientRadarPrompt } from "../sections/client-radar";
import type { ResearchResults } from "@/lib/research/types";
import { createEmptyResearchResults } from "@/lib/research/types";

function createMockResearch(): ResearchResults {
  const results = createEmptyResearchResults();
  results.company = [
    { title: "Capgemini résultats", url: "https://capgemini.com/results", content: "CA 22Mds€", score: 0.9 },
  ];
  results.news = [
    { title: "Capgemini acquiert X", url: "https://news.com/1", content: "Acquisition", score: 0.8 },
  ];
  results.competitor = [
    { title: "Capgemini vs Accenture", url: "https://compare.com/1", content: "Comparaison", score: 0.7 },
  ];
  return results;
}

describe("buildClientRadarPrompt", () => {
  const prompt = buildClientRadarPrompt("Capgemini", "IT Services", createMockResearch());

  it("includes company name and sector", () => {
    expect(prompt).toContain("Capgemini");
    expect(prompt).toContain("IT Services");
  });

  it("includes research results", () => {
    expect(prompt).toContain("capgemini.com/results");
    expect(prompt).toContain("news.com/1");
    expect(prompt).toContain("compare.com/1");
  });

  it("requests financialTrend field", () => {
    expect(prompt).toContain("financialTrend");
    expect(prompt).toContain("growth");
    expect(prompt).toContain("stable");
    expect(prompt).toContain("decline");
    expect(prompt).toContain("unknown");
  });

  it("requests strategicIssues field", () => {
    expect(prompt).toContain("strategicIssues");
    expect(prompt).toContain("digital");
    expect(prompt).toContain("reglementaire");
    expect(prompt).toContain("croissance");
  });

  it("requests ecosystem field", () => {
    expect(prompt).toContain("ecosystem");
    expect(prompt).toContain("competitors");
    expect(prompt).toContain("knownPartners");
    expect(prompt).toContain("marketPosition");
  });

  it("requests digitalMaturity field", () => {
    expect(prompt).toContain("digitalMaturity");
    expect(prompt).toContain("avancee");
    expect(prompt).toContain("en_cours");
    expect(prompt).toContain("emergente");
    expect(prompt).toContain("inconnue");
  });

  it("requests elevatorPitch field", () => {
    expect(prompt).toContain("elevatorPitch");
  });

  it("requests keyNumbers field", () => {
    expect(prompt).toContain("keyNumbers");
    expect(prompt).toContain("max 3");
  });

  it("enforces zero fabrication rule", () => {
    expect(prompt).toContain("ZÉRO FABRICATION");
    expect(prompt).toContain("ne devine JAMAIS");
  });

  it("uses up to 10 company results", () => {
    const research = createMockResearch();
    // Add 12 company results
    for (let i = 0; i < 12; i++) {
      research.company.push({ title: `Result ${i}`, url: `https://example.com/${i}`, content: "Content", score: 0.5 });
    }
    const p = buildClientRadarPrompt("Test", "IT", research);
    // Should include at most 10 results (slice(0, 10))
    const parsed = JSON.parse(p.split("INFORMATIONS ENTREPRISE :\n")[1].split("\n\nRÉSULTATS DE RECHERCHE — ACTUALITÉS")[0]);
    expect(parsed.length).toBe(10);
  });
});

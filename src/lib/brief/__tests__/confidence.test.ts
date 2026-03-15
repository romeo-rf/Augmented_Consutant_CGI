import { describe, it, expect } from "vitest";
import { getClientRadarConfidence } from "../confidence";
import type { ClientRadar, Source } from "../types";

function createMockRadar(overrides: Partial<ClientRadar> = {}): ClientRadar {
  return {
    companyName: "TestCorp",
    sector: "IT",
    activity: null,
    size: "ETI",
    employeeCount: null,
    revenue: "100M€",
    headquarters: "Paris",
    geographicPresence: null,
    mainClients: [],
    recentNews: [],
    keyFacts: [],
    sources: [],
    financialTrend: { direction: "unknown", details: "", source: null },
    strategicIssues: [],
    ecosystem: { competitors: [], knownPartners: [], marketPosition: "Non déterminé", source: null },
    digitalMaturity: { level: "inconnue", signals: [], source: null },
    elevatorPitch: "",
    keyNumbers: [],
    ...overrides,
  };
}

describe("getClientRadarConfidence", () => {
  it("returns null for null data", () => {
    expect(getClientRadarConfidence(null)).toBeNull();
  });

  it("returns low for minimal radar", () => {
    const radar = createMockRadar();
    const result = getClientRadarConfidence(radar);
    expect(result).not.toBeNull();
    expect(result!.level).toBe("low");
  });

  it("returns medium for partial radar", () => {
    const source: Source = { url: "https://example.com", title: "Test" };
    const radar = createMockRadar({
      sources: [source, source],
      recentNews: [
        { headline: "Test", date: "2025-01-01", source },
      ],
      financialTrend: { direction: "growth", details: "+12%", source },
      digitalMaturity: { level: "en_cours", signals: ["Cloud"], source: null },
    });
    // 2 sources + 1 news + 2 (financial) + 1 (digital) = 6 → medium (>=5)
    const result = getClientRadarConfidence(radar);
    expect(result!.level).toBe("medium");
  });

  it("returns high for rich radar", () => {
    const source: Source = { url: "https://example.com", title: "Test" };
    const radar = createMockRadar({
      sources: [source, source, source, source],
      recentNews: [
        { headline: "News 1", date: "2025-01-01", source },
        { headline: "News 2", date: "2025-02-01", source },
      ],
      strategicIssues: [
        { category: "digital", title: "Cloud", description: "Migration", source },
        { category: "rh", title: "Recrutement", description: "Dev", source: null },
      ],
      financialTrend: { direction: "growth", details: "+12%", source },
      digitalMaturity: { level: "avancee", signals: ["AWS"], source: null },
      ecosystem: { competitors: ["Accenture"], knownPartners: [], marketPosition: "Leader", source: null },
      keyNumbers: ["100M€", "500 employés", "12 pays"],
    });
    // 4 sources + 2 news + 2 issues + 2 (financial) + 1 (digital) + 1 (competitors) + 1 (keyNumbers) = 13 → high (>=10)
    const result = getClientRadarConfidence(radar);
    expect(result!.level).toBe("high");
  });

  it("scores financial trend +2 when not unknown", () => {
    const source: Source = { url: "https://example.com", title: "Test" };
    const radarUnknown = createMockRadar({
      sources: [source, source, source],
    });
    const radarKnown = createMockRadar({
      sources: [source, source, source],
      financialTrend: { direction: "stable", details: "Stable", source: null },
    });
    const scoreUnknown = getClientRadarConfidence(radarUnknown)!.sourceCount;
    const scoreKnown = getClientRadarConfidence(radarKnown)!.sourceCount;
    expect(scoreKnown).toBe(scoreUnknown + 2);
  });
});

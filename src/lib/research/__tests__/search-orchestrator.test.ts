import { describe, it, expect } from "vitest";
import { buildSearchQueries } from "../search-orchestrator";
import type { MeetingContext } from "@/lib/types/meeting";

function createContext(overrides: Partial<MeetingContext> = {}): MeetingContext {
  return {
    companyName: "Capgemini",
    sector: "IT Services",
    contactName: "Jean Dupont",
    contactRole: "DSI",
    meetingType: "prospection",
    cgiOffering: null,
    additionalContext: null,
    ...overrides,
  };
}

describe("buildSearchQueries", () => {
  it("generates 7+ queries for a full context", () => {
    const queries = buildSearchQueries(createContext());
    // company + ecosystem + digital + news + competitor + contact + linkedin contact + sector = 8
    expect(queries.length).toBeGreaterThanOrEqual(7);
  });

  it("includes an ecosystem query", () => {
    const queries = buildSearchQueries(createContext());
    const hasEcosystem = queries.some(
      (q) => q.query.includes("concurrents") && q.query.includes("marché")
    );
    expect(hasEcosystem).toBe(true);
  });

  it("includes a digital transformation query", () => {
    const queries = buildSearchQueries(createContext());
    const hasDigital = queries.some(
      (q) => q.query.includes("transformation digitale") || q.query.includes("cloud")
    );
    expect(hasDigital).toBe(true);
  });

  it("generates company queries when company is provided", () => {
    const queries = buildSearchQueries(createContext());
    const companyQueries = queries.filter((q) => q.category === "company");
    expect(companyQueries.length).toBeGreaterThanOrEqual(3);
  });

  it("generates no company queries when company is missing", () => {
    const queries = buildSearchQueries(createContext({ companyName: null }));
    const companyQueries = queries.filter((q) => q.category === "company");
    expect(companyQueries.length).toBe(0);
  });

  it("includes sector in ecosystem query", () => {
    const queries = buildSearchQueries(createContext({ sector: "Banque" }));
    const ecosystemQuery = queries.find(
      (q) => q.query.includes("concurrents") && q.query.includes("marché")
    );
    expect(ecosystemQuery?.query).toContain("Banque");
  });
});

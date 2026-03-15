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
  it("generates 8+ queries for a full context", () => {
    const queries = buildSearchQueries(createContext());
    // company(fin) + news + competitor + ecosystem + digital + activity + contact + linkedin + sector = 9
    expect(queries.length).toBeGreaterThanOrEqual(8);
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

  it("includes an activity/clients query", () => {
    const queries = buildSearchQueries(createContext());
    const hasActivity = queries.some(
      (q) => q.query.includes("activité") && q.query.includes("clients")
    );
    expect(hasActivity).toBe(true);
  });

  it("generates company queries when company is provided", () => {
    const queries = buildSearchQueries(createContext());
    const companyQueries = queries.filter((q) => q.category === "company");
    expect(companyQueries.length).toBeGreaterThanOrEqual(4);
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

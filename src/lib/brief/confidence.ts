import type { ClientRadar, ContactProfile, OfferingMatch, SmartQuestion, AlertItem } from "./types";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ConfidenceScore {
  level: ConfidenceLevel;
  label: string;
  sourceCount: number;
}

export function getClientRadarConfidence(data: ClientRadar | null): ConfidenceScore | null {
  if (!data) return null;
  let score = 0;
  score += data.sources.length;
  score += data.recentNews.length;
  score += data.strategicIssues.length;
  if (data.financialTrend.direction !== "unknown") score += 2;
  if (data.digitalMaturity.level !== "inconnue") score += 1;
  if (data.ecosystem.competitors.length > 0) score += 1;
  if (data.keyNumbers.length >= 3) score += 1;
  return buildScore(score, [10, 5]);
}

export function getContactProfileConfidence(data: ContactProfile | null): ConfidenceScore | null {
  if (!data) return null;
  let score = 0;
  score += data.verifiedInfo.sources.length;
  if (data.verifiedInfo.background) score += 2;
  score += data.verifiedInfo.publications.length;
  if (data.roleInsights.typicalChallenges.length >= 3) score += 1;
  if (data.roleInsights.icebreakers.length >= 2) score += 1;
  return buildScore(score, [5, 2]);
}

export function getOfferingsConfidence(data: OfferingMatch[]): ConfidenceScore | null {
  if (data.length === 0) return null;
  const avgScore = data.reduce((sum, m) => sum + m.relevanceScore, 0) / data.length;
  if (avgScore >= 70) return { level: "high", label: "Confiance haute", sourceCount: data.length };
  if (avgScore >= 50) return { level: "medium", label: "Confiance moyenne", sourceCount: data.length };
  return { level: "low", label: "Confiance basse", sourceCount: data.length };
}

export function getQuestionsConfidence(data: SmartQuestion[]): ConfidenceScore | null {
  if (data.length === 0) return null;
  const phases = new Set(data.map((q) => q.phase));
  if (phases.size >= 4 && data.length >= 8) return { level: "high", label: "Confiance haute", sourceCount: data.length };
  if (phases.size >= 3) return { level: "medium", label: "Confiance moyenne", sourceCount: data.length };
  return { level: "low", label: "Confiance basse", sourceCount: data.length };
}

export function getAlertsConfidence(data: AlertItem[]): ConfidenceScore | null {
  if (data.length === 0) return null;
  const withSource = data.filter((a) => a.source !== null).length;
  return buildScore(withSource, [3, 1]);
}

function buildScore(count: number, thresholds: [number, number]): ConfidenceScore {
  if (count >= thresholds[0]) return { level: "high", label: "Confiance haute", sourceCount: count };
  if (count >= thresholds[1]) return { level: "medium", label: "Confiance moyenne", sourceCount: count };
  return { level: "low", label: "Confiance basse", sourceCount: count };
}

export const confidenceColors: Record<ConfidenceLevel, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-red-100 text-red-700",
};

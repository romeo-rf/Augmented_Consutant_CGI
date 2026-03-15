import {
  type MeetingContext,
  createEmptyContext,
} from "@/lib/types/meeting";
import type { ResearchResults } from "@/lib/research/types";

export interface SessionState {
  id: string;
  meetingContext: MeetingContext;
  researchResults: ResearchResults | null;
  briefGenerated: boolean;
  createdAt: string;
  updatedAt: string;
}

// Store en mémoire — suffisant pour un POC
const sessions = new Map<string, SessionState>();

export function getOrCreateSession(sessionId: string): SessionState {
  const existing = sessions.get(sessionId);
  if (existing) return existing;

  const session: SessionState = {
    id: sessionId,
    meetingContext: createEmptyContext(),
    researchResults: null,
    briefGenerated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sessions.set(sessionId, session);
  return session;
}

/** Détecte les fausses valeurs (placeholders) renvoyées par le LLM */
function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v.startsWith("[") && v.endsWith("]")) return true;
  if (v.startsWith("{") && v.endsWith("}")) return true;
  const placeholders = [
    "non précisé", "non precisé", "non precis", "non renseigné",
    "inconnu", "unknown", "n/a", "na", "null", "undefined", "?",
    "à déterminer", "a determiner", "non fourni", "non spécifié",
  ];
  return placeholders.includes(v);
}

export function updateMeetingContext(
  sessionId: string,
  updates: Partial<MeetingContext>
): SessionState {
  const session = getOrCreateSession(sessionId);

  const ctx = session.meetingContext;
  for (const key of Object.keys(updates) as (keyof MeetingContext)[]) {
    const value = updates[key];
    if (value !== null && value !== undefined && !isPlaceholder(value)) {
      ctx[key] = value;
    }
  }

  session.updatedAt = new Date().toISOString();
  return session;
}

export function setResearchResults(
  sessionId: string,
  results: ResearchResults
): SessionState {
  const session = getOrCreateSession(sessionId);
  session.researchResults = results;
  session.updatedAt = new Date().toISOString();
  return session;
}

export function markBriefGenerated(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.briefGenerated = true;
    session.updatedAt = new Date().toISOString();
  }
}

export function appendResearchResults(
  sessionId: string,
  newResults: ResearchResults
): SessionState {
  const session = getOrCreateSession(sessionId);
  if (!session.researchResults) {
    session.researchResults = newResults;
  } else {
    // Fusionner les nouveaux résultats avec les existants
    for (const key of Object.keys(newResults) as (keyof ResearchResults)[]) {
      if (key === "timestamp") continue;
      const existing = session.researchResults[key] as unknown[];
      const incoming = newResults[key] as unknown[];
      (session.researchResults[key] as unknown[]) = [...existing, ...incoming];
    }
    session.researchResults.timestamp = newResults.timestamp;
  }
  session.updatedAt = new Date().toISOString();
  return session;
}

export function getSession(sessionId: string): SessionState | undefined {
  return sessions.get(sessionId);
}

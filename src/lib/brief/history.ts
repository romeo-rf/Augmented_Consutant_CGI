import type {
  ClientRadar,
  ContactProfile,
  OfferingMatch,
  SmartQuestion,
  AlertItem,
} from "./types";
import type { MeetingContext } from "@/lib/types/meeting";

export interface BriefSnapshot {
  id: string;
  savedAt: string;
  meetingContext: MeetingContext;
  generationDuration: number | null;
  clientRadar: ClientRadar | null;
  contactProfile: ContactProfile | null;
  offeringsMapping: OfferingMatch[];
  questions: SmartQuestion[];
  alerts: AlertItem[];
}

const STORAGE_KEY = "cgi-brief-history";
const MAX_HISTORY = 10;

export function saveBriefToHistory(snapshot: Omit<BriefSnapshot, "id" | "savedAt">): void {
  try {
    const history = getBriefHistory();
    const entry: BriefSnapshot = {
      ...snapshot,
      id: crypto.randomUUID(),
      savedAt: new Date().toISOString(),
    };
    history.unshift(entry);
    if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // localStorage plein ou indisponible — silencieux
  }
}

export function getBriefHistory(): BriefSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BriefSnapshot[];
  } catch {
    return [];
  }
}

export function deleteBriefFromHistory(id: string): void {
  try {
    const history = getBriefHistory().filter((b) => b.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // silencieux
  }
}

export function clearBriefHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silencieux
  }
}

import { create } from "zustand";
import type {
  BriefState,
  BriefStatus,
  ClientRadar,
  ContactProfile,
  OfferingMatch,
  OfferingStatus,
  PitchElements,
  SmartQuestion,
  AlertItem,
} from "@/lib/brief/types";
import { createEmptyBriefState } from "@/lib/brief/types";
import type { MeetingContext } from "@/lib/types/meeting";
import { createEmptyContext } from "@/lib/types/meeting";

interface BriefStore extends BriefState {
  meetingContext: MeetingContext;
  generationStartedAt: number | null;
  generationDuration: number | null;
  radarBookmarks: Set<string>;
  setMeetingContext: (data: MeetingContext) => void;
  setStatus: (status: BriefStatus) => void;
  setClientRadar: (data: ClientRadar) => void;
  setContactProfile: (data: ContactProfile) => void;
  setOfferingsMapping: (data: OfferingMatch[]) => void;
  setQuestions: (data: SmartQuestion[]) => void;
  setAlerts: (data: AlertItem[]) => void;
  updateOfferingStatus: (matchId: string, status: OfferingStatus) => void;
  updateOfferingsOrder: (offerings: OfferingMatch[]) => void;
  addOffering: (match: OfferingMatch) => void;
  removeOffering: (matchId: string) => void;
  updateOfferingPitch: (matchId: string, pitch: PitchElements) => void;
  updateQuestionOrder: (questions: SmartQuestion[]) => void;
  deleteQuestion: (id: string) => void;
  addQuestion: (question: SmartQuestion) => void;
  toggleQuestionPriority: (id: string) => void;
  toggleRadarBookmark: (id: string) => void;
  clearRadarBookmarks: () => void;
  reset: () => void;
}

export const useBriefStore = create<BriefStore>((set, get) => ({
  ...createEmptyBriefState(),
  meetingContext: createEmptyContext(),
  generationStartedAt: null,
  generationDuration: null,
  radarBookmarks: new Set<string>(),

  setMeetingContext: (data) => set({ meetingContext: data }),

  setStatus: (status) => {
    const state = get();
    const updates: Partial<BriefStore> = {
      status,
      lastUpdated: new Date().toISOString(),
    };
    if (status === "researching" && !state.generationStartedAt) {
      updates.generationStartedAt = Date.now();
    }
    if (status === "ready" && state.generationStartedAt && !state.generationDuration) {
      updates.generationDuration = (Date.now() - state.generationStartedAt) / 1000;
    }
    set(updates);
  },

  setClientRadar: (data) =>
    set({ clientRadar: data, lastUpdated: new Date().toISOString() }),

  setContactProfile: (data) =>
    set({ contactProfile: data, lastUpdated: new Date().toISOString() }),

  setOfferingsMapping: (data) =>
    set({ offeringsMapping: data, lastUpdated: new Date().toISOString() }),

  setQuestions: (data) =>
    set({ questions: data, lastUpdated: new Date().toISOString() }),

  setAlerts: (data) =>
    set({ alerts: data, lastUpdated: new Date().toISOString() }),

  updateOfferingStatus: (matchId, status) =>
    set((state) => ({
      offeringsMapping: state.offeringsMapping.map((m) =>
        m.id === matchId ? { ...m, status } : m
      ),
      lastUpdated: new Date().toISOString(),
    })),

  updateOfferingsOrder: (offerings) =>
    set({ offeringsMapping: offerings, lastUpdated: new Date().toISOString() }),

  addOffering: (match) =>
    set((state) => ({
      offeringsMapping: [...state.offeringsMapping, match],
      lastUpdated: new Date().toISOString(),
    })),

  removeOffering: (matchId) =>
    set((state) => ({
      offeringsMapping: state.offeringsMapping.filter(
        (m) => m.id !== matchId
      ),
      lastUpdated: new Date().toISOString(),
    })),

  updateOfferingPitch: (matchId, pitch) =>
    set((state) => ({
      offeringsMapping: state.offeringsMapping.map((m) =>
        m.id === matchId ? { ...m, pitchElements: pitch } : m
      ),
      lastUpdated: new Date().toISOString(),
    })),

  updateQuestionOrder: (questions) =>
    set({ questions, lastUpdated: new Date().toISOString() }),

  deleteQuestion: (id) =>
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
      lastUpdated: new Date().toISOString(),
    })),

  addQuestion: (question) =>
    set((state) => ({
      questions: [...state.questions, question],
      lastUpdated: new Date().toISOString(),
    })),

  toggleQuestionPriority: (id) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, priority: !q.priority } : q
      ),
      lastUpdated: new Date().toISOString(),
    })),

  toggleRadarBookmark: (id) =>
    set((state) => {
      const next = new Set(state.radarBookmarks);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { radarBookmarks: next };
    }),

  clearRadarBookmarks: () => set({ radarBookmarks: new Set<string>() }),

  reset: () =>
    set({
      ...createEmptyBriefState(),
      meetingContext: createEmptyContext(),
      generationStartedAt: null,
      generationDuration: null,
      radarBookmarks: new Set<string>(),
    }),
}));

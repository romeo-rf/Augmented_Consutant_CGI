import type { CgiOffering } from "@/lib/catalog/loader";

export interface Source {
  url: string;
  title: string;
  snippet?: string;
}

// F3a — Radar Client

export type FinancialDirection = "growth" | "stable" | "decline" | "unknown";

export type IssueCategory =
  | "digital"
  | "rh"
  | "reglementaire"
  | "croissance"
  | "restructuration"
  | "innovation"
  | "autre";

export type DigitalMaturityLevel =
  | "avancee"
  | "en_cours"
  | "emergente"
  | "inconnue";

export interface ClientRadar {
  companyName: string;
  sector: string;
  activity: string | null;              // Description détaillée de l'activité (1-2 phrases)
  size: string | null;                  // Catégorie : PME / ETI / Grand Groupe
  employeeCount: string | null;         // Effectif précis (ex: "3 200 collaborateurs")
  revenue: string | null;
  headquarters: string | null;
  geographicPresence: string | null;    // Empreinte géo (ex: "12 pays, 45 sites en France")
  mainClients: string[];                // Clients principaux ou marchés cibles
  recentNews: Array<{
    headline: string;
    date: string;
    source: Source;
    businessSignal?: string;
  }>;
  keyFacts: string[];
  sources: Source[];

  financialTrend: {
    direction: FinancialDirection;
    details: string;
    source: Source | null;
  };
  strategicIssues: Array<{
    category: IssueCategory;
    title: string;
    description: string;
    source: Source | null;
  }>;
  ecosystem: {
    competitors: string[];
    knownPartners: string[];
    marketPosition: string;
    source: Source | null;
  };
  digitalMaturity: {
    level: DigitalMaturityLevel;
    signals: string[];
    source: Source | null;
  };
  elevatorPitch: string;
  keyNumbers: string[];
}

// F3b — Profil Interlocuteur
export interface ContactProfile {
  dataFound: boolean;
  name: string;
  role: string;
  linkedinUrl: string | null;

  verifiedInfo: {
    background: string;
    keyFacts: string[];
    publications: string[];
    sources: Source[];
  };

  roleInsights: {
    typicalChallenges: string[];
    communicationStyle: {
      tone: string;
      doList: string[];
      dontList: string[];
    };
    decisionFactors: string[];
    icebreakers: string[];
  };

  missingInfo: string;
}

// F3c — Mapping Enjeux → Offres
export type OfferingStatus = "pending" | "accepted" | "rejected";

export interface PitchElements {
  hookPhrases: string[];
  keyArguments: string[];
  openingQuestion: string;
  generatedAt: string;
}

export interface OfferingMatch {
  id: string; // Identifiant unique du match (pas de l'offre catalogue)
  issueName: string;
  issueDescription: string;
  offering: Pick<CgiOffering, "id" | "name">;
  reasoning: string;
  relevanceScore: number;
  status: OfferingStatus;
  order: number;
  isManual?: boolean;
  catalogDetail?: CgiOffering;
  pitchElements?: PitchElements;
}

// F3d — Questions
export interface SmartQuestion {
  id: string;
  phase: "ouverture" | "decouverte" | "approfondissement" | "conclusion";
  question: string;
  intent: string;
  order: number;
  priority?: boolean;
  isCustom?: boolean;
}

// F3e — Alertes
export interface AlertItem {
  type: "sensible" | "concurrent" | "objection" | "opportunite";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  source: Source | null;
}

// État global du brief
export type BriefSectionName =
  | "clientRadar"
  | "contactProfile"
  | "offeringsMapping"
  | "questions"
  | "alerts";

export type BriefStatus =
  | "idle"
  | "gathering"
  | "researching"
  | "generating"
  | "ready"
  | "refining";

export interface BriefState {
  status: BriefStatus;
  clientRadar: ClientRadar | null;
  contactProfile: ContactProfile | null;
  offeringsMapping: OfferingMatch[];
  questions: SmartQuestion[];
  alerts: AlertItem[];
  lastUpdated: string | null;
}

export function createEmptyBriefState(): BriefState {
  return {
    status: "idle",
    clientRadar: null,
    contactProfile: null,
    offeringsMapping: [],
    questions: [],
    alerts: [],
    lastUpdated: null,
  };
}

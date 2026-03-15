export interface MeetingContext {
  companyName: string | null;
  sector: string | null;
  contactName: string | null;
  contactRole: string | null;
  meetingType: string | null;
  cgiOffering: string | null;
  additionalContext: string | null;
}

export type MeetingField = keyof MeetingContext;

const REQUIRED_FIELDS: MeetingField[] = ["companyName", "sector"];

const FIELD_LABELS: Record<MeetingField, string> = {
  companyName: "Nom de l'entreprise",
  sector: "Secteur d'activité",
  contactName: "Nom de l'interlocuteur",
  contactRole: "Poste de l'interlocuteur",
  meetingType: "Type de rendez-vous",
  cgiOffering: "Offre CGI visée",
  additionalContext: "Contexte additionnel",
};

export function createEmptyContext(): MeetingContext {
  return {
    companyName: null,
    sector: null,
    contactName: null,
    contactRole: null,
    meetingType: null,
    cgiOffering: null,
    additionalContext: null,
  };
}

export function getMissingFields(ctx: MeetingContext): string[] {
  return REQUIRED_FIELDS.filter((field) => !ctx[field]).map(
    (field) => FIELD_LABELS[field]
  );
}

export function getCompleteness(ctx: MeetingContext): number {
  const allFields: MeetingField[] = Object.keys(ctx) as MeetingField[];
  const filled = allFields.filter((f) => ctx[f] !== null).length;
  return Math.round((filled / allFields.length) * 100);
}

export function isReadyForResearch(ctx: MeetingContext): boolean {
  return ctx.companyName !== null && ctx.sector !== null;
}

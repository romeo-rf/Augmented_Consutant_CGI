"use client";

import type { MeetingContext } from "@/lib/types/meeting";
import { CheckCircle2, Circle } from "lucide-react";

interface ContextProgressProps {
  context: MeetingContext;
}

const fields: Array<{
  key: keyof MeetingContext;
  label: string;
  required: boolean;
}> = [
  { key: "companyName", label: "Entreprise", required: true },
  { key: "sector", label: "Secteur", required: true },
  { key: "contactName", label: "Interlocuteur", required: false },
  { key: "contactRole", label: "Poste", required: false },
  { key: "meetingType", label: "Type de RDV", required: false },
  { key: "cgiOffering", label: "Offre CGI", required: false },
];

export function ContextProgress({ context }: ContextProgressProps) {
  const filled = fields.filter((f) => context[f.key] !== null).length;
  const total = fields.length;
  const percent = Math.round((filled / total) * 100);

  return (
    <div className="space-y-4">
      {/* Barre de progression */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">Collecte du contexte</span>
          <span className="text-xs text-muted-foreground">{percent}%</span>
        </div>
        <div className="h-2 bg-cgi-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-cgi-red rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Checklist des champs */}
      <ul className="space-y-1.5">
        {fields.map((field) => {
          const isFilled = context[field.key] !== null;
          return (
            <li key={field.key} className="flex items-center gap-2 text-sm">
              {isFilled ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-cgi-gray-300 shrink-0" />
              )}
              <span
                className={
                  isFilled ? "text-cgi-gray-700" : "text-cgi-gray-400"
                }
              >
                {field.label}
                {field.required && !isFilled && (
                  <span className="text-cgi-red ml-1">*</span>
                )}
              </span>
              {isFilled && (
                <span className="text-xs text-cgi-gray-400 truncate max-w-[180px] ml-auto">
                  {context[field.key]}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[11px] text-cgi-gray-400">
        <span className="text-cgi-red">*</span> Champs obligatoires pour
        lancer la recherche
      </p>
    </div>
  );
}

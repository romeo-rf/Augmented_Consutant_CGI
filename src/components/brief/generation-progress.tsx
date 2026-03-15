"use client";

import type { BriefStatus } from "@/lib/brief/types";
import { CheckCircle2, Circle, Loader2, Search, Sparkles } from "lucide-react";

interface GenerationProgressProps {
  status: BriefStatus;
  sectionsDone: number;
  hasClientRadar: boolean;
  hasContactProfile: boolean;
  hasOfferings: boolean;
  hasQuestions: boolean;
  hasAlerts: boolean;
}

const sections = [
  { key: "clientRadar" as const, label: "Radar client" },
  { key: "contactProfile" as const, label: "Profil interlocuteur" },
  { key: "offerings" as const, label: "Mapping offres CGI" },
  { key: "questions" as const, label: "Trame de questions" },
  { key: "alerts" as const, label: "Alertes & points d'attention" },
];

export function GenerationProgress({
  status,
  sectionsDone,
  hasClientRadar,
  hasContactProfile,
  hasOfferings,
  hasQuestions,
  hasAlerts,
}: GenerationProgressProps) {
  const doneMap: Record<string, boolean> = {
    clientRadar: hasClientRadar,
    contactProfile: hasContactProfile,
    offerings: hasOfferings,
    questions: hasQuestions,
    alerts: hasAlerts,
  };

  const isResearching = status === "researching";
  const totalSteps = sections.length + 1; // +1 pour la recherche
  const researchDone = !isResearching && sectionsDone > 0;
  const currentStep = researchDone ? 1 + sectionsDone : isResearching ? 0 : sectionsDone;
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="rounded-lg border bg-white p-4 space-y-3">
      {/* Titre + pourcentage */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isResearching ? (
            <Search className="h-4 w-4 text-purple-600 animate-pulse" />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-600" />
          )}
          <span className="text-sm font-medium">
            {isResearching
              ? "Recherche web en cours..."
              : status === "refining"
                ? "Affinage du brief..."
                : "Generation du brief..."}
          </span>
        </div>
        <span className="text-xs text-muted-foreground font-mono">{percent}%</span>
      </div>

      {/* Barre de progression */}
      <div className="h-2 bg-cgi-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-cgi-red to-cgi-red/70"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Checklist des etapes */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {/* Etape recherche */}
        <StepItem
          label="Recherche web"
          done={researchDone}
          active={isResearching}
        />

        {/* Etapes sections */}
        {sections.map((s) => {
          const done = doneMap[s.key];
          // Active = la section juste après la dernière complétée
          const active =
            !done && !isResearching && sectionsDone > 0;
          return (
            <StepItem
              key={s.key}
              label={s.label}
              done={done}
              active={active && !Object.values(doneMap).some((v, i) => !v && i < sections.findIndex((x) => x.key === s.key) && !Object.values(doneMap)[i])}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepItem({
  label,
  done,
  active,
}: {
  label: string;
  done: boolean;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
      ) : active ? (
        <Loader2 className="h-3.5 w-3.5 text-cgi-red animate-spin shrink-0" />
      ) : (
        <Circle className="h-3.5 w-3.5 text-cgi-gray-300 shrink-0" />
      )}
      <span
        className={`text-xs ${
          done
            ? "text-cgi-gray-600"
            : active
              ? "text-cgi-gray-700 font-medium"
              : "text-cgi-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

"use client";

import type { BriefStatus } from "@/lib/brief/types";
import { useBriefStore } from "@/store/brief-store";
import { generateBriefHTML } from "@/lib/brief/export-brief";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, Download, Clock } from "lucide-react";

interface BriefHeaderProps {
  status: BriefStatus;
  lastUpdated: string | null;
}

const statusConfig: Record<
  BriefStatus,
  { label: string; color: string; loading: boolean }
> = {
  idle: { label: "En attente", color: "bg-gray-100 text-gray-600", loading: false },
  gathering: { label: "Collecte en cours", color: "bg-blue-100 text-blue-800", loading: true },
  researching: { label: "Recherche en cours", color: "bg-purple-100 text-purple-800", loading: true },
  generating: { label: "Génération du brief", color: "bg-amber-100 text-amber-800", loading: true },
  ready: { label: "Brief prêt", color: "bg-green-100 text-green-800", loading: false },
  refining: { label: "Affinage en cours", color: "bg-indigo-100 text-indigo-800", loading: true },
};

export function BriefHeader({ status, lastUpdated }: BriefHeaderProps) {
  const config = statusConfig[status];
  const store = useBriefStore();
  const isReady = status === "ready";

  function handleExportPDF() {
    const html = generateBriefHTML({
      meetingContext: store.meetingContext,
      clientRadar: store.clientRadar,
      contactProfile: store.contactProfile,
      offeringsMapping: store.offeringsMapping,
      questions: store.questions,
      alerts: store.alerts,
      generationTime: store.generationDuration ?? undefined,
      radarBookmarks: store.radarBookmarks,
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 300);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-cgi-red" />
        <h2 className="font-semibold">Brief de préparation</h2>
      </div>
      <div className="flex items-center gap-2">
        {/* Métrique temps économisé */}
        {isReady && store.generationDuration && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            <span>{Math.round(store.generationDuration)}s</span>
          </div>
        )}

        {/* Bouton Export PDF */}
        {isReady && (
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-1 text-xs font-medium text-cgi-red hover:bg-cgi-red/10 px-2 py-1.5 rounded-md transition-colors"
            title="Exporter en PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        )}

        <Badge className={config.color}>
          {config.loading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          {config.label}
        </Badge>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            {new Date(lastUpdated).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

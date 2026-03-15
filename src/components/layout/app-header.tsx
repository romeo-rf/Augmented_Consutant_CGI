"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, History, Trash2 } from "lucide-react";
import { getBriefHistory, deleteBriefFromHistory, type BriefSnapshot } from "@/lib/brief/history";
import { useBriefStore } from "@/store/brief-store";

interface AppHeaderProps {
  provider: string;
  activePanel: "chat" | "brief";
  onTogglePanel: (panel: "chat" | "brief") => void;
}

export function AppHeader({ provider, activePanel, onTogglePanel }: AppHeaderProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<BriefSnapshot[]>([]);

  function handleToggleHistory() {
    if (!showHistory) {
      setHistory(getBriefHistory());
    }
    setShowHistory(!showHistory);
  }

  function handleLoadBrief(snapshot: BriefSnapshot) {
    const store = useBriefStore.getState();
    store.setMeetingContext(snapshot.meetingContext);
    if (snapshot.clientRadar) store.setClientRadar(snapshot.clientRadar);
    if (snapshot.contactProfile) store.setContactProfile(snapshot.contactProfile);
    if (snapshot.offeringsMapping.length > 0) store.setOfferingsMapping(snapshot.offeringsMapping);
    if (snapshot.questions.length > 0) store.setQuestions(snapshot.questions);
    if (snapshot.alerts.length > 0) store.setAlerts(snapshot.alerts);
    store.setStatus("ready");
    setShowHistory(false);
    onTogglePanel("brief");
  }

  function handleDeleteBrief(id: string) {
    deleteBriefFromHistory(id);
    setHistory(getBriefHistory());
  }

  return (
    <header className="relative flex items-center justify-between border-b border-cgi-gray-200 bg-white px-4 sm:px-6 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-cgi-red text-xs font-bold text-white">
          CGI
        </div>
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-cgi-gray-800 leading-tight">
            Consultant Augmenté
          </h1>
          <p className="text-[10px] text-cgi-gray-400 hidden sm:block">
            Phase Préparation
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton historique */}
        <button
          onClick={handleToggleHistory}
          className="flex items-center gap-1 text-xs text-cgi-gray-500 hover:text-cgi-gray-700 px-2 py-1.5 rounded-md hover:bg-cgi-gray-100 transition-colors"
          title="Historique des briefs"
        >
          <History className="h-4 w-4" />
          <span className="hidden sm:inline">Historique</span>
        </button>

        {/* Toggle mobile chat/brief */}
        <div className="flex lg:hidden border rounded-lg overflow-hidden">
          <Button
            variant={activePanel === "chat" ? "default" : "ghost"}
            size="sm"
            className={
              activePanel === "chat"
                ? "bg-cgi-red hover:bg-cgi-red-dark rounded-none"
                : "rounded-none"
            }
            onClick={() => onTogglePanel("chat")}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button
            variant={activePanel === "brief" ? "default" : "ghost"}
            size="sm"
            className={
              activePanel === "brief"
                ? "bg-cgi-red hover:bg-cgi-red-dark rounded-none"
                : "rounded-none"
            }
            onClick={() => onTogglePanel("brief")}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono">
          {provider === "ollama" ? "Ollama" : "Gemini"}
        </Badge>
      </div>

      {/* Dropdown historique */}
      {showHistory && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setShowHistory(false)} />
          <div className="absolute right-4 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border bg-white shadow-lg">
            <div className="p-3 border-b">
              <h3 className="text-sm font-semibold">Briefs récents</h3>
            </div>
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun brief sauvegardé
              </div>
            ) : (
              <div className="divide-y">
                {history.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className="flex items-center justify-between p-3 hover:bg-cgi-gray-50 transition-colors"
                  >
                    <button
                      onClick={() => handleLoadBrief(snapshot)}
                      className="flex-1 text-left"
                    >
                      <p className="text-sm font-medium truncate">
                        {snapshot.meetingContext.companyName || "Brief sans nom"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {snapshot.meetingContext.sector && `${snapshot.meetingContext.sector} · `}
                        {new Date(snapshot.savedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {snapshot.generationDuration && ` · ${Math.round(snapshot.generationDuration)}s`}
                      </p>
                    </button>
                    <button
                      onClick={() => handleDeleteBrief(snapshot.id)}
                      className="p-1 text-cgi-gray-400 hover:text-red-500 transition-colors shrink-0"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}

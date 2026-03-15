"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "./app-header";
import { ChatPanel } from "@/components/chat/chat-panel";
import { BriefPanel } from "@/components/brief/brief-panel";
import { useBriefStore } from "@/store/brief-store";
import { useBriefAutosave } from "@/hooks/use-brief-autosave";

export function AppShell() {
  const [activePanel, setActivePanel] = useState<"chat" | "brief">("chat");
  const [provider, setProvider] = useState("gemini");

  // Auto-sauvegarde du brief en localStorage
  useBriefAutosave();

  // Charger le provider au mount
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setProvider(d.provider))
      .catch(() => {});
  }, []);

  // Quand le consultant clique "Approfondir" dans le brief → envoyer au chat
  const handleDeepen = useCallback(
    (topic: string) => {
      window.dispatchEvent(new CustomEvent("brief:deepen", { detail: topic }));
      setActivePanel("chat");
    },
    []
  );

  // Basculer automatiquement sur le brief quand il passe à "ready" (mobile)
  useEffect(() => {
    const unsubscribe = useBriefStore.subscribe(
      (state, prevState) => {
        if (state.status === "ready" && prevState.status !== "ready") {
          setActivePanel("brief");
        }
      }
    );
    return unsubscribe;
  }, []);

  return (
    <div className="flex h-screen flex-col">
      <AppHeader
        provider={provider}
        activePanel={activePanel}
        onTogglePanel={setActivePanel}
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div
          className={`${
            activePanel === "chat" ? "flex" : "hidden"
          } lg:flex w-full lg:w-[45%] flex-col border-r border-cgi-gray-200`}
        >
          <ChatPanel />
        </div>

        {/* Brief panel */}
        <div
          className={`${
            activePanel === "brief" ? "flex" : "hidden"
          } lg:flex w-full lg:w-[55%] flex-col bg-cgi-gray-50`}
        >
          <BriefPanel onDeepen={handleDeepen} />
        </div>
      </main>
    </div>
  );
}

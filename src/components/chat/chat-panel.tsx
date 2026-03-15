"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { SuggestedPrompts } from "./suggested-prompts";
import { useCallback, useEffect, useRef, useMemo } from "react";
import { useBriefSync } from "@/hooks/use-brief-sync";
import { MessageSquare, AlertCircle, RefreshCw } from "lucide-react";

function useSessionId() {
  return useMemo(() => crypto.randomUUID(), []);
}

export function ChatPanel() {
  const sessionId = useSessionId();

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { sessionId },
      }),
    [sessionId]
  );

  const { messages, sendMessage, status, error, regenerate } = useChat({ transport });

  useBriefSync(messages);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";

  // Écouter les demandes d'approfondissement depuis le BriefPanel
  const handleDeepenEvent = useCallback(
    (e: Event) => {
      const topic = (e as CustomEvent<string>).detail;
      if (topic && !isBusy) {
        sendMessage({ text: `Cherche plus d'informations sur ${topic}` });
      }
    },
    [sendMessage, isBusy]
  );

  useEffect(() => {
    window.addEventListener("brief:deepen", handleDeepenEvent);
    return () => window.removeEventListener("brief:deepen", handleDeepenEvent);
  }, [handleDeepenEvent]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, error]);

  function handleSend(text: string) {
    sendMessage({ text });
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-4 max-w-sm mx-auto">
              <MessageSquare className="h-10 w-10 text-cgi-red/30 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-cgi-gray-700">
                  Préparez votre rendez-vous
                </h2>
                <p className="mt-1 text-sm text-cgi-gray-400">
                  Décrivez votre prochain RDV de prospection et je vous aiderai
                  à le préparer.
                </p>
              </div>
              <SuggestedPrompts onSelect={handleSend} />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {/* Indicateur de chargement */}
            {isBusy && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white px-4 py-3 text-sm text-cgi-gray-400 shadow-sm border border-cgi-gray-200 animate-pulse">
                  Réflexion en cours...
                </div>
              </div>
            )}

            {/* Message d'erreur avec bouton retry */}
            {error && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 max-w-md">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-red-700 font-medium">
                        Une erreur est survenue
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        {error.message.includes("fetch")
                          ? "Impossible de contacter le serveur. Vérifiez votre connexion."
                          : error.message.includes("429")
                            ? "Trop de requêtes. Attendez quelques secondes."
                            : error.message.includes("API key")
                              ? "Clé API invalide. Vérifiez votre configuration .env.local."
                              : "Le serveur a rencontré un problème. Réessayez."}
                      </p>
                      <button
                        onClick={() => regenerate()}
                        className="mt-2 flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-900 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-md transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Réessayer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatInput disabled={isBusy} onSend={handleSend} />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import type { UIMessage } from "ai";
import { useBriefStore } from "@/store/brief-store";
import type {
  ClientRadar,
  ContactProfile,
  OfferingMatch,
  SmartQuestion,
  AlertItem,
} from "@/lib/brief/types";
import type { MeetingContext } from "@/lib/types/meeting";

/**
 * Synchronise les résultats des tool calls du chat avec le Zustand store du brief.
 * En AI SDK v6, les ToolUIPart typées ont type "tool-{name}" et state "output-available".
 */
export function useBriefSync(messages: UIMessage[]) {
  const store = useBriefStore();
  const processedRef = useRef(new Set<string>());

  useEffect(() => {
    const currentStatus = store.status;

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        // En AI SDK v6, les ToolUIPart typées ont type "tool-{name}" (pas de propriété toolName)
        if (typeof part.type !== "string" || !part.type.startsWith("tool-")) continue;

        const toolName = part.type.slice(5); // "tool-extractMeetingContext" → "extractMeetingContext"
        const toolPart = part as {
          type: string;
          toolCallId: string;
          state: string;
          output?: unknown;
          input?: unknown;
        };

        if (toolPart.state !== "output-available") continue;

        // Éviter de reprocesser les mêmes résultats
        const key = `${message.id}-${toolPart.toolCallId}`;
        if (processedRef.current.has(key)) continue;
        processedRef.current.add(key);

        const result = toolPart.output as Record<string, unknown>;

        if (!result || result.success === false) continue;

        // En mode affinage (brief déjà "ready"), passer en "refining"
        const isRefining =
          currentStatus === "ready" || currentStatus === "refining";

        switch (toolName) {
          case "extractMeetingContext": {
            if (!isRefining) store.setStatus("gathering");
            const ctx = result.context as MeetingContext;
            if (ctx) {
              console.log("[briefSync] setMeetingContext:", ctx);
              store.setMeetingContext(ctx);
            }
            break;
          }

          case "triggerResearch":
            store.setStatus(isRefining ? "refining" : "researching");
            break;

          case "generateBriefSection": {
            if (!isRefining) store.setStatus("generating");
            const section = result.section as string;
            const data = result.data;

            console.log("[briefSync] section:", section);

            switch (section) {
              case "clientRadar":
                store.setClientRadar(data as ClientRadar);
                break;
              case "contactProfile":
                store.setContactProfile(data as ContactProfile);
                break;
              case "offeringsMapping":
                store.setOfferingsMapping(data as OfferingMatch[]);
                break;
              case "questions":
                store.setQuestions(data as SmartQuestion[]);
                break;
              case "alerts":
                store.setAlerts(data as AlertItem[]);
                break;
            }

            if (isRefining || section === "alerts") {
              store.setStatus("ready");
            }
            break;
          }
        }
      }
    }
  }, [messages, store]);
}

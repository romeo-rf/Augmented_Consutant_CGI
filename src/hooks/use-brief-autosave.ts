"use client";

import { useEffect, useRef } from "react";
import { useBriefStore } from "@/store/brief-store";
import { saveBriefToHistory } from "@/lib/brief/history";

/**
 * Auto-sauvegarde le brief dans localStorage quand il passe à "ready".
 * Ne sauvegarde qu'une fois par session (pas à chaque affinage).
 */
export function useBriefAutosave() {
  const savedRef = useRef(false);

  useEffect(() => {
    const unsubscribe = useBriefStore.subscribe((state, prevState) => {
      if (state.status === "ready" && prevState.status !== "ready" && !savedRef.current) {
        savedRef.current = true;
        saveBriefToHistory({
          meetingContext: state.meetingContext,
          generationDuration: state.generationDuration,
          clientRadar: state.clientRadar,
          contactProfile: state.contactProfile,
          offeringsMapping: state.offeringsMapping,
          questions: state.questions,
          alerts: state.alerts,
        });
      }
    });
    return unsubscribe;
  }, []);
}

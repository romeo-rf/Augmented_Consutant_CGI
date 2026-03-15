"use client";

import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (text: string) => void;
}

const suggestions = [
  {
    label: "RDV prospection",
    text: "J'ai un rendez-vous de prospection la semaine prochaine avec le DSI de Bouygues Telecom pour parler cybersécurité.",
  },
  {
    label: "Nouveau client retail",
    text: "Je dois rencontrer le directeur digital de Carrefour pour discuter de leur transformation data.",
  },
  {
    label: "Secteur banque",
    text: "Je prépare un RDV avec la RSSI de BNP Paribas, on veut leur proposer notre offre cloud souverain.",
  },
];

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-cgi-gray-400 text-center">
        Exemples pour démarrer :
      </p>
      <div className="flex flex-col gap-2">
        {suggestions.map((s, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="text-left h-auto py-2 px-3 whitespace-normal text-xs text-cgi-gray-600 hover:border-cgi-red/50 hover:text-cgi-gray-800"
            onClick={() => onSelect(s.text)}
          >
            <span className="font-medium text-cgi-red mr-1">{s.label} —</span>
            <span className="line-clamp-2">{s.text.slice(0, 80)}...</span>
          </Button>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ConfidenceScore } from "@/lib/brief/confidence";
import { confidenceColors } from "@/lib/brief/confidence";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

interface ConfidenceBadgeProps {
  score: ConfidenceScore | null;
}

const icons = {
  high: ShieldCheck,
  medium: ShieldAlert,
  low: ShieldQuestion,
};

export function ConfidenceBadge({ score }: ConfidenceBadgeProps) {
  if (!score) return null;

  const Icon = icons[score.level];
  const color = confidenceColors[score.level];

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${color}`}>
      <Icon className="h-3 w-3" />
      <span className="font-medium">{score.label}</span>
      <span className="opacity-70">({score.sourceCount} sources)</span>
    </div>
  );
}

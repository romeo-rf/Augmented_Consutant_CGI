"use client";

import { useState } from "react";
import type { OfferingMatch, OfferingStatus, PitchElements } from "@/lib/brief/types";
import type { CgiOffering } from "@/lib/catalog/loader";
import type { MeetingContext } from "@/lib/types/meeting";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  X,
  Target,
  Building2,
  Lightbulb,
  Sparkles,
  Copy,
  RefreshCw,
  Loader2,
  MessageCircle,
} from "lucide-react";

interface OfferingDetailSheetProps {
  match: OfferingMatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (offeringId: string, status: OfferingStatus) => void;
  meetingContext?: MeetingContext;
  onPitchGenerated?: (offeringId: string, pitch: PitchElements) => void;
}

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "Très pertinent", color: "text-green-700 bg-green-100" };
  if (score >= 60) return { label: "Pertinent", color: "text-amber-700 bg-amber-100" };
  return { label: "Faible pertinence", color: "text-gray-700 bg-gray-100" };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 shrink-0"
      onClick={handleCopy}
      title="Copier"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );
}

export function OfferingDetailSheet({
  match,
  open,
  onOpenChange,
  onStatusChange,
  meetingContext,
  onPitchGenerated,
}: OfferingDetailSheetProps) {
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchError, setPitchError] = useState<string | null>(null);

  if (!match) return null;

  const detail: CgiOffering | undefined = match.catalogDetail;
  const scoreInfo = getScoreLabel(match.relevanceScore);
  const pitch = match.pitchElements;

  async function generatePitch() {
    if (!match || !meetingContext) return;
    setPitchLoading(true);
    setPitchError(null);

    try {
      const res = await fetch("/api/brief/generate-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: meetingContext,
          match: {
            issueName: match.issueName,
            issueDescription: match.issueDescription,
            offering: match.offering,
            reasoning: match.reasoning,
            catalogDetail: match.catalogDetail
              ? {
                  description: match.catalogDetail.description,
                  valueProposition: match.catalogDetail.valueProposition,
                }
              : undefined,
          },
        }),
      });

      if (!res.ok) throw new Error("Erreur serveur");

      const pitchData: PitchElements = await res.json();
      onPitchGenerated?.(match.offering.id, pitchData);
    } catch {
      setPitchError("Impossible de générer le pitch. Réessayez.");
    } finally {
      setPitchLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-cgi-red shrink-0" />
            {match.offering.name}
          </SheetTitle>
          <SheetDescription>
            Détail de l&apos;offre et du mapping
          </SheetDescription>
        </SheetHeader>

        {/* Statut + actions */}
        {onStatusChange && (
          <div className="flex items-center gap-2">
            <Button
              variant={match.status === "accepted" ? "default" : "outline"}
              size="sm"
              className={match.status === "accepted" ? "bg-green-600 hover:bg-green-700" : ""}
              onClick={() =>
                onStatusChange(
                  match.offering.id,
                  match.status === "accepted" ? "pending" : "accepted"
                )
              }
            >
              <Check className="h-4 w-4 mr-1" />
              Retenir
            </Button>
            <Button
              variant={match.status === "rejected" ? "destructive" : "outline"}
              size="sm"
              onClick={() =>
                onStatusChange(
                  match.offering.id,
                  match.status === "rejected" ? "pending" : "rejected"
                )
              }
            >
              <X className="h-4 w-4 mr-1" />
              Rejeter
            </Button>
          </div>
        )}

        <Separator />

        {/* Enjeu client identifié */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Enjeu client identifié
          </h3>
          <p className="text-sm font-medium">{match.issueName}</p>
          <p className="text-sm text-muted-foreground">{match.issueDescription}</p>
        </div>

        {/* Score de pertinence */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Pertinence</h3>
          <div className="flex items-center gap-2">
            <Badge className={scoreInfo.color}>
              {match.relevanceScore}% — {scoreInfo.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground italic">{match.reasoning}</p>
        </div>

        <Separator />

        {/* Détail du catalogue CGI */}
        {detail ? (
          <>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-cgi-red" />
                Description de l&apos;offre
              </h3>
              <p className="text-sm text-muted-foreground">{detail.description}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Proposition de valeur</h3>
              <p className="text-sm text-muted-foreground">{detail.valueProposition}</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Secteurs cibles</h3>
              <div className="flex flex-wrap gap-1.5">
                {detail.targetSectors.map((sector) => (
                  <Badge key={sector} variant="outline" className="text-xs">
                    {sector}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-4">
            <p className="text-sm text-muted-foreground text-center">
              Détail du catalogue non disponible pour cette offre.
            </p>
          </div>
        )}

        {/* Indicateur ajout manuel */}
        {match.isManual && (
          <>
            <Separator />
            <Badge variant="outline" className="text-xs">
              Ajoutée manuellement par le consultant
            </Badge>
          </>
        )}

        <Separator />

        {/* Éléments de pitch */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cgi-red" />
              Éléments de pitch
            </h3>
            {meetingContext && (
              <Button
                variant="outline"
                size="sm"
                onClick={generatePitch}
                disabled={pitchLoading}
              >
                {pitchLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : pitch ? (
                  <RefreshCw className="h-3 w-3 mr-1" />
                ) : (
                  <Sparkles className="h-3 w-3 mr-1" />
                )}
                {pitch ? "Regénérer" : "Générer"}
              </Button>
            )}
          </div>

          {pitchError && (
            <p className="text-sm text-red-600">{pitchError}</p>
          )}

          {pitchLoading && !pitch && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border border-dashed rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
              Génération du pitch en cours...
            </div>
          )}

          {pitch && (
            <div className="space-y-4">
              {/* Phrases d'accroche */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Phrases d&apos;accroche
                </p>
                {pitch.hookPhrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md bg-accent/50 p-2.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5 mt-0.5 text-cgi-red shrink-0" />
                    <p className="text-sm flex-1">{phrase}</p>
                    <CopyButton text={phrase} />
                  </div>
                ))}
              </div>

              {/* Arguments clés */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Arguments clés
                </p>
                {pitch.keyArguments.map((arg, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-md border p-2.5"
                  >
                    <span className="text-xs font-bold text-cgi-red mt-0.5 shrink-0">
                      {i + 1}.
                    </span>
                    <p className="text-sm flex-1">{arg}</p>
                    <CopyButton text={arg} />
                  </div>
                ))}
              </div>

              {/* Question d'ouverture */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Question d&apos;ouverture suggérée
                </p>
                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-2.5">
                  <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                  <p className="text-sm flex-1 italic">{pitch.openingQuestion}</p>
                  <CopyButton text={pitch.openingQuestion} />
                </div>
              </div>
            </div>
          )}

          {!pitch && !pitchLoading && !meetingContext && (
            <p className="text-xs text-muted-foreground">
              Le contexte de réunion est nécessaire pour générer des éléments de pitch.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState } from "react";
import type { ContactProfile } from "@/lib/brief/types";
import { SourceLink } from "./source-link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  UserCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronRight,
  MessageCircle,
  Target,
  Lightbulb,
  Search,
  BookOpen,
  Briefcase,
  Tag,
  AlertTriangle,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ContactProfileCardProps {
  data: ContactProfile;
  onDeepen?: (topic: string) => void;
}

export function ContactProfileCard({ data, onDeepen }: ContactProfileCardProps) {
  const { verifiedInfo, roleInsights } = data;
  const hasVerifiedBackground = verifiedInfo.background.length > 0;
  const hasVerifiedFacts = verifiedInfo.keyFacts.length > 0;
  const hasPublications = verifiedInfo.publications.length > 0;
  const hasSources = verifiedInfo.sources.length > 0;

  return (
    <Card>
      {/* Header — Identité */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserCircle className="h-5 w-5 text-cgi-red" />
          {data.name}
          {data.linkedinUrl ? (
            <a
              href={data.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full"
            >
              <Linkedin className="h-3 w-3" />
              LinkedIn
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Linkedin className="h-3 w-3" />
              Non trouvé
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{data.role}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Bandeau info quand aucune donnée vérifiée trouvée */}
        {!data.dataFound && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Aucune information publique trouvée</p>
              <p className="text-amber-700 mt-0.5 text-xs">
                {data.missingInfo || "Les conseils ci-dessous sont basés sur le rôle et le secteur."}
              </p>
            </div>
          </div>
        )}

        {data.dataFound && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 rounded px-2 py-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Informations vérifiées par les sources
          </div>
        )}

        {/* Zone principale — Comment lui parler (toujours visible) */}
        <div className="space-y-4">
          {/* Ton recommandé */}
          <div className="flex items-start gap-2">
            <MessageCircle className="h-4 w-4 text-cgi-red mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">Ton recommandé</p>
              <p className="text-sm text-muted-foreground">
                {roleInsights.communicationStyle.tone}
              </p>
            </div>
          </div>

          {/* Do / Don't */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* À faire */}
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-green-800 uppercase tracking-wide">
                À faire
              </p>
              {roleInsights.communicationStyle.doList.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-sm text-green-800">
                  <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* À éviter */}
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-red-800 uppercase tracking-wide">
                À éviter
              </p>
              {roleInsights.communicationStyle.dontList.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-sm text-red-800">
                  <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Accroches suggérées */}
          {roleInsights.icebreakers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-medium">Accroches suggérées</p>
              </div>
              <div className="space-y-2">
                {roleInsights.icebreakers.map((icebreaker, i) => (
                  <div
                    key={i}
                    className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 italic border-l-2 border-cgi-red"
                  >
                    &laquo; {icebreaker} &raquo;
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sections collapsibles */}
        <div className="space-y-2 pt-2 border-t">
          {/* Enjeux typiques du poste */}
          {roleInsights.typicalChallenges.length > 0 && (
            <CollapsibleSection
              icon={<Target className="h-4 w-4 text-cgi-red" />}
              title="Enjeux typiques du poste"
              count={roleInsights.typicalChallenges.length}
            >
              <ul className="space-y-1.5 pl-1">
                {roleInsights.typicalChallenges.map((challenge, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-cgi-red mt-1 shrink-0">•</span>
                    <span>{challenge}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Facteurs de décision */}
          {roleInsights.decisionFactors.length > 0 && (
            <CollapsibleSection
              icon={<Briefcase className="h-4 w-4 text-violet-600" />}
              title="Facteurs de décision"
              count={roleInsights.decisionFactors.length}
            >
              <ul className="space-y-1.5 pl-1">
                {roleInsights.decisionFactors.map((factor, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-violet-600 mt-1 shrink-0">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}

          {/* Parcours vérifié (masqué si vide) */}
          {(hasVerifiedBackground || hasVerifiedFacts) && (
            <CollapsibleSection
              icon={<Search className="h-4 w-4 text-blue-600" />}
              title="Parcours vérifié"
              badge="Sourcé"
            >
              {hasVerifiedBackground && (
                <p className="text-sm text-muted-foreground mb-2">
                  {verifiedInfo.background}
                </p>
              )}
              {hasVerifiedFacts && (
                <ul className="space-y-1.5 pl-1">
                  {verifiedInfo.keyFacts.map((fact, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-blue-600 mt-1 shrink-0">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CollapsibleSection>
          )}

          {/* Publications & interventions (masqué si vide) */}
          {hasPublications && (
            <CollapsibleSection
              icon={<BookOpen className="h-4 w-4 text-emerald-600" />}
              title="Publications & interventions"
              count={verifiedInfo.publications.length}
              badge="Sourcé"
            >
              <ul className="space-y-1.5 pl-1">
                {verifiedInfo.publications.map((pub, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-emerald-600 mt-1 shrink-0">•</span>
                    <span>{pub}</span>
                  </li>
                ))}
              </ul>
            </CollapsibleSection>
          )}
        </div>

        {/* Bouton approfondir */}
        {onDeepen && (
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() =>
                onDeepen(
                  `Cherche plus d'informations sur le profil de ${data.name} (${data.role})`
                )
              }
            >
              <Search className="h-3 w-3 mr-1.5" />
              Approfondir la recherche
            </Button>
          </div>
        )}

        {/* Footer — Sources + badge de provenance + missing info */}
        <div className="pt-3 border-t space-y-2">
          {hasSources && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sources</p>
              <div className="flex flex-wrap gap-2">
                {verifiedInfo.sources.map((source, i) => (
                  <SourceLink key={i} source={source} />
                ))}
              </div>
            </div>
          )}

          {data.missingInfo && (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
              <span className="font-medium">Note :</span> {data.missingInfo}
            </p>
          )}

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            Conseils basés sur le rôle de {data.role}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Section collapsible réutilisable */
function CollapsibleSection({
  icon,
  title,
  count,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-2 rounded-md hover:bg-muted/50 transition-colors">
        <ChevronRight
          className={`h-4 w-4 text-muted-foreground transition-transform ${
            open ? "rotate-90" : ""
          }`}
        />
        {icon}
        <span className="text-sm font-medium flex-1 text-left">{title}</span>
        {count !== undefined && (
          <span className="text-xs text-muted-foreground">({count})</span>
        )}
        {badge && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
            {badge}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 pr-2 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

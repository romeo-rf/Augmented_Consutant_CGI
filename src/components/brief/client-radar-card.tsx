"use client";

import { useState } from "react";
import type { ClientRadar, IssueCategory } from "@/lib/brief/types";
import { SourceLink } from "./source-link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Building2,
  MapPin,
  Newspaper,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  ChevronRight,
  Pin,
  Target,
  Globe,
  Cpu,
  MessageSquare,
  Search,
  Lightbulb,
  Users,
  Briefcase,
  MapPinned,
  CircleDollarSign,
  Activity,
} from "lucide-react";
import { useBriefStore } from "@/store/brief-store";

// -- Couleurs par catégorie d'enjeu --
const issueCategoryConfig: Record<
  IssueCategory,
  { label: string; className: string }
> = {
  digital: { label: "Digital", className: "bg-blue-100 text-blue-800" },
  rh: { label: "RH", className: "bg-violet-100 text-violet-800" },
  reglementaire: {
    label: "Réglementaire",
    className: "bg-orange-100 text-orange-800",
  },
  croissance: { label: "Croissance", className: "bg-green-100 text-green-800" },
  restructuration: {
    label: "Restructuration",
    className: "bg-red-100 text-red-800",
  },
  innovation: {
    label: "Innovation",
    className: "bg-cyan-100 text-cyan-800",
  },
  autre: { label: "Autre", className: "bg-gray-100 text-gray-800" },
};

// -- Indicateur "Non trouvé" --
function MissingField({ label }: { label: string }) {
  return (
    <span className="text-xs italic text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
      {label} — non trouvé
    </span>
  );
}

// -- Ligne de la carte d'identité --
function IdentityRow({
  icon,
  label,
  value,
  missingLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  missingLabel?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="shrink-0 mt-0.5 text-muted-foreground">{icon}</span>
      <span className="font-medium text-muted-foreground w-28 shrink-0">
        {label}
      </span>
      {value ? (
        <span>{value}</span>
      ) : (
        <MissingField label={missingLabel || label} />
      )}
    </div>
  );
}

// -- Icône tendance financière --
function FinancialTrendIcon({
  direction,
}: {
  direction: ClientRadar["financialTrend"]["direction"];
}) {
  switch (direction) {
    case "growth":
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case "decline":
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    case "stable":
      return <Minus className="h-4 w-4 text-gray-500" />;
    default:
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
  }
}

const trendLabel: Record<ClientRadar["financialTrend"]["direction"], string> = {
  growth: "Croissance",
  stable: "Stable",
  decline: "Déclin",
  unknown: "Non déterminé",
};

const trendColor: Record<ClientRadar["financialTrend"]["direction"], string> = {
  growth: "text-green-600",
  stable: "text-gray-600",
  decline: "text-red-600",
  unknown: "text-muted-foreground",
};

// -- Section collapsible réutilisable --
function RadarSection({
  title,
  icon,
  count,
  empty = false,
  defaultOpen = false,
  onDeepen,
  deepenTopic,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  empty?: boolean;
  defaultOpen?: boolean;
  onDeepen?: (topic: string) => void;
  deepenTopic?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center justify-between">
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-cgi-red transition-colors py-1 cursor-pointer">
          <ChevronRight
            className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`}
          />
          {icon}
          <span className={empty ? "text-muted-foreground" : ""}>{title}</span>
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0">
              {count}
            </Badge>
          )}
          {empty && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-600 border-amber-300 bg-amber-50">
              Non trouvé
            </Badge>
          )}
        </CollapsibleTrigger>
        {onDeepen && deepenTopic && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-cgi-red gap-1"
            onClick={() => onDeepen(deepenTopic)}
          >
            <Search className="h-3 w-3" />
            Approfondir
          </Button>
        )}
      </div>
      <CollapsibleContent className="pl-6 pt-1 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// -- Composant principal --
interface ClientRadarCardProps {
  data: ClientRadar;
  onDeepen?: (topic: string) => void;
}

export function ClientRadarCard({ data, onDeepen }: ClientRadarCardProps) {
  const { radarBookmarks, toggleRadarBookmark } = useBriefStore();

  function BookmarkButton({ id }: { id: string }) {
    const isBookmarked = radarBookmarks.has(id);
    return (
      <button
        onClick={() => toggleRadarBookmark(id)}
        className={`shrink-0 p-0.5 rounded transition-colors ${
          isBookmarked
            ? "text-cgi-red"
            : "text-muted-foreground/40 hover:text-muted-foreground"
        }`}
        title={isBookmarked ? "Retirer des points clés" : "Épingler"}
      >
        <Pin className={`h-3 w-3 ${isBookmarked ? "fill-current" : ""}`} />
      </button>
    );
  }

  return (
    <Card>
      {/* -- En-tête -- */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5 text-cgi-red" />
          {data.companyName}
        </CardTitle>
        <CardDescription>
          <Badge variant="secondary">{data.sector}</Badge>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* -- Carte d'identité (toujours visible, tous les champs) -- */}
        <div className="space-y-2 bg-muted/30 rounded-lg p-3">
          <IdentityRow
            icon={<Briefcase className="h-3.5 w-3.5" />}
            label="Activité"
            value={data.activity}
            missingLabel="Activité détaillée"
          />
          <IdentityRow
            icon={<Building2 className="h-3.5 w-3.5" />}
            label="Taille"
            value={data.size}
          />
          <IdentityRow
            icon={<Users className="h-3.5 w-3.5" />}
            label="Effectif"
            value={data.employeeCount}
            missingLabel="Nombre de collaborateurs"
          />
          <IdentityRow
            icon={<CircleDollarSign className="h-3.5 w-3.5" />}
            label="CA"
            value={data.revenue}
            missingLabel="Chiffre d'affaires"
          />
          <IdentityRow
            icon={<MapPin className="h-3.5 w-3.5" />}
            label="Siège"
            value={data.headquarters}
          />
          <IdentityRow
            icon={<MapPinned className="h-3.5 w-3.5" />}
            label="Présence"
            value={data.geographicPresence}
            missingLabel="Implantation géographique"
          />

          {/* Clients / marchés */}
          <div className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 text-muted-foreground">
              <Target className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-muted-foreground w-28 shrink-0">
              Clients
            </span>
            {data.mainClients.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {data.mainClients.map((client, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {client}
                  </Badge>
                ))}
              </div>
            ) : (
              <MissingField label="Clients principaux" />
            )}
          </div>

          {/* Tendance financière */}
          <div className="flex items-start gap-2 text-sm">
            <span className="shrink-0 mt-0.5 text-muted-foreground">
              <Activity className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-muted-foreground w-28 shrink-0">
              Tendance
            </span>
            <div className="flex items-center gap-2">
              <FinancialTrendIcon direction={data.financialTrend.direction} />
              <span className={trendColor[data.financialTrend.direction]}>
                {trendLabel[data.financialTrend.direction]}
              </span>
              {data.financialTrend.details && (
                <span className="text-xs text-muted-foreground">
                  — {data.financialTrend.details}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* -- Zone "À retenir" (toujours visible) -- */}
        <div className="bg-cgi-red/5 border border-cgi-red/20 rounded-lg p-3 space-y-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-cgi-red mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Chiffres clés à retenir
            </h4>
            {data.keyNumbers.length > 0 ? (
              <ul className="space-y-1">
                {data.keyNumbers.map((num, i) => (
                  <li
                    key={i}
                    className="text-sm font-medium flex items-center justify-between gap-2"
                  >
                    <span>{num}</span>
                    <BookmarkButton id={`keynum-${i}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-amber-600">
                Aucun chiffre clé trouvé — complétez manuellement
              </p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-cgi-red mb-1 flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Accroche suggérée
            </h4>
            {data.elevatorPitch ? (
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{data.elevatorPitch}&rdquo;
              </p>
            ) : (
              <p className="text-xs italic text-amber-600">
                Pas assez d&apos;informations pour générer une accroche
              </p>
            )}
          </div>
        </div>

        {/* -- Sections collapsibles (toujours présentes) -- */}
        <div className="space-y-1 border-t pt-3">
          {/* Enjeux stratégiques */}
          <RadarSection
            title="Enjeux stratégiques"
            icon={<Lightbulb className="h-4 w-4" />}
            count={data.strategicIssues.length}
            empty={data.strategicIssues.length === 0}
            defaultOpen={data.strategicIssues.length > 0}
            onDeepen={onDeepen}
            deepenTopic={`les enjeux stratégiques de ${data.companyName}`}
          >
            {data.strategicIssues.length > 0 ? (
              <ul className="space-y-2">
                {data.strategicIssues.map((issue, i) => {
                  const config = issueCategoryConfig[issue.category];
                  return (
                    <li key={i} className="text-sm space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-[10px] px-1.5 py-0 ${config.className}`}
                        >
                          {config.label}
                        </Badge>
                        <span className="font-medium">{issue.title}</span>
                        <BookmarkButton id={`issue-${i}`} />
                      </div>
                      <p className="text-muted-foreground text-xs pl-0.5">
                        {issue.description}
                      </p>
                      {issue.source && <SourceLink source={issue.source} />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs italic text-amber-600">
                Aucun enjeu stratégique identifié — utilisez &quot;Approfondir&quot; pour relancer la recherche
              </p>
            )}
          </RadarSection>

          {/* Actualités récentes */}
          <RadarSection
            title="Actualités récentes"
            icon={<Newspaper className="h-4 w-4" />}
            count={data.recentNews.length}
            empty={data.recentNews.length === 0}
            defaultOpen={data.recentNews.length > 0}
            onDeepen={onDeepen}
            deepenTopic={`les actualités récentes de ${data.companyName}`}
          >
            {data.recentNews.length > 0 ? (
              <ul className="space-y-2">
                {data.recentNews.map((news, i) => (
                  <li
                    key={i}
                    className="text-sm border-l-2 border-cgi-red/30 pl-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium">{news.headline}</p>
                      <BookmarkButton id={`news-${i}`} />
                    </div>
                    {news.businessSignal && (
                      <p className="text-xs italic text-blue-600 mt-0.5">
                        &rarr; {news.businessSignal}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {news.date}
                      </span>
                      <SourceLink source={news.source} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-amber-600">
                Aucune actualité récente trouvée
              </p>
            )}
          </RadarSection>

          {/* Écosystème & concurrence */}
          <RadarSection
            title="Écosystème & concurrence"
            icon={<Globe className="h-4 w-4" />}
            empty={
              data.ecosystem.competitors.length === 0 &&
              data.ecosystem.knownPartners.length === 0 &&
              data.ecosystem.marketPosition === "Non déterminé"
            }
            onDeepen={onDeepen}
            deepenTopic={`l'écosystème concurrentiel de ${data.companyName}`}
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium w-28 shrink-0">Position :</span>
                {data.ecosystem.marketPosition &&
                data.ecosystem.marketPosition !== "Non déterminé" ? (
                  <span className="text-xs text-muted-foreground">
                    {data.ecosystem.marketPosition}
                  </span>
                ) : (
                  <MissingField label="Position marché" />
                )}
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium w-28 shrink-0">Concurrents :</span>
                {data.ecosystem.competitors.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {data.ecosystem.competitors.join(", ")}
                  </span>
                ) : (
                  <MissingField label="Concurrents" />
                )}
              </div>
              <div className="flex items-start gap-2">
                <span className="text-xs font-medium w-28 shrink-0">Partenaires :</span>
                {data.ecosystem.knownPartners.length > 0 ? (
                  <span className="text-xs text-muted-foreground">
                    {data.ecosystem.knownPartners.join(", ")}
                  </span>
                ) : (
                  <MissingField label="Partenaires techno" />
                )}
              </div>
              {data.ecosystem.source && (
                <SourceLink source={data.ecosystem.source} />
              )}
            </div>
          </RadarSection>

          {/* Maturité digitale */}
          <RadarSection
            title="Maturité digitale"
            icon={<Cpu className="h-4 w-4" />}
            empty={data.digitalMaturity.level === "inconnue"}
            onDeepen={onDeepen}
            deepenTopic={`la maturité digitale et les projets IT de ${data.companyName}`}
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">Niveau :</span>
                {data.digitalMaturity.level !== "inconnue" ? (
                  <Badge variant="outline" className="text-xs">
                    {data.digitalMaturity.level === "avancee"
                      ? "Avancée"
                      : data.digitalMaturity.level === "en_cours"
                        ? "En cours"
                        : "Émergente"}
                  </Badge>
                ) : (
                  <MissingField label="Niveau de maturité" />
                )}
              </div>
              <div>
                <span className="text-xs font-medium">Signaux :</span>
                {data.digitalMaturity.signals.length > 0 ? (
                  <ul className="space-y-1 mt-1">
                    {data.digitalMaturity.signals.map((signal, i) => (
                      <li
                        key={i}
                        className="text-xs text-muted-foreground flex gap-2"
                      >
                        <span className="text-cgi-red mt-0.5">&#8226;</span>
                        <span>{signal}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="block mt-1">
                    <MissingField label="Signaux digitaux" />
                  </span>
                )}
              </div>
              {data.digitalMaturity.source && (
                <SourceLink source={data.digitalMaturity.source} />
              )}
            </div>
          </RadarSection>

          {/* Faits clés */}
          <RadarSection
            title="Faits clés"
            icon={<Info className="h-4 w-4" />}
            count={data.keyFacts.length}
            empty={data.keyFacts.length === 0}
          >
            {data.keyFacts.length > 0 ? (
              <ul className="space-y-1">
                {data.keyFacts.map((fact, i) => (
                  <li
                    key={i}
                    className="text-sm text-muted-foreground flex items-start justify-between gap-2"
                  >
                    <span className="flex gap-2">
                      <span className="text-cgi-red mt-0.5">&#8226;</span>
                      <span>{fact}</span>
                    </span>
                    <BookmarkButton id={`fact-${i}`} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-amber-600">
                Aucun fait marquant identifié
              </p>
            )}
          </RadarSection>
        </div>

        {/* -- Sources -- */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-1">Sources</p>
          {data.sources.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.sources.map((source, i) => (
                <SourceLink key={i} source={source} />
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-amber-600">Aucune source</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

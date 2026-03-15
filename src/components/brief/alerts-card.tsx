"use client";

import type { AlertItem } from "@/lib/brief/types";
import { SourceLink } from "./source-link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";

interface AlertsCardProps {
  data: AlertItem[];
}

const typeLabels: Record<AlertItem["type"], string> = {
  sensible: "Sujet sensible",
  concurrent: "Concurrent",
  objection: "Objection probable",
  opportunite: "Opportunité",
};

const severityConfig: Record<
  AlertItem["severity"],
  { icon: typeof Info; color: string; border: string }
> = {
  info: {
    icon: Info,
    color: "bg-blue-100 text-blue-800",
    border: "border-l-blue-500",
  },
  warning: {
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-800",
    border: "border-l-amber-500",
  },
  critical: {
    icon: ShieldAlert,
    color: "bg-red-100 text-red-800",
    border: "border-l-red-500",
  },
};

export function AlertsCard({ data }: AlertsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-cgi-red" />
          Alertes & Points d&apos;attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune alerte identifiée.
          </p>
        ) : (
          <div className="space-y-3">
            {data.map((alert, i) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              return (
                <div
                  key={i}
                  className={`border-l-4 ${config.border} rounded-r-lg p-3 space-y-1`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 shrink-0" />
                      <p className="text-sm font-medium">{alert.title}</p>
                    </div>
                    <Badge className={config.color}>
                      {typeLabels[alert.type]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    {alert.description}
                  </p>
                  {alert.source && (
                    <div className="pl-6">
                      <SourceLink source={alert.source} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

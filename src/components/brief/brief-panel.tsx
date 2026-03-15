"use client";

import { useBriefStore } from "@/store/brief-store";
import { BriefHeader } from "./brief-header";
import { ClientRadarCard } from "./client-radar-card";
import { ContactProfileCard } from "./contact-profile-card";
import { OfferingsMappingCard } from "./offerings-mapping-card";
import { AddOfferingDialog } from "./add-offering-dialog";
import { getAllOfferings } from "@/lib/catalog/loader";
import { QuestionsCard } from "./questions-card";
import { AlertsCard } from "./alerts-card";
import { ContextProgress } from "./context-progress";
import { GenerationProgress } from "./generation-progress";
import { ConfidenceBadge } from "./confidence-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getClientRadarConfidence,
  getContactProfileConfidence,
  getOfferingsConfidence,
  getQuestionsConfidence,
  getAlertsConfidence,
} from "@/lib/brief/confidence";
import {
  Building2,
  UserCircle,
  Puzzle,
  HelpCircle,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";

interface BriefPanelProps {
  onDeepen?: (topic: string) => void;
}

export function BriefPanel({ onDeepen }: BriefPanelProps) {
  const {
    status,
    lastUpdated,
    meetingContext,
    clientRadar,
    contactProfile,
    offeringsMapping,
    questions,
    alerts,
    updateOfferingStatus,
    updateOfferingsOrder,
    addOffering,
    updateOfferingPitch,
  } = useBriefStore();

  const isWorking =
    status === "generating" ||
    status === "researching" ||
    status === "refining";
  const isGathering = status === "idle" || status === "gathering";
  const hasBriefContent =
    clientRadar ||
    contactProfile ||
    offeringsMapping.length > 0 ||
    questions.length > 0 ||
    alerts.length > 0;
  const hasAnyContext = Object.values(meetingContext).some((v) => v !== null);

  const sectionsDone = [
    clientRadar,
    contactProfile,
    offeringsMapping.length > 0,
    questions.length > 0,
    alerts.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full">
      <BriefHeader status={status} lastUpdated={lastUpdated} />

      {!hasBriefContent && !isWorking ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-xs space-y-4">
            {isGathering && hasAnyContext ? (
              <ContextProgress context={meetingContext} />
            ) : (
              <div className="text-center space-y-2">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Le brief apparaitra ici une fois que l&apos;IA aura collecte
                  suffisamment d&apos;informations.
                </p>
                <p className="text-xs text-muted-foreground">
                  Decrivez votre prochain rendez-vous dans le chat pour commencer.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="radar" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start rounded-none border-b px-4 shrink-0">
            <TabsTrigger value="radar" className="gap-1 relative">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Radar</span>
              {clientRadar && <TabDot />}
            </TabsTrigger>
            <TabsTrigger value="contact" className="gap-1 relative">
              <UserCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Contact</span>
              {contactProfile && <TabDot />}
            </TabsTrigger>
            <TabsTrigger value="offres" className="gap-1 relative">
              <Puzzle className="h-4 w-4" />
              <span className="hidden sm:inline">Offres</span>
              {offeringsMapping.length > 0 && <TabDot />}
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-1 relative">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Questions</span>
              {questions.length > 0 && <TabDot />}
            </TabsTrigger>
            <TabsTrigger value="alertes" className="gap-1 relative">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Alertes</span>
              {alerts.length > 0 && <TabDot />}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto">
            {isWorking && (
              <div className="px-4 pt-4">
                <GenerationProgress
                  status={status}
                  sectionsDone={sectionsDone}
                  hasClientRadar={!!clientRadar}
                  hasContactProfile={!!contactProfile}
                  hasOfferings={offeringsMapping.length > 0}
                  hasQuestions={questions.length > 0}
                  hasAlerts={alerts.length > 0}
                />
              </div>
            )}

            <div className="p-4">
              <TabsContent value="radar" className="mt-0 space-y-3">
                {clientRadar ? (
                  <>
                    <ConfidenceBadge score={getClientRadarConfidence(clientRadar)} />
                    <ClientRadarCard data={clientRadar} onDeepen={onDeepen} />
                  </>
                ) : isWorking ? (
                  <SectionPlaceholder label="Analyse de l'entreprise en cours..." />
                ) : null}
              </TabsContent>

              <TabsContent value="contact" className="mt-0 space-y-3">
                {contactProfile ? (
                  <>
                    <ConfidenceBadge score={getContactProfileConfidence(contactProfile)} />
                    <ContactProfileCard data={contactProfile} onDeepen={onDeepen} />
                  </>
                ) : isWorking ? (
                  <SectionPlaceholder label="Analyse du profil en cours..." />
                ) : null}
              </TabsContent>

              <TabsContent value="offres" className="mt-0 space-y-3">
                {offeringsMapping.length > 0 ? (
                  <>
                    <ConfidenceBadge score={getOfferingsConfidence(offeringsMapping)} />
                    <OfferingsMappingCard
                      data={offeringsMapping}
                      onStatusChange={updateOfferingStatus}
                      onReorder={updateOfferingsOrder}
                      meetingContext={meetingContext}
                      onPitchGenerated={updateOfferingPitch}
                    />
                    <AddOfferingDialog
                      catalog={getAllOfferings()}
                      existingOfferingIds={offeringsMapping.map((m) => m.offering.id)}
                      onAdd={addOffering}
                    />
                  </>
                ) : isWorking ? (
                  <SectionPlaceholder label="Mapping des offres en cours..." />
                ) : null}
              </TabsContent>

              <TabsContent value="questions" className="mt-0 space-y-3">
                {questions.length > 0 ? (
                  <>
                    <ConfidenceBadge score={getQuestionsConfidence(questions)} />
                    <QuestionsCard data={questions} />
                  </>
                ) : isWorking ? (
                  <SectionPlaceholder label="Generation des questions en cours..." />
                ) : null}
              </TabsContent>

              <TabsContent value="alertes" className="mt-0 space-y-3">
                {alerts.length > 0 ? (
                  <>
                    <ConfidenceBadge score={getAlertsConfidence(alerts)} />
                    <AlertsCard data={alerts} />
                  </>
                ) : isWorking ? (
                  <SectionPlaceholder label="Analyse des alertes en cours..." />
                ) : null}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
}

/** Petit point vert sur l'onglet pour indiquer qu'il a du contenu */
function TabDot() {
  return (
    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-500" />
  );
}

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-cgi-gray-300 bg-cgi-gray-50 p-6">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-cgi-red border-t-transparent" />
      <p className="text-sm text-cgi-gray-500">{label}</p>
    </div>
  );
}

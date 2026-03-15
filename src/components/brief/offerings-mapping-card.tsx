"use client";

import { useState } from "react";
import type { OfferingMatch, OfferingStatus, PitchElements } from "@/lib/brief/types";
import type { MeetingContext } from "@/lib/types/meeting";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Puzzle, Check, X, ChevronRight, UserPlus, GripVertical } from "lucide-react";
import { OfferingDetailSheet } from "./offering-detail-sheet";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface OfferingsMappingCardProps {
  data: OfferingMatch[];
  onStatusChange?: (matchId: string, status: OfferingStatus) => void;
  onReorder?: (offerings: OfferingMatch[]) => void;
  meetingContext?: MeetingContext;
  onPitchGenerated?: (matchId: string, pitch: PitchElements) => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
}

function getStatusBorder(status: OfferingStatus): string {
  if (status === "accepted") return "border-green-300 bg-green-50/50";
  if (status === "rejected") return "border-gray-200 bg-gray-50 opacity-50";
  return "";
}

function sortOfferings(data: OfferingMatch[]): OfferingMatch[] {
  return [...data].sort((a, b) => {
    const statusOrder = { accepted: 0, pending: 1, rejected: 2 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    if (a.order !== b.order) return a.order - b.order;
    return b.relevanceScore - a.relevanceScore;
  });
}

// --- Contenu interne d'une carte offre (partagé entre sortable et statique) ---

interface OfferingItemContentProps {
  match: OfferingMatch;
  onStatusChange?: (matchId: string, status: OfferingStatus) => void;
  showGrip?: boolean;
  gripProps?: Record<string, unknown>;
}

function OfferingItemContent({
  match,
  onStatusChange,
  showGrip,
  gripProps,
}: OfferingItemContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {showGrip && (
            <button
              className="shrink-0 cursor-grab active:cursor-grabbing text-cgi-gray-400 hover:text-cgi-gray-700 touch-none"
              onClick={(e) => e.stopPropagation()}
              tabIndex={-1}
              {...gripProps}
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {match.issueName}
              </p>
              {match.isManual && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0">
                  <UserPlus className="h-3 w-3 mr-0.5" />
                  Manuel
                </Badge>
              )}
            </div>
            <p className="text-xs text-cgi-gray-500 line-clamp-2">
              {match.issueDescription}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={getScoreColor(match.relevanceScore)}>
            {match.relevanceScore}%
          </Badge>
          <ChevronRight className="h-4 w-4 text-cgi-gray-400" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-cgi-gray-400">→</span>
          <Badge variant="secondary">{match.offering.name}</Badge>
        </div>

        {onStatusChange && (
          <div
            className="flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${match.status === "accepted" ? "text-green-600 bg-green-100" : "text-cgi-gray-400"}`}
              onClick={() =>
                onStatusChange(
                  match.id,
                  match.status === "accepted" ? "pending" : "accepted"
                )
              }
              title="Retenir cette offre"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${match.status === "rejected" ? "text-red-600 bg-red-100" : "text-cgi-gray-400"}`}
              onClick={() =>
                onStatusChange(
                  match.id,
                  match.status === "rejected" ? "pending" : "rejected"
                )
              }
              title="Rejeter cette offre"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

// --- Item draggable (uniquement dans SortableContext) ---

function SortableOfferingItem({
  match,
  onSelect,
  onStatusChange,
}: {
  match: OfferingMatch;
  onSelect: (match: OfferingMatch) => void;
  onStatusChange?: (matchId: string, status: OfferingStatus) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: match.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-sm ${getStatusBorder(match.status)} ${isDragging ? "shadow-lg ring-2 ring-cgi-red/20 opacity-80" : ""}`}
      onClick={() => onSelect(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(match);
        }
      }}
    >
      <OfferingItemContent
        match={match}
        onStatusChange={onStatusChange}
        showGrip
        gripProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// --- Item statique (rejetées, hors SortableContext) ---

function StaticOfferingItem({
  match,
  onSelect,
  onStatusChange,
}: {
  match: OfferingMatch;
  onSelect: (match: OfferingMatch) => void;
  onStatusChange?: (matchId: string, status: OfferingStatus) => void;
}) {
  return (
    <div
      className={`border rounded-lg p-3 space-y-2 cursor-pointer hover:shadow-sm ${getStatusBorder(match.status)}`}
      onClick={() => onSelect(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(match);
        }
      }}
    >
      <OfferingItemContent
        match={match}
        onStatusChange={onStatusChange}
      />
    </div>
  );
}

// --- Main card ---

export function OfferingsMappingCard({
  data,
  onStatusChange,
  onReorder,
  meetingContext,
  onPitchGenerated,
}: OfferingsMappingCardProps) {
  const [selectedOffering, setSelectedOffering] = useState<OfferingMatch | null>(null);
  const sorted = sortOfferings(data);

  const draggableItems = sorted.filter((m) => m.status !== "rejected");
  const rejectedItems = sorted.filter((m) => m.status === "rejected");

  const acceptedCount = data.filter((m) => m.status === "accepted").length;
  const totalCount = data.length;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = draggableItems.findIndex((m) => m.id === active.id);
    const newIndex = draggableItems.findIndex((m) => m.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(draggableItems, oldIndex, newIndex).map((m, i) => ({
      ...m,
      order: i,
    }));

    const rejectedWithOrder = rejectedItems.map((m, i) => ({
      ...m,
      order: reordered.length + i,
    }));

    onReorder([...reordered, ...rejectedWithOrder]);
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-lg">
              <Puzzle className="h-5 w-5 text-cgi-red" />
              Mapping Enjeux → Offres CGI
            </span>
            {totalCount > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {acceptedCount > 0
                  ? `${acceptedCount} retenue${acceptedCount > 1 ? "s" : ""} / ${totalCount}`
                  : `${totalCount} offre${totalCount > 1 ? "s" : ""}`}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sorted.length === 0 ? (
            <p className="text-sm text-cgi-gray-500">
              Aucun mapping identifié pour le moment.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {onReorder ? (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={draggableItems.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex flex-col gap-3">
                      {draggableItems.map((match) => (
                        <SortableOfferingItem
                          key={match.id}
                          match={match}
                          onSelect={setSelectedOffering}
                          onStatusChange={onStatusChange}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                draggableItems.map((match) => (
                  <StaticOfferingItem
                    key={match.id}
                    match={match}
                    onSelect={setSelectedOffering}
                    onStatusChange={onStatusChange}
                  />
                ))
              )}

              {rejectedItems.map((match) => (
                <StaticOfferingItem
                  key={match.id}
                  match={match}
                  onSelect={setSelectedOffering}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <OfferingDetailSheet
        match={selectedOffering}
        open={selectedOffering !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedOffering(null);
        }}
        onStatusChange={onStatusChange}
        meetingContext={meetingContext}
        onPitchGenerated={onPitchGenerated}
      />
    </>
  );
}

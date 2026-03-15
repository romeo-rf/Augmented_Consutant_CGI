"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import type { SmartQuestion } from "@/lib/brief/types";
import { useBriefStore } from "@/store/brief-store";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  GripVertical,
  MessageCircleQuestion,
  Plus,
  Star,
  Target,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface QuestionsCardProps {
  data: SmartQuestion[];
}

const phases: SmartQuestion["phase"][] = [
  "ouverture",
  "decouverte",
  "approfondissement",
  "conclusion",
];

const phaseConfig: Record<
  SmartQuestion["phase"],
  { label: string; description: string; color: string; border: string; bg: string; dot: string }
> = {
  ouverture: {
    label: "Ouverture",
    description: "Briser la glace et poser le cadre",
    color: "bg-blue-100 text-blue-700",
    border: "border-l-blue-500",
    bg: "bg-blue-50/50",
    dot: "bg-blue-500",
  },
  decouverte: {
    label: "Decouverte",
    description: "Explorer les besoins et enjeux du client",
    color: "bg-violet-100 text-violet-700",
    border: "border-l-violet-500",
    bg: "bg-violet-50/50",
    dot: "bg-violet-500",
  },
  approfondissement: {
    label: "Approfondissement",
    description: "Creuser les sujets cles et qualifier les opportunites",
    color: "bg-amber-100 text-amber-700",
    border: "border-l-amber-500",
    bg: "bg-amber-50/50",
    dot: "bg-amber-500",
  },
  conclusion: {
    label: "Conclusion",
    description: "Synthetiser et definir les prochaines etapes",
    color: "bg-emerald-100 text-emerald-700",
    border: "border-l-emerald-500",
    bg: "bg-emerald-50/50",
    dot: "bg-emerald-500",
  },
};

export function QuestionsCard({ data }: QuestionsCardProps) {
  const { deleteQuestion, toggleQuestionPriority, addQuestion, updateQuestionOrder } = useBriefStore();
  const sorted = [...data].sort((a, b) => a.order - b.order);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(phases)
  );
  const [addingToPhase, setAddingToPhase] = useState<SmartQuestion["phase"] | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // Grouper par phase
  const grouped = phases.reduce(
    (acc, phase) => {
      acc[phase] = sorted.filter((q) => q.phase === phase);
      return acc;
    },
    {} as Record<SmartQuestion["phase"], SmartQuestion[]>
  );

  const totalQuestions = sorted.length;
  const activeQuestion = activeId ? sorted.find((q) => q.id === activeId) : null;

  function togglePhase(phase: string) {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phase)) next.delete(phase);
      else next.add(phase);
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeQ = sorted.find((q) => q.id === active.id);
    const overQ = sorted.find((q) => q.id === over.id);
    if (!activeQ || !overQ) return;

    // Si changement de phase
    const newPhase = overQ.phase;
    const phaseQuestions = grouped[newPhase];
    let updated: SmartQuestion[];

    if (activeQ.phase === newPhase) {
      // Même phase : réordonner
      const oldIndex = phaseQuestions.findIndex((q) => q.id === active.id);
      const newIndex = phaseQuestions.findIndex((q) => q.id === over.id);
      const reordered = arrayMove(phaseQuestions, oldIndex, newIndex).map((q, i) => ({
        ...q,
        order: i,
      }));
      updated = sorted.map((q) => {
        const moved = reordered.find((r) => r.id === q.id);
        return moved ?? q;
      });
    } else {
      // Phase différente : changer la phase et insérer à la position du over
      const overIndex = phaseQuestions.findIndex((q) => q.id === over.id);
      const movedQuestion = { ...activeQ, phase: newPhase };

      // Retirer de l'ancienne phase
      const withoutActive = sorted.filter((q) => q.id !== active.id);

      // Insérer dans la nouvelle phase à la bonne position
      const targetPhaseQuestions = withoutActive.filter((q) => q.phase === newPhase);
      targetPhaseQuestions.splice(overIndex, 0, movedQuestion);

      // Recalculer les ordres pour la nouvelle phase
      const reorderedTarget = targetPhaseQuestions.map((q, i) => ({ ...q, order: i }));

      updated = withoutActive.map((q) => {
        const moved = reorderedTarget.find((r) => r.id === q.id);
        return moved ?? q;
      });
      // Ajouter la question déplacée
      const finalMoved = reorderedTarget.find((r) => r.id === active.id);
      if (finalMoved) updated.push(finalMoved);
    }

    updateQuestionOrder(updated);
  }

  function handleAddQuestion(phase: SmartQuestion["phase"], questionText: string, intentText: string) {
    const phaseQuestions = grouped[phase];
    const maxOrder = phaseQuestions.length > 0
      ? Math.max(...phaseQuestions.map((q) => q.order))
      : -1;

    addQuestion({
      id: nanoid(),
      phase,
      question: questionText,
      intent: intentText || "Question ajoutee par le consultant",
      order: maxOrder + 1,
      isCustom: true,
    });
    setAddingToPhase(null);
  }

  // Pré-calculer le startIndex de chaque phase (nombre cumulé de questions des phases précédentes)
  const phaseStartIndex: Record<string, number> = {};
  let cumulative = 0;
  for (const phase of phases) {
    phaseStartIndex[phase] = cumulative;
    cumulative += grouped[phase].length;
  }

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        Aucune question generee pour le moment.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* En-tete */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5 text-cgi-red" />
          <h3 className="font-semibold text-lg">Trame de questions</h3>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          {totalQuestions} questions
        </Badge>
      </div>

      {/* Phases en timeline avec drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {phases.map((phase, phaseIdx) => {
            const questions = grouped[phase];
            if (questions.length === 0 && addingToPhase !== phase) return null;

            const config = phaseConfig[phase];
            const isExpanded = expandedPhases.has(phase);
            const startIndex = phaseStartIndex[phase];

            return (
              <div key={phase} className="relative">
                {/* Ligne de connexion entre phases */}
                {phaseIdx < phases.length - 1 && (grouped[phases[phaseIdx + 1]]?.length > 0) && (
                  <div className="absolute left-[11px] top-[40px] bottom-[-12px] w-0.5 bg-cgi-gray-200" />
                )}

                {/* Header de phase cliquable */}
                <button
                  onClick={() => togglePhase(phase)}
                  className="flex items-center gap-3 w-full text-left group"
                >
                  <div className={`h-6 w-6 rounded-full ${config.dot} flex items-center justify-center shrink-0 z-10`}>
                    <span className="text-[10px] font-bold text-white">
                      {phaseIdx + 1}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Badge className={`${config.color} text-xs`}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {questions.length} question{questions.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-cgi-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-cgi-gray-400" />
                  )}
                </button>

                {/* Description de la phase */}
                {isExpanded && (
                  <p className="text-[11px] text-muted-foreground ml-9 mt-1 mb-2">
                    {config.description}
                  </p>
                )}

                {/* Questions de la phase (sortable) */}
                {isExpanded && (
                  <div className="ml-9 space-y-2 mt-2">
                    <SortableContext
                      items={questions.map((q) => q.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {questions.map((q, idx) => (
                        <SortableQuestionItem
                          key={q.id}
                          question={q}
                          number={startIndex + idx + 1}
                          phaseConfig={config}
                          onDelete={() => deleteQuestion(q.id)}
                          onTogglePriority={() => toggleQuestionPriority(q.id)}
                        />
                      ))}
                    </SortableContext>

                    {/* Bouton ajouter une question */}
                    {addingToPhase === phase ? (
                      <AddQuestionForm
                        phase={phase}
                        onSubmit={handleAddQuestion}
                        onCancel={() => setAddingToPhase(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingToPhase(phase)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5 px-2 rounded hover:bg-cgi-gray-50 w-full"
                      >
                        <Plus className="h-3 w-3" />
                        Ajouter une question
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeQuestion ? (
            <div className="rounded-lg border border-l-[3px] border-l-cgi-red p-3 bg-white shadow-lg opacity-90">
              <p className="text-sm font-medium">{activeQuestion.question}</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

/* ─── Sortable Question Item ─── */

function SortableQuestionItem({
  question,
  number,
  phaseConfig,
  onDelete,
  onTogglePriority,
}: {
  question: SmartQuestion;
  number: number;
  phaseConfig: { border: string; bg: string };
  onDelete: () => void;
  onTogglePriority: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(question.question).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg border border-l-[3px] ${phaseConfig.border} p-3 transition-colors ${
        question.priority ? "bg-amber-50/60 ring-1 ring-amber-200" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Handle de drag */}
        <button
          className="mt-0.5 cursor-grab active:cursor-grabbing text-cgi-gray-300 hover:text-cgi-gray-500 shrink-0 touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Étoile priorité */}
        <button
          onClick={onTogglePriority}
          className="mt-0.5 shrink-0"
          title={question.priority ? "Retirer la priorite" : "Marquer comme prioritaire"}
        >
          <Star
            className={`h-3.5 w-3.5 transition-colors ${
              question.priority
                ? "fill-amber-400 text-amber-400"
                : "text-cgi-gray-300 hover:text-amber-400"
            }`}
          />
        </button>

        {/* Numero */}
        <span className="text-xs font-mono text-muted-foreground mt-0.5 shrink-0 w-5 text-right">
          {number}.
        </span>

        <div className="flex-1 min-w-0">
          {/* Question */}
          <div className="flex items-start gap-1">
            <p className={`text-sm leading-relaxed ${question.priority ? "font-semibold" : "font-medium"}`}>
              {question.question}
            </p>
            {question.isCustom && (
              <Badge variant="outline" className="text-[9px] px-1 py-0 shrink-0 ml-1 gap-0.5 border-violet-300 text-violet-600">
                <User className="h-2.5 w-2.5" />
                Perso
              </Badge>
            )}
          </div>

          {/* Objectif */}
          <div className="flex items-start gap-1.5 mt-2">
            <Target className="h-3 w-3 text-cgi-red/60 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {question.intent}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={handleCopy}
            className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-cgi-gray-100"
            title="Copier la question"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5 text-cgi-gray-400" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1.5 rounded hover:bg-red-50 hover:text-red-500"
            title="Supprimer la question"
          >
            <Trash2 className="h-3.5 w-3.5 text-cgi-gray-400 hover:text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Add Question Form ─── */

function AddQuestionForm({
  phase,
  onSubmit,
  onCancel,
}: {
  phase: SmartQuestion["phase"];
  onSubmit: (phase: SmartQuestion["phase"], question: string, intent: string) => void;
  onCancel: () => void;
}) {
  const [questionText, setQuestionText] = useState("");
  const [intentText, setIntentText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText.trim()) return;
    onSubmit(phase, questionText.trim(), intentText.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-dashed border-violet-300 p-3 space-y-2 bg-violet-50/30">
      <input
        type="text"
        value={questionText}
        onChange={(e) => setQuestionText(e.target.value)}
        placeholder="Votre question..."
        className="w-full text-sm px-2 py-1.5 rounded border border-cgi-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
        autoFocus
      />
      <input
        type="text"
        value={intentText}
        onChange={(e) => setIntentText(e.target.value)}
        placeholder="Pourquoi poser cette question ? (optionnel)"
        className="w-full text-xs px-2 py-1.5 rounded border border-cgi-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!questionText.trim()}
          className="text-xs px-3 py-1 rounded bg-cgi-red text-white hover:bg-cgi-red/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1 rounded hover:bg-cgi-gray-100 text-muted-foreground transition-colors"
        >
          <X className="h-3 w-3 inline mr-1" />
          Annuler
        </button>
      </div>
    </form>
  );
}

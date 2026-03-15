"use client";

import { useState, useMemo } from "react";
import type { OfferingMatch } from "@/lib/brief/types";
import type { CgiOffering } from "@/lib/catalog/loader";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, ArrowLeft } from "lucide-react";

interface AddOfferingDialogProps {
  catalog: CgiOffering[];
  existingOfferingIds: string[];
  onAdd: (match: OfferingMatch) => void;
}

export function AddOfferingDialog({
  catalog,
  existingOfferingIds,
  onAdd,
}: AddOfferingDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CgiOffering | null>(null);
  const [issueName, setIssueName] = useState("");
  const [issueDescription, setIssueDescription] = useState("");

  const available = useMemo(() => {
    const filtered = catalog.filter(
      (o) => !existingOfferingIds.includes(o.id)
    );
    if (!search.trim()) return filtered;

    const terms = search.toLowerCase().split(/\s+/);
    return filtered.filter((o) => {
      const searchable = [o.name, o.description, ...o.keywords, ...o.targetSectors]
        .join(" ")
        .toLowerCase();
      return terms.some((term) => searchable.includes(term));
    });
  }, [catalog, existingOfferingIds, search]);

  function handleAdd() {
    if (!selected || !issueName.trim()) return;

    const match: OfferingMatch = {
      id: `manual-${Date.now()}`,
      issueName: issueName.trim(),
      issueDescription: issueDescription.trim() || issueName.trim(),
      offering: { id: selected.id, name: selected.name },
      reasoning: "Ajouté manuellement par le consultant.",
      relevanceScore: 100,
      status: "accepted",
      order: Date.now(), // sera trié après les existants
      isManual: true,
      catalogDetail: selected,
    };

    onAdd(match);
    resetAndClose();
  }

  function resetAndClose() {
    setSearch("");
    setSelected(null);
    setIssueName("");
    setIssueDescription("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full mt-3">
          <Plus className="h-4 w-4 mr-1" />
          Ajouter une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {selected ? (
              <button
                onClick={() => setSelected(null)}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
            ) : (
              "Ajouter une offre CGI"
            )}
          </DialogTitle>
          <DialogDescription>
            {selected
              ? `Décrivez l'enjeu client pour "${selected.name}"`
              : "Sélectionnez une offre du catalogue CGI"}
          </DialogDescription>
        </DialogHeader>

        {!selected ? (
          /* Étape 1 : Sélection de l'offre */
          <div className="flex flex-col gap-3 flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une offre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh]">
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {existingOfferingIds.length === catalog.length
                    ? "Toutes les offres du catalogue sont déjà dans le mapping."
                    : "Aucune offre ne correspond à votre recherche."}
                </p>
              ) : (
                available.map((offering) => (
                  <button
                    key={offering.id}
                    onClick={() => setSelected(offering)}
                    className="w-full text-left border rounded-lg p-3 hover:bg-accent transition-colors"
                  >
                    <p className="text-sm font-medium">{offering.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {offering.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {offering.targetSectors.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                      {offering.targetSectors.length > 4 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{offering.targetSectors.length - 4}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Étape 2 : Saisie de l'enjeu client */
          <div className="space-y-4">
            <div className="rounded-lg bg-accent/50 p-3">
              <p className="text-sm font-medium">{selected.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selected.valueProposition}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="issue-name" className="text-sm font-medium">
                Enjeu client *
              </label>
              <Input
                id="issue-name"
                placeholder="Ex : Modernisation du SI legacy"
                value={issueName}
                onChange={(e) => setIssueName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="issue-desc" className="text-sm font-medium">
                Description (optionnel)
              </label>
              <Textarea
                id="issue-desc"
                placeholder="Contexte supplémentaire sur cet enjeu..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleAdd}
              disabled={!issueName.trim()}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-1" />
              Ajouter au mapping
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

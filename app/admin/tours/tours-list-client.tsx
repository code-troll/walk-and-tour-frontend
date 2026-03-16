"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { components } from "@/lib/api/generated/backend-types";
import { GripVertical, LoaderCircle, Pencil, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { AdminSectionCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { reorderTourAction } from "./actions";

type ApiTour = components["schemas"]["TourAdminResponseDto"];
type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type DropPlacement = "before" | "after";

type AdminToursListClientProps = {
  initialLanguages: ApiLanguage[];
  initialTours: ApiTour[];
};

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const moveItem = <T,>(items: T[], fromIndex: number, toIndex: number) => {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);

  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
};

export function AdminToursListClient({
  initialLanguages,
  initialTours,
}: AdminToursListClientProps) {
  const [tours, setTours] = useState<ApiTour[]>(initialTours);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [draggedTourId, setDraggedTourId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    placement: DropPlacement;
    tourId: string;
  } | null>(null);

  const languageNameByCode = useMemo(
    () => Object.fromEntries(initialLanguages.map((language) => [language.code, language.name])),
    [initialLanguages],
  );

  const applyReorder = async ({
    sourceTourId,
    destinationIndex,
  }: {
    sourceTourId: string;
    destinationIndex: number;
  }) => {
    const sourceIndex = tours.findIndex((tour) => tour.id === sourceTourId);
    if (sourceIndex === -1 || sourceIndex === destinationIndex) {
      return;
    }

    const previousTours = tours;
    const optimisticTours = moveItem(tours, sourceIndex, destinationIndex);

    setTours(optimisticTours);
    setIsReordering(true);
    setReorderError(null);

    try {
      const result = await reorderTourAction({
        id: sourceTourId,
        sortOrder: destinationIndex,
      });

      if (!result.ok) {
        setTours(previousTours);
        setReorderError(result.message);
        return;
      }

      setTours(result.tours);
    } catch (error) {
      setTours(previousTours);
      setReorderError(error instanceof Error ? error.message : "Unable to reorder the tours.");
    } finally {
      setIsReordering(false);
    }
  };

  const moveTourByOffset = async ({
    offset,
    tourId,
  }: {
    offset: -1 | 1;
    tourId: string;
  }) => {
    const currentIndex = tours.findIndex((tour) => tour.id === tourId);
    if (currentIndex === -1) {
      return;
    }

    const destinationIndex = currentIndex + offset;
    if (destinationIndex < 0 || destinationIndex >= tours.length) {
      return;
    }

    await applyReorder({
      sourceTourId: tourId,
      destinationIndex,
    });
  };

  const handleDrop = async ({
    placement,
    targetTourId,
  }: {
    placement: DropPlacement;
    targetTourId: string;
  }) => {
    if (!draggedTourId || draggedTourId === targetTourId) {
      return;
    }

    const sourceIndex = tours.findIndex((tour) => tour.id === draggedTourId);
    const targetIndex = tours.findIndex((tour) => tour.id === targetTourId);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    let destinationIndex = placement === "before" ? targetIndex : targetIndex + 1;
    if (sourceIndex < destinationIndex) {
      destinationIndex -= 1;
    }

    if (destinationIndex === sourceIndex) {
      return;
    }

    await applyReorder({
      sourceTourId: draggedTourId,
      destinationIndex,
    });
  };

  return (
    <AdminSectionCard
      title="Tours"
      description="Create, edit, validate, and manually order tours from the admin list."
      actions={
        <Button asChild>
          <Link href="/tours/new">
            <Plus className="size-4"/>
            Create Tour
          </Link>
        </Button>
      }
    >
      <div className="space-y-4">
        { reorderError ? (
          <div className="rounded-2xl border border-[#e8c7c1] bg-[#fbf2f0] px-4 py-3 text-sm text-[#a3483f]">
            { reorderError }
          </div>
        ) : null }

        { tours.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
            <p>No tours have been created yet.</p>
            <Button asChild className="mt-4">
              <Link href="/tours/new">
                <Plus className="size-4"/>
                Create your first tour
              </Link>
            </Button>
          </div>
        ) : (
          tours.map((tour, index) => {
            const showDropBefore =
              dropIndicator?.tourId === tour.id && dropIndicator.placement === "before";
            const showDropAfter =
              dropIndicator?.tourId === tour.id && dropIndicator.placement === "after";

            return (
              <article
                key={ tour.id }
                onDragOver={ (event) => {
                  if (!draggedTourId || isReordering) {
                    return;
                  }

                  event.preventDefault();
                  const bounds = event.currentTarget.getBoundingClientRect();
                  const placement =
                    event.clientY - bounds.top < bounds.height / 2 ? "before" : "after";

                  setDropIndicator({
                    placement,
                    tourId: tour.id,
                  });
                } }
                onDragLeave={ () => {
                  setDropIndicator((currentIndicator) =>
                    currentIndicator?.tourId === tour.id ? null : currentIndicator,
                  );
                } }
                onDrop={ async (event) => {
                  event.preventDefault();
                  const activeIndicator =
                    dropIndicator?.tourId === tour.id
                      ? dropIndicator
                      : {
                        placement: "after" as const,
                        tourId: tour.id,
                      };

                  setDropIndicator(null);
                  await handleDrop({
                    placement: activeIndicator.placement,
                    targetTourId: activeIndicator.tourId,
                  });
                  setDraggedTourId(null);
                } }
                className={ cn(
                  "rounded-2xl border border-[#f0e6d8] bg-white p-5 transition-shadow",
                  showDropBefore && "shadow-[inset_0_4px_0_0_#9a6a2f]",
                  showDropAfter && "shadow-[inset_0_-4px_0_0_#9a6a2f]",
                  draggedTourId === tour.id && "opacity-70",
                ) }
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      draggable={ !isReordering }
                      onDragStart={ (event) => {
                        setDraggedTourId(tour.id);
                        setReorderError(null);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData("text/plain", tour.id);
                      } }
                      onDragEnd={ () => {
                        setDraggedTourId(null);
                        setDropIndicator(null);
                      } }
                      className={ cn(
                        "mt-0.5 flex shrink-0 cursor-grab rounded-xl border border-[#eadfce] bg-[#fbf7f0] p-2 text-[#8b7862]",
                        isReordering && "cursor-not-allowed opacity-50",
                      ) }
                      aria-label={ `Drag to reorder ${ tour.name }` }
                    >
                      <GripVertical className="size-4"/>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[#f4ede3] px-2.5 py-1 text-xs font-semibold text-[#6a5743]">
                          Position { index + 1 }
                        </span>
                        { isReordering ? (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <LoaderCircle className="size-3 animate-spin"/>
                            Saving order
                          </span>
                        ) : null }
                      </div>
                      <h2 className="mt-2 truncate text-base font-semibold text-foreground">{ tour.name }</h2>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="truncate">Slug: { tour.slug }</span>
                        <span>Type: { formatLabel(tour.tourType) }</span>
                        <span>
                          Duration: { typeof tour.durationMinutes === "number"
                            ? `${ tour.durationMinutes } min`
                            : "Not set" }
                        </span>
                        <span>{ Object.keys(tour.translations).length } translations</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => {
                        void moveTourByOffset({ offset: -1, tourId: tour.id });
                      } }
                      disabled={ index === 0 || isReordering }
                    >
                      <ArrowUp className="size-4"/>
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={ () => {
                        void moveTourByOffset({ offset: 1, tourId: tour.id });
                      } }
                      disabled={ index === tours.length - 1 || isReordering }
                    >
                      <ArrowDown className="size-4"/>
                      Down
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={ `/tours/${ tour.id }` }>
                        <Pencil className="size-4"/>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  { tour.translationAvailability.map((availability) => (
                    <span
                      key={ availability.languageCode }
                      className="rounded-full border border-[#eadfce] px-3 py-1 text-xs text-muted-foreground"
                    >
                      { languageNameByCode[availability.languageCode] ?? availability.languageCode }
                      { ": " }
                      { availability.isPublished ? "Published" : "Not Published" }
                    </span>
                  )) }
                </div>
              </article>
            );
          })
        ) }
      </div>
    </AdminSectionCard>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { reorder } from "@atlaskit/pragmatic-drag-and-drop/reorder";
import type { components } from "@/lib/api/generated/backend-types";
import { GripVertical, LoaderCircle, Pencil, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { AdminProgressLink, useAdminRouteLoadingBoundary } from "@/components/admin/AdminRouteProgress";
import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { getAdminLanguagesClient, getAdminToursClient } from "@/lib/admin/admin-client";
import { cn } from "@/lib/utils";
import { reorderTourAction } from "./actions";

type ApiTour = components["schemas"]["TourAdminListResponseDto"];
type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiTourTranslation = components["schemas"]["TourAdminListTranslationResponseDto"];
type DropPlacement = "before" | "after";

type AdminToursListClientProps = {
  initialLanguages?: ApiLanguage[];
  initialTours?: ApiTour[];
};

type TourRowDragData = {
  index: number;
  tourId: string;
  type: "tour-row";
};

type TourRowDropData = TourRowDragData & {
  placement: DropPlacement;
};

type TourListRowProps = {
  dropPlacement: DropPlacement | null;
  index: number;
  isDragged: boolean;
  isDropTarget: boolean;
  isLast: boolean;
  isReordering: boolean;
  languageNameByCode: Record<string, string>;
  onDropIndicatorChange: (nextValue: { placement: DropPlacement; tourId: string } | null) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  tour: ApiTour;
};

const AUTO_SCROLL_EDGE_PX = 216;
const AUTO_SCROLL_MAX_STEP_PX = 24;
const AUTO_SCROLL_SPEED_CURVE_EXPONENT = 0.8;

const formatLabel = (value: string) =>
  value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());

const getTranslationBadgeTone = (translation: ApiTourTranslation) => {
  if (translation.isReady && translation.isPublished) {
    return "border-[#cfe4d3] bg-[#f3fbf4] text-[#2f6b3f]";
  }

  if (translation.isReady) {
    return "border-[#e3d5b4] bg-[#fbf7ea] text-[#8a6029]";
  }

  return "border-[#e8c7c1] bg-[#fbf2f0] text-[#a3483f]";
};

const getTranslationBadgeLabel = (translation: ApiTourTranslation) =>
  translation.isPublished ? "Published" : "Draft";

const getAutoScrollStep = (distanceIntoEdgePx: number) => {
  const normalizedDistance = Math.min(
    1,
    Math.max(0, distanceIntoEdgePx / AUTO_SCROLL_EDGE_PX),
  );

  return Math.max(
    1,
    Math.round(AUTO_SCROLL_MAX_STEP_PX * normalizedDistance ** AUTO_SCROLL_SPEED_CURVE_EXPONENT),
  );
};

const isTourRowDragData = (value: Record<string | symbol, unknown>): value is TourRowDragData =>
  value.type === "tour-row" &&
  typeof value.tourId === "string" &&
  typeof value.index === "number";

const isTourRowDropData = (value: Record<string | symbol, unknown>): value is TourRowDropData => {
  if (!isTourRowDragData(value)) {
    return false;
  }

  const placement = (value as Record<string, unknown>).placement;
  return placement === "before" || placement === "after";
};

const getPlacementFromInput = ({
                                 clientY,
                                 element,
                               }: {
  clientY: number;
  element: Element;
}): DropPlacement => {
  const bounds = element.getBoundingClientRect();
  return clientY - bounds.top < bounds.height / 2 ? "before" : "after";
};

function TourListRow({
                       dropPlacement,
                       index,
                       isDragged,
                       isDropTarget,
                       isLast,
                       isReordering,
                       languageNameByCode,
                       onDropIndicatorChange,
                       onMoveDown,
                       onMoveUp,
                       tour,
                     }: TourListRowProps) {
  const rowRef = useRef<HTMLElement | null>(null);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const dropTargetHighlightClass = !isDropTarget
    ? null
    : dropPlacement === "before"
      ? "border-[#d5b588] bg-[#fcf4e6] shadow-[inset_0_4px_0_0_#9a6a2f,0_0_0_1px_rgba(154,106,47,0.08),0_16px_32px_rgba(42,36,25,0.08)]"
      : "border-[#d5b588] bg-[#fcf4e6] shadow-[inset_0_-4px_0_0_#9a6a2f,0_0_0_1px_rgba(154,106,47,0.08),0_16px_32px_rgba(42,36,25,0.08)]";

  useEffect(() => {
    const rowElement = rowRef.current;
    const dragHandleElement = dragHandleRef.current;

    if (!rowElement || !dragHandleElement) {
      return;
    }

    return combine(
      draggable({
        element: rowElement,
        dragHandle: dragHandleElement,
        canDrag: () => !isReordering,
        getInitialData: () => ({
          index,
          tourId: tour.id,
          type: "tour-row",
        }),
      }),
      dropTargetForElements({
        element: rowElement,
        canDrop: ({source}) => isTourRowDragData(source.data) && !isReordering,
        getData: ({input}) => ({
          index,
          placement: getPlacementFromInput({
            clientY: input.clientY,
            element: rowElement,
          }),
          tourId: tour.id,
          type: "tour-row",
        }),
        onDragEnter: ({self}) => {
          if (!isTourRowDropData(self.data)) {
            return;
          }

          onDropIndicatorChange({
            placement: self.data.placement,
            tourId: self.data.tourId,
          });
        },
        onDrag: ({self}) => {
          if (!isTourRowDropData(self.data)) {
            return;
          }

          onDropIndicatorChange({
            placement: self.data.placement,
            tourId: self.data.tourId,
          });
        },
        onDragLeave: () => {
          onDropIndicatorChange(null);
        },
      }),
    );
  }, [index, isReordering, onDropIndicatorChange, tour.id]);

  return (
    <article
      ref={ rowRef }
      className={ cn(
        "rounded-2xl border border-[#f0e6d8] bg-white p-5 transition-[background-color,border-color,box-shadow,opacity] duration-150",
        dropTargetHighlightClass,
        isDragged && "opacity-70",
      ) }
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div
            ref={ dragHandleRef }
            className={ cn(
              "mt-0.5 flex shrink-0 cursor-grab rounded-xl hover:bg-[#fbf7f0] p-2 text-[#8b7862]",
              isReordering && "cursor-not-allowed opacity-50",
            ) }
            aria-label={ `Drag to reorder ${ tour.name }` }
          >
            <GripVertical className="size-4"/>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 justify-between lg:flex-nowrap">
              <div className="flex flex-wrap">
                <h2 className="truncate text-wrap text-base font-semibold text-foreground">{ tour.name }</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex mb-1 md:mb-0 flex-wrap items-center gap-2">
                  <span
                    className="relative inline-flex size-6 items-center justify-center rounded-full bg-[#f4ede3] text-xs font-semibold text-[#6a5743]">
                    <span className="absolute inset-0 flex items-center justify-center">
                      { index + 1 }
                    </span>
                    { isReordering && <LoaderCircle className="absolute inset-0 m-auto size-6 animate-spin"/> }
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={ onMoveUp }
                  disabled={ index === 0 || isReordering }
                >
                  <ArrowUp className="size-4"/>
                  Up
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={ onMoveDown }
                  disabled={ isLast || isReordering }
                >
                  <ArrowDown className="size-4"/>
                  Down
                </Button>
                <Button asChild variant="outline" size="sm">
                  <AdminProgressLink href={ `/tours/${ tour.id }` }>
                    <Pencil className="size-4"/>
                    Edit
                  </AdminProgressLink>
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="truncate">Slug: { tour.slug }</span>
              <span>Type: { formatLabel(tour.tourType) }</span>
              <span>Sort order: { tour.sortOrder + 1 }</span>
              <span>{ Object.keys(tour.translations).length } translations</span>
              <span>Updated: { new Date(tour.audit.updatedAt).toLocaleDateString("en-US") }</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        { Object.entries(tour.translations).map(([languageCode, translation]) => (
          <span
            key={ languageCode }
            className={ cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              getTranslationBadgeTone(translation),
            ) }
          >
            { languageNameByCode[languageCode] ?? languageCode }
            { ": " }
            { getTranslationBadgeLabel(translation) }
          </span>
        )) }
      </div>
    </article>
  );
}

export function AdminToursListClient({
                                       initialLanguages = [],
                                       initialTours = [],
                                     }: AdminToursListClientProps) {
  const [tours, setTours] = useState<ApiTour[]>(initialTours);
  const [languages, setLanguages] = useState<ApiLanguage[]>(initialLanguages);
  const [isInitialLoading, setIsInitialLoading] = useState(
    initialLanguages.length === 0 && initialTours.length === 0,
  );
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [draggedTourId, setDraggedTourId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    placement: DropPlacement;
    tourId: string;
  } | null>(null);
  const dragPointerYRef = useRef<number | null>(null);
  const autoScrollFrameRef = useRef<number | null>(null);
  const toursRef = useRef<ApiTour[]>(initialTours);

  useAdminRouteLoadingBoundary(isInitialLoading);

  useEffect(() => {
    toursRef.current = tours;
  }, [tours]);

  const languageNameByCode = useMemo(
    () => Object.fromEntries(languages.map((language) => [language.code, language.name])),
    [languages],
  );

  const loadToursWorkspace = async () => {
    setIsInitialLoading(true);
    setInitialLoadError(null);

    try {
      const [nextTours, nextLanguages] = await Promise.all([
        getAdminToursClient(),
        getAdminLanguagesClient(),
      ]);

      setTours(nextTours);
      setLanguages(nextLanguages);
    } catch (error) {
      setInitialLoadError(error instanceof Error ? error.message : "Unable to load tours.");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (initialLanguages.length > 0 || initialTours.length > 0) {
      setIsInitialLoading(false);
      return;
    }

    void loadToursWorkspace();
  }, [initialLanguages.length, initialTours.length]);

  const resetDragState = () => {
    dragPointerYRef.current = null;
    setDraggedTourId(null);
    setDropIndicator(null);
  };

  useEffect(() => {
    if (!draggedTourId || isReordering) {
      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const pointerY = dragPointerYRef.current;

      if (pointerY !== null) {
        const viewportHeight = window.innerHeight;
        const maxScrollTop = document.documentElement.scrollHeight - viewportHeight;
        const currentScrollTop = window.scrollY;

        if (pointerY < AUTO_SCROLL_EDGE_PX && currentScrollTop > 0) {
          window.scrollBy({
            top: -getAutoScrollStep(AUTO_SCROLL_EDGE_PX - pointerY),
          });
        } else if (
          pointerY > viewportHeight - AUTO_SCROLL_EDGE_PX &&
          currentScrollTop < maxScrollTop
        ) {
          window.scrollBy({
            top: getAutoScrollStep(pointerY - (viewportHeight - AUTO_SCROLL_EDGE_PX)),
          });
        }
      }

      autoScrollFrameRef.current = window.requestAnimationFrame(tick);
    };

    autoScrollFrameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (autoScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(autoScrollFrameRef.current);
        autoScrollFrameRef.current = null;
      }
    };
  }, [draggedTourId, isReordering]);

  useEffect(() => {
    if (!draggedTourId || isReordering) {
      return;
    }

    const handleDragOver = (event: DragEvent) => {
      dragPointerYRef.current = event.clientY;
    };

    document.addEventListener("dragover", handleDragOver);

    return () => {
      document.removeEventListener("dragover", handleDragOver);
    };
  }, [draggedTourId, isReordering]);

  const applyReorder = async ({
                                destinationIndex,
                                sourceTourId,
                              }: {
    destinationIndex: number;
    sourceTourId: string;
  }) => {
    const currentTours = toursRef.current;
    const sourceIndex = currentTours.findIndex((tour) => tour.id === sourceTourId);
    if (sourceIndex === -1 || sourceIndex === destinationIndex) {
      return;
    }

    const previousTours = currentTours;
    const optimisticTours = reorder({
      list: currentTours,
      startIndex: sourceIndex,
      finishIndex: destinationIndex,
    });

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
      destinationIndex,
      sourceTourId: tourId,
    });
  };

  useEffect(() => {
    return monitorForElements({
      canMonitor: ({source}) => isTourRowDragData(source.data),
      onDragStart: ({source}) => {
        if (!isTourRowDragData(source.data)) {
          return;
        }

        setDraggedTourId(source.data.tourId);
        setReorderError(null);
      },
      onDrop: async ({location, source}) => {
        if (!isTourRowDragData(source.data)) {
          resetDragState();
          return;
        }

        const activeTarget = location.current.dropTargets[0];
        if (!activeTarget || !isTourRowDropData(activeTarget.data)) {
          resetDragState();
          return;
        }

        const currentTours = toursRef.current;
        const sourceIndex = currentTours.findIndex((tour) => tour.id === source.data.tourId);
        const targetIndex = currentTours.findIndex((tour) => tour.id === activeTarget.data.tourId);

        if (sourceIndex === -1 || targetIndex === -1) {
          resetDragState();
          return;
        }

        let destinationIndex =
          activeTarget.data.placement === "before" ? targetIndex : targetIndex + 1;
        if (sourceIndex < destinationIndex) {
          destinationIndex -= 1;
        }

        resetDragState();

        if (destinationIndex === sourceIndex) {
          return;
        }

        await applyReorder({
          destinationIndex,
          sourceTourId: source.data.tourId,
        });
      },
    });
  }, [isReordering, tours]);

  if (isInitialLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the tours workspace."
        description="Resolving tours and language metadata."
      />
    );
  }

  if (initialLoadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The tours workspace could not be loaded."
        description={initialLoadError}
        actions={
          <button
            type="button"
            onClick={() => void loadToursWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <AdminSectionCard
      title="Tours"
      description="Create, edit, validate, and manually order tours from the admin list."
      actions={
        <Button asChild>
          <AdminProgressLink href="/tours/new">
            <Plus className="size-4"/>
            Create Tour
          </AdminProgressLink>
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
              <AdminProgressLink href="/tours/new">
                <Plus className="size-4"/>
                Create your first tour
              </AdminProgressLink>
            </Button>
          </div>
        ) : (
          tours.map((tour, index) => {
            const isDropTarget = dropIndicator?.tourId === tour.id && draggedTourId !== tour.id;

            return (
              <div
                key={ tour.id }
                className="rounded-2xl"
              >
                <TourListRow
                  dropPlacement={ isDropTarget ? dropIndicator?.placement ?? null : null }
                  index={ index }
                  isDragged={ draggedTourId === tour.id }
                  isDropTarget={ isDropTarget }
                  isLast={ index === tours.length - 1 }
                  isReordering={ isReordering }
                  languageNameByCode={ languageNameByCode }
                  onDropIndicatorChange={ setDropIndicator }
                  onMoveDown={ () => {
                    void moveTourByOffset({offset: 1, tourId: tour.id});
                  } }
                  onMoveUp={ () => {
                    void moveTourByOffset({offset: -1, tourId: tour.id});
                  } }
                  tour={ tour }
                />
              </div>
            );
          })
        ) }
      </div>
    </AdminSectionCard>
  );
}

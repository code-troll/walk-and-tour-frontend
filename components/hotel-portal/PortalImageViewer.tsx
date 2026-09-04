"use client";

import {useEffect} from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";

/**
 * One picture, large, over the page.
 *
 * A thumbnail strip is enough to recognise a tour and not enough to show a
 * guest what the walk looks like. Opening the image somewhere else would cost
 * the booking in progress, so it opens over the form instead and closes back
 * onto it.
 *
 * The dialog is the shared one, which brings the overlay, the focus trap and
 * Escape with it. What is added here is moving between pictures without
 * closing: a receptionist turning a page for a guest should not have to aim at
 * a thumbnail between each one.
 *
 * Which picture is showing lives in the caller, not here. Holding a copy and
 * syncing it from the prop in an effect is the shape that renders the old image
 * for a frame after every open, and React flags it for exactly that reason.
 */

type Image = ApiHotelTourDetail["images"][number];

export function PortalImageViewer({
  images,
  onIndexChange,
  /** Null when closed; otherwise the picture showing. */
  index,
  srcFor,
  tourName,
}: {
  images: Image[];
  index: number | null;
  onIndexChange: (index: number | null) => void;
  srcFor: (mediaId: string) => string;
  tourName: string;
}) {
  const total = images.length;
  const image = index === null ? null : images[index];

  // Wraps rather than stopping at the ends: with three pictures, a dead arrow
  // reads as a broken control, not as a boundary.
  const step = (by: number) => {
    if (index !== null) {
      onIndexChange((index + by + total) % total);
    }
  };

  useEffect(() => {
    if (index === null || total < 2) {
      return;
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % total);
      }

      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + total) % total);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [index, onIndexChange, total]);

  if (image === null || index === null) {
    return null;
  }

  const arrow =
    "absolute top-1/2 -translate-y-1/2 rounded-full border border-[var(--wt-rule-strong)] " +
    "bg-[var(--wt-surface)] p-2 text-[var(--wt-ink)] transition hover:bg-[var(--wt-surface-sunk)]";

  return (
    <Dialog onOpenChange={(open) => (open ? null : onIndexChange(null))} open={index !== null}>
      <DialogContent className="sm:max-w-3xl">
        {/* Named for a screen reader; the picture itself is the content. */}
        <DialogTitle className="text-base font-medium text-[var(--wt-ink)]">
          {tourName}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {image.alt ?? `Picture ${index + 1} of ${total}`}
        </DialogDescription>

        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- see PortalTourDetail */}
          <img
            alt={image.alt ?? ""}
            className="max-h-[70vh] w-full rounded-[var(--wt-radius-sm)] object-contain"
            src={srcFor(image.mediaId)}
          />

          {total > 1 ? (
            <>
              <button
                aria-label="Previous picture"
                className={`${arrow} left-2`}
                onClick={() => step(-1)}
                type="button"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                aria-label="Next picture"
                className={`${arrow} right-2`}
                onClick={() => step(1)}
                type="button"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-[var(--wt-ink-muted)]">{image.alt}</p>
          {total > 1 ? (
            <p className="font-mono text-xs text-[var(--wt-ink-muted)]">
              {index + 1} / {total}
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

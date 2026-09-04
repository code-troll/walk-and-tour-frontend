"use client";

import {Search} from "lucide-react";

import {controlClassName} from "@/components/ui/control-class";
import {Label} from "@/components/ui/label";
import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";
import {tourImageUrl} from "@/components/hotel-portal/PortalTourDetail";

/**
 * Finding the tour, before booking it.
 *
 * A guest does not ask for a tour by name. They ask for something near the
 * harbour, or something about the Romans, or something short before dinner —
 * and the answer was a dropdown of names that told a receptionist nothing.
 *
 * The search runs over everything the tour is made of: its name, its tags,
 * every highlight, every itinerary stop, where it starts and ends, and the
 * description itself. All of it is already in the browser, so results appear as
 * the receptionist types, with a guest waiting.
 *
 * Terms are ANDed rather than ORed. Typing two words to narrow a list and
 * getting a longer one back is the behaviour that makes people stop trusting a
 * search box.
 */

/** Accent-insensitive, so "Amalienborg" finds "Amaliënborg" and "Nyhavn" finds "Nyhåvn". */
const normalise = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Everything about a tour that is worth matching against, as one string. */
export const searchableText = (tour: ApiHotelTourDetail) =>
  normalise(
    [
      tour.name,
      tour.title ?? "",
      tour.about ?? "",
      tour.itineraryDescription ?? "",
      tour.startPoint ?? "",
      tour.endPoint ?? "",
      ...(tour.tags ?? []),
      ...(tour.highlights ?? []),
      ...(tour.included ?? []),
      ...(tour.stops ?? []).flatMap((stop) => [stop.title ?? "", stop.description ?? ""]),
    ].join(" "),
  );

export const matchTours = (tours: ApiHotelTourDetail[], query: string) => {
  const terms = normalise(query).split(/\s+/).filter(Boolean);

  if (terms.length === 0) {
    return tours;
  }

  return tours.filter((tour) => {
    const haystack = searchableText(tour);

    return terms.every((term) => haystack.includes(term));
  });
};

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export function PortalTourFinder({
  onSelect,
  onQueryChange,
  query,
  tours,
}: {
  onSelect: (tourId: string) => void;
  onQueryChange: (query: string) => void;
  query: string;
  tours: ApiHotelTourDetail[];
}) {
  const results = matchTours(tours, query);

  return (
    <div>
      <Label htmlFor="tour-search">Find a tour</Label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[var(--wt-ink-muted)]"
        />
        <input
          autoComplete="off"
          className={`${controlClassName} pl-8`}
          id="tour-search"
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="A place, a theme, a landmark — “Nyhavn”, “history”, “Gothic”"
          type="search"
          value={query}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--wt-ink-muted)]">
        Searches the itinerary, the highlights and the tags, not just the name.
      </p>

      {results.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--wt-ink-muted)]">
          Nothing matches “{query}”. Try a single word, or clear the search to see
          every tour your hotel can sell.
        </p>
      ) : (
        <ul className="mt-4">
          {results.map((tour) => {
            const duration = formatDuration(tour.durationMinutes);
            const cover = (tour.images ?? [])[0] ?? null;

            return (
              <li className="border-t border-[var(--wt-rule)]" key={tour.tourId}>
                <button
                  className="flex w-full gap-4 py-4 text-left transition-colors hover:bg-[var(--wt-surface-sunk)]"
                  onClick={() => onSelect(tour.tourId)}
                  type="button"
                >
                  {/*
                    The cover, when there is one. A guest deciding between two
                    walks looks at the picture before the words, and a row that
                    reserved space for an image the tour does not have would
                    leave a grey hole down the whole list instead.
                  */}
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element -- see PortalTourDetail
                    <img
                      alt={cover.alt ?? ""}
                      className="h-20 w-28 shrink-0 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule)] object-cover"
                      loading="lazy"
                      src={tourImageUrl(tour.tourId, cover.mediaId)}
                    />
                  ) : null}

                  <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <span className="text-sm font-medium text-[var(--wt-ink)]">{tour.name}</span>
                    <span className="text-sm text-[var(--wt-ink-muted)]">
                      {tour.priceAmount
                        ? `${tour.priceAmount} ${tour.currency}`
                        : "Price on request"}
                      {duration ? ` · ${duration}` : ""}
                    </span>
                  </span>

                  {tour.highlights && tour.highlights.length > 0 ? (
                    <span className="mt-1 block max-w-2xl text-sm leading-6 text-[var(--wt-ink-muted)]">
                      {tour.highlights.slice(0, 2).join(" · ")}
                    </span>
                  ) : null}

                  {tour.tags && tour.tags.length > 0 ? (
                    <span className="mt-2 flex flex-wrap gap-2">
                      {tour.tags.map((tag) => (
                        <span
                          className="rounded-full border border-[var(--wt-rule-strong)] px-2.5 py-0.5 text-xs text-[var(--wt-ink-muted)]"
                          key={tag}
                        >
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

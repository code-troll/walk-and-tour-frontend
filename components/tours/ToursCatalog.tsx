"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import TourFilters from "@/components/tours/TourFilters";
import TourListingCard from "@/components/tours/TourListingCard";
import {
  TOUR_FILTERS,
  type PublicTourCard,
  type TourFilterId,
} from "@/lib/public-tour-model";

const INITIAL_VISIBLE_TOURS = 6;
const LOAD_MORE_STEP = 3;
const REVEAL_STAGGER_MS = 60;
const REVEAL_RESET_MS = 450;

type ToursCatalogProps = {
  tours: PublicTourCard[];
};

const filterToursByCategories = ({
  categories,
  tours,
}: {
  categories: TourFilterId[];
  tours: PublicTourCard[];
}) => {
  if (categories.length === 0) {
    return tours;
  }

  const selectedTagKeys = TOUR_FILTERS
    .filter((filter) => categories.includes(filter.id))
    .map((filter) => filter.tagKey);

  return tours.filter((tour) => (
    selectedTagKeys.every((tagKey) => tour.tagKeys.includes(tagKey))
  ));
};

export default function ToursCatalog({tours}: ToursCatalogProps) {
  const t = useTranslations("tours");
  const [selectedCategories, setSelectedCategories] = useState<TourFilterId[]>([]);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_TOURS);
  const [newlyRevealedIds, setNewlyRevealedIds] = useState<string[]>([]);

  const toggleCategory = (category: TourFilterId) => {
    const nextSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];

    const revealedIds = filterToursByCategories({
      categories: nextSelectedCategories,
      tours,
    })
      .slice(0, INITIAL_VISIBLE_TOURS)
      .map((tour) => tour.id);

    setSelectedCategories(nextSelectedCategories);
    setVisibleCount(INITIAL_VISIBLE_TOURS);
    setNewlyRevealedIds(revealedIds);
  };

  const filterOptions = useMemo(
    () => TOUR_FILTERS.map((filter) => ({
      id: filter.id,
      label: t(`filters.items.${filter.id}`),
    })),
    [t]
  );

  const filteredTours = useMemo(
    () => filterToursByCategories({
      categories: selectedCategories,
      tours,
    }),
    [selectedCategories, tours]
  );

  const visibleTours = filteredTours.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredTours.length;

  useEffect(() => {
    if (newlyRevealedIds.length === 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setNewlyRevealedIds([]);
    }, REVEAL_RESET_MS);

    return () => window.clearTimeout(timeoutId);
  }, [newlyRevealedIds]);

  const handleLoadMore = () => {
    const nextVisibleCount = Math.min(visibleCount + LOAD_MORE_STEP, filteredTours.length);
    const revealedIds = filteredTours
      .slice(visibleCount, nextVisibleCount)
      .map((tour) => tour.id);

    setVisibleCount(nextVisibleCount);
    setNewlyRevealedIds(revealedIds);
  };

  return (
    <section id="tours" className="bg-[#fcfaf7] py-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <TourFilters
          label={ t("filters.label") }
          options={ filterOptions }
          selectedOptions={ selectedCategories }
          onToggleOption={ toggleCategory }
        />

        <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          { visibleTours.map((tour) => {
            const revealIndex = newlyRevealedIds.indexOf(tour.id);

            return (
              <TourListingCard
                key={ tour.id }
                tour={ tour }
                isNewlyRevealed={ revealIndex !== -1 }
                revealDelayMs={ revealIndex === -1 ? 0 : revealIndex * REVEAL_STAGGER_MS }
              />
            );
          }) }
        </div>

        { visibleTours.length === 0 ? (
          <p className="mt-8 text-center text-sm font-medium text-[#8a7562]">
            { t("noResults") }
          </p>
        ) : null }

        { canLoadMore ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={ handleLoadMore }
              className="rounded-full border border-[#2a221a] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-[#2a221a] transition-colors hover:bg-[#2a221a] hover:text-white cursor-pointer"
            >
              { t("loadMore") }
            </button>
          </div>
        ) : null }
      </div>
    </section>
  );
}

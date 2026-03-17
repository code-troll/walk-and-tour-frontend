"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import ToursCatalog from "@/components/tours/ToursCatalog";
import {listPublicTourCardsClient} from "@/lib/public-tour-client";
import type {PublicTourCard, PublicTourType} from "@/lib/public-tour-model";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";

type PublicToursCatalogClientProps = {
  locale: AppLocale;
  tourTypes: PublicTourType[];
};

export default function PublicToursCatalogClient({
  locale,
  tourTypes,
}: PublicToursCatalogClientProps) {
  const [tours, setTours] = useState<PublicTourCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        setTours(await listPublicTourCardsClient({locale, tourTypes}));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load tours.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale, tourTypes]);

  if (isLoading) {
    return <PublicLoadingState label="Loading tours..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  return <ToursCatalog tours={tours}/>;
}

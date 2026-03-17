"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import Tours from "@/components/home/Tours";
import {loadHomeToursClient} from "@/lib/public-tour-client";
import type {PublicTourCard} from "@/lib/public-tour-model";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";

export default function HomeToursSectionClient({locale}: {locale: AppLocale}) {
  const [tours, setTours] = useState<PublicTourCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        setTours(await loadHomeToursClient(locale));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load tours.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale]);

  if (isLoading) {
    return <PublicLoadingState label="Loading tours..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  return <Tours tours={tours}/>;
}

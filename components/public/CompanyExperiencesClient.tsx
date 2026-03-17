"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import CompaniesExperiencesSection from "@/components/companies/CompaniesExperiencesSection";
import {loadCompanyToursClient} from "@/lib/public-tour-client";
import type {PublicTourCard} from "@/lib/public-tour-model";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";

export default function CompanyExperiencesClient({locale}: {locale: AppLocale}) {
  const [experiences, setExperiences] = useState<PublicTourCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        setExperiences(await loadCompanyToursClient(locale));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load company experiences.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale]);

  if (isLoading) {
    return <PublicLoadingState label="Loading experiences..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  return <CompaniesExperiencesSection experiences={experiences}/>;
}

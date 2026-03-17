"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import BookTourSection from "@/components/book-tour/BookTourSection";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";
import {listBookingOptionsSafeClient} from "@/lib/public-tour-client";
import {
  getExpectedTourTypesForCompanyTours,
  getExpectedTourTypesForPublicTours,
  type BookingOption,
} from "@/lib/public-tour-model";

type BookTourOptionsClientProps = {
  initialBookingType?: string;
  initialSelectedItemId?: string;
  locale: AppLocale;
};

export default function BookTourOptionsClient({
  initialBookingType,
  initialSelectedItemId,
  locale,
}: BookTourOptionsClientProps) {
  const [privateTourOptions, setPrivateTourOptions] = useState<BookingOption[]>([]);
  const [companyTourOptions, setCompanyTourOptions] = useState<BookingOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [privateOptions, companyOptions] = await Promise.all([
          listBookingOptionsSafeClient({
            locale,
            tourTypes: getExpectedTourTypesForPublicTours().filter((tourType) => tourType === "private"),
          }),
          listBookingOptionsSafeClient({
            locale,
            tourTypes: getExpectedTourTypesForCompanyTours(),
          }),
        ]);

        setPrivateTourOptions(privateOptions);
        setCompanyTourOptions(companyOptions);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load booking options.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [locale]);

  if (isLoading) {
    return <PublicLoadingState label="Loading booking options..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  return (
    <BookTourSection
      initialBookingType={initialBookingType}
      initialSelectedItemId={initialSelectedItemId}
      privateTourOptions={privateTourOptions}
      companyTourOptions={companyTourOptions}
    />
  );
}

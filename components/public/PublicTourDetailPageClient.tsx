"use client";

import {useEffect, useRef, useState} from "react";
import {useTranslations} from "next-intl";
import {getPathname} from "@/i18n/navigation";
import type {AppLocale} from "@/i18n/routing";
import NotFound from "@/app/not-found";
import Footer from "@/components/layout/Footer";
import TourDetailAboutSection from "@/components/tour-detail/TourDetailAboutSection";
import TourDetailContentWithSidebar from "@/components/tour-detail/TourDetailContentWithSidebar";
import TourDetailCustomerSupportSection from "@/components/tour-detail/TourDetailCustomerSupportSection";
import TourDetailElfsightReviewsSection from "@/components/tour-detail/TourDetailElfsightReviewsSection";
import TourDetailHeroSection from "@/components/tour-detail/TourDetailHeroSection";
import TourDetailHighlightsSection from "@/components/tour-detail/TourDetailHighlightsSection";
import TourDetailIncludedSection from "@/components/tour-detail/TourDetailIncludedSection";
import TourDetailItinerarySection from "@/components/tour-detail/TourDetailItinerarySection";
import TourDetailLanguageFallbackDialog from "@/components/tour-detail/TourDetailLanguageFallbackDialog";
import TourDetailQuickInfoSection from "@/components/tour-detail/TourDetailQuickInfoSection";
import TourDetailRelatedToursSection from "@/components/tour-detail/TourDetailRelatedToursSection";
import TourDetailSidebarPlaceholder from "@/components/tour-detail/TourDetailSidebarPlaceholder";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";
import {
  buildItineraryUiLabels,
  buildQuickInfoItems,
  getLocaleLanguageLabel,
} from "@/lib/detail-page-utils";
import {
  getPublicTourDetailWithFallbackClient,
  listRelatedPublicToursSafeClient,
} from "@/lib/public-tour-client";
import {
  getLocalizedPublicTourTypeLabel,
  type PublicTourCard,
  type PublicTourDetailResult,
  type PublicTourType,
} from "@/lib/public-tour-model";

const ContentDivider = () => (
  <section className="bg-[#fcfaf7] py-1">
    <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
      <div className="h-px w-full bg-[#d8c8b7]"/>
    </div>
  </section>
);

type PublicTourDetailPageClientProps = {
  expectedTourTypes: PublicTourType[];
  hrefBasePath?: "/companies" | "/tours";
  locale: AppLocale;
  requestedBookingType: "companyTours" | "privateTours";
  slug: string;
  showRelatedTours?: boolean;
};

export default function PublicTourDetailPageClient({
  expectedTourTypes,
  hrefBasePath = "/tours",
  locale,
  requestedBookingType,
  slug,
  showRelatedTours = false,
}: PublicTourDetailPageClientProps) {
  const tourDetailT = useTranslations("tourDetail");
  const headerT = useTranslations("header");
  const [detailResult, setDetailResult] = useState<PublicTourDetailResult | null>(null);
  const [relatedTours, setRelatedTours] = useState<PublicTourCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      setIsMissing(false);

      try {
        const nextDetailResult = await getPublicTourDetailWithFallbackClient({
          expectedTourTypes,
          locale,
          slug,
        });

        if (!nextDetailResult) {
          setIsMissing(true);
          setDetailResult(null);
          setRelatedTours([]);
          return;
        }

        // If the URL slug doesn't match the requested locale but a
        // translation exists for that locale, redirect to the correct slug.
        if (nextDetailResult.isFallbackLanguage) {
          const localeTranslation = nextDetailResult.availableTranslations.find(
            (t) => t.locale === locale,
          );

          if (localeTranslation) {
            setIsRedirecting(true);
            const correctPath = `${getPathname({ locale, href: hrefBasePath as "/tours" })}/${localeTranslation.slug}`;
            window.location.replace(correctPath);
            return;
          }
        }

        setDetailResult(nextDetailResult);

        if (showRelatedTours) {
          setRelatedTours(await listRelatedPublicToursSafeClient({
            currentSlug: nextDetailResult.tour.slug,
            locale: nextDetailResult.contentLocale,
            limit: 3,
            tagKeys: nextDetailResult.tour.tagKeys,
            tourTypes: expectedTourTypes,
          }));
        } else {
          setRelatedTours([]);
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load this tour.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [expectedTourTypes, locale, showRelatedTours, slug]);

  useEffect(() => {
    if (!detailResult) {
      return;
    }

    document.title = `${detailResult.tour.title} | Walk and Tour Copenhagen`;

    const metaDescription =
      detailResult.tour.aboutTourDescription ||
      tourDetailT("defaults.aboutTourDescription");
    let descriptionTag = document.querySelector('meta[name="description"]');

    if (!descriptionTag) {
      descriptionTag = document.createElement("meta");
      descriptionTag.setAttribute("name", "description");
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute("content", metaDescription);
  }, [detailResult, tourDetailT]);

  if (isLoading || isRedirecting) {
    return <PublicLoadingState label="Loading tour details..."/>;
  }

  if (error) {
    return <PublicErrorState description={error} onRetry={() => window.location.reload()}/>;
  }

  if (isMissing || !detailResult) {
    return <NotFound/>;
  }

  const {availableLocales, availableTranslations, contentLocale, isFallbackLanguage, tour} = detailResult;
  const availableLanguageLabels = availableLocales.map((availableLocale) => ({
    locale: availableLocale,
    label: getLocaleLanguageLabel(availableLocale, headerT as never),
  }));
  const contentLanguageLabel = availableLanguageLabels.find(
    ({locale: availableLocale}) => availableLocale === contentLocale,
  )?.label ?? getLocaleLanguageLabel(contentLocale, headerT as never);
  const tourTypeLabel = getLocalizedPublicTourTypeLabel(contentLocale, tour.tourType);
  const quickInfoItems = buildQuickInfoItems({
    detailT: tourDetailT as never,
    facts: {
      meetingPoint: tour.meetingPoint || tour.location,
      endPoint: tour.endPoint || tour.location,
      typeTour: tourTypeLabel,
      cancellationType: tour.cancellationType,
      language: contentLanguageLabel,
    },
  });
  const itineraryUiLabels = buildItineraryUiLabels(tourDetailT as never);

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      {isFallbackLanguage ? (
        <TourDetailLanguageFallbackDialog
          title={tourDetailT("languageFallback.title")}
          description={tourDetailT("languageFallback.description")}
          availableLanguagesLabel={tourDetailT("languageFallback.availableLanguages")}
          availableLanguages={availableLanguageLabels}
          availableTranslations={availableTranslations}
          hrefBasePath={hrefBasePath}
          tourSlug={slug}
        />
      ) : null}

      <TourDetailHeroSection
        title={tour.title}
        tourTypeLabel={tourTypeLabel}
        rating={tour.rating}
        reviews={tour.reviews}
        duration={tour.duration}
        location={tour.location}
        tourImages={tour.tourImages}
      />

      <TourDetailQuickInfoSection items={quickInfoItems}/>

      <TourDetailContentWithSidebar
        sidebar={
          <TourDetailSidebarPlaceholder
            bookingReferenceId={tour.bookingReferenceId}
            language={contentLocale}
            price={tour.price}
            duration={tour.duration}
            cancellationType={tour.cancellationType}
            requestedBookingType={requestedBookingType}
            requestedItemId={tour.id}
          />
        }
        sidebarContainerClassName={hrefBasePath === "/companies" ? "mb-26" : undefined}
      >
        <TourDetailHighlightsSection
          title={tourDetailT("labels.highlights")}
          highlights={tour.highlights}
        />
        {hrefBasePath === "/tours" ? <ContentDivider/> : null}

        <TourDetailAboutSection
          title={tourDetailT("labels.aboutTour")}
          description={tour.aboutTourDescription || tourDetailT("defaults.aboutTourDescription")}
        />
        {hrefBasePath === "/tours" ? <ContentDivider/> : null}

        <TourDetailItinerarySection
          title={tourDetailT("labels.itinerary")}
          itinerary={tour.itinerary}
          description={tour.itineraryDescription || tourDetailT("defaults.itineraryDescription")}
          uiLabels={itineraryUiLabels}
        />
        {hrefBasePath === "/tours" ? <ContentDivider/> : null}

        <TourDetailIncludedSection
          title={tourDetailT("labels.includedSection")}
          includedTitle={tourDetailT("labels.included")}
          notIncludedTitle={tourDetailT("labels.notIncluded")}
          includedItems={tour.includedItems}
          notIncludedItems={tour.notIncludedItems}
        />
        {hrefBasePath === "/tours" ? <ContentDivider/> : null}

        <TourDetailCustomerSupportSection
          title={tourDetailT("labels.customerSupport")}
          description={tour.customerSupportDescription || tourDetailT("defaults.customerSupportDescription")}
          ctaLabel={tourDetailT("labels.contactUs")}
          ctaHref="/contact"
        />

        <TourDetailElfsightReviewsSection/>
      </TourDetailContentWithSidebar>

      {showRelatedTours ? (
        <TourDetailRelatedToursSection
          title={tourDetailT("labels.relatedTours")}
          tours={relatedTours}
        />
      ) : null}

      <Footer/>
    </div>
  );
}

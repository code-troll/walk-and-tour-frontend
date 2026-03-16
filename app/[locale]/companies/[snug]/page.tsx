import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

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
import TourDetailSidebarPlaceholder from "@/components/tour-detail/TourDetailSidebarPlaceholder";
import {
  buildItineraryUiLabels,
  buildQuickInfoItems,
  getLocaleLanguageLabel,
} from "@/lib/detail-page-utils";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  getExpectedTourTypesForCompanyTours,
  getLocalizedPublicTourTypeLabel,
  getPublicTourDetailWithFallback,
} from "@/lib/public-tour-data";

type CompanyDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({
  params,
}: CompanyDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const detailResult = await getPublicTourDetailWithFallback({
    expectedTourTypes: getExpectedTourTypesForCompanyTours(),
    locale,
    slug: snug,
  });

  if (!detailResult) {
    return {};
  }

  const {tour} = detailResult;

  return {
    title: `${ tour.title } | Walk and Tour Copenhagen`,
    description: tour.aboutTourDescription || undefined,
  };
}

export default async function CompanyDetailPage({params}: CompanyDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const detailResult = await getPublicTourDetailWithFallback({
    expectedTourTypes: getExpectedTourTypesForCompanyTours(),
    locale,
    slug: snug,
  });

  if (!detailResult) {
    notFound();
  }

  const {availableLocales, contentLocale, isFallbackLanguage, tour} = detailResult;
  const [tourDetailUiT, tourDetailContentT, headerT] = await Promise.all([
    getTranslations({locale, namespace: "tourDetail"}),
    getTranslations({locale: contentLocale, namespace: "tourDetail"}),
    getTranslations({locale, namespace: "header"}),
  ]);
  const availableLanguageLabels = availableLocales.map((availableLocale) => ({
    locale: availableLocale,
    label: getLocaleLanguageLabel(availableLocale, headerT),
  }));
  const contentLanguageLabel = availableLanguageLabels.find(
    ({locale: availableLocale}) => availableLocale === contentLocale,
  )?.label ?? getLocaleLanguageLabel(contentLocale, headerT);
  const tourTypeLabel = getLocalizedPublicTourTypeLabel(contentLocale, tour.tourType);
  const quickInfoItems = buildQuickInfoItems({
    detailT: tourDetailUiT,
    facts: {
      meetingPoint: tour.meetingPoint || tour.location,
      endPoint: tour.endPoint || tour.location,
      typeTour: tourTypeLabel,
      cancellationType: tour.cancellationType,
      language: contentLanguageLabel,
    },
  });
  const itineraryUiLabels = buildItineraryUiLabels(tourDetailUiT);

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      { isFallbackLanguage ? (
        <TourDetailLanguageFallbackDialog
          title={ tourDetailUiT("languageFallback.title") }
          description={ tourDetailUiT("languageFallback.description") }
          availableLanguagesLabel={ tourDetailUiT("languageFallback.availableLanguages") }
          availableLanguages={ availableLanguageLabels }
          hrefBasePath="/companies"
          tourSlug={ snug }
        />
      ) : null }

      <TourDetailHeroSection
        title={ tour.title }
        tourTypeLabel={ tourTypeLabel }
        rating={ tour.rating }
        reviews={ tour.reviews }
        duration={ tour.duration }
        location={ tour.location }
        tourImages={ tour.tourImages }
      />

      <TourDetailQuickInfoSection items={ quickInfoItems }/>

      <TourDetailContentWithSidebar
        sidebar={
          <TourDetailSidebarPlaceholder
            bookingReferenceId={ tour.bookingReferenceId }
            language={ contentLocale }
            price={ tour.price }
            duration={ tour.duration }
            cancellationType={ tour.cancellationType }
            requestedBookingType="companyTours"
            requestedItemId={ tour.id }
          />
        }
        sidebarContainerClassName="mb-26"
      >
        <TourDetailHighlightsSection
          title={ tourDetailUiT("labels.highlights") }
          highlights={ tour.highlights }
        />

        <TourDetailAboutSection
          title={ tourDetailUiT("labels.aboutTour") }
          description={ tour.aboutTourDescription || tourDetailContentT("defaults.aboutTourDescription") }
        />

        <TourDetailItinerarySection
          title={ tourDetailUiT("labels.itinerary") }
          itinerary={ tour.itinerary }
          description={ tour.itineraryDescription || tourDetailContentT("defaults.itineraryDescription") }
          uiLabels={ itineraryUiLabels }
        />

        <TourDetailIncludedSection
          title={ tourDetailUiT("labels.includedSection") }
          includedTitle={ tourDetailUiT("labels.included") }
          notIncludedTitle={ tourDetailUiT("labels.notIncluded") }
          includedItems={ tour.includedItems }
          notIncludedItems={ tour.notIncludedItems }
        />

        <TourDetailCustomerSupportSection
          title={ tourDetailUiT("labels.customerSupport") }
          description={
            tour.customerSupportDescription || tourDetailContentT("defaults.customerSupportDescription")
          }
          ctaLabel={ tourDetailUiT("labels.contactUs") }
          ctaHref="/contact"
        />

        <TourDetailElfsightReviewsSection/>
      </TourDetailContentWithSidebar>

      <Footer/>
    </div>
  );
}

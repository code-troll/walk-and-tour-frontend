import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import TourDetailAboutSection from "@/components/tour-detail/TourDetailAboutSection";
import TourDetailContentWithSidebar from "@/components/tour-detail/TourDetailContentWithSidebar";
import TourDetailLanguageFallbackDialog from "@/components/tour-detail/TourDetailLanguageFallbackDialog";
import TourDetailHeroSection from "@/components/tour-detail/TourDetailHeroSection";
import TourDetailHighlightsSection from "@/components/tour-detail/TourDetailHighlightsSection";
import TourDetailIncludedSection from "@/components/tour-detail/TourDetailIncludedSection";
import TourDetailItinerarySection from "@/components/tour-detail/TourDetailItinerarySection";
import TourDetailQuickInfoSection from "@/components/tour-detail/TourDetailQuickInfoSection";
import TourDetailRelatedToursSection from "@/components/tour-detail/TourDetailRelatedToursSection";
import TourDetailSidebarPlaceholder from "@/components/tour-detail/TourDetailSidebarPlaceholder";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  buildItineraryUiLabels,
  buildQuickInfoItems,
  getLocaleLanguageLabel,
} from "@/lib/detail-page-utils";
import {
  getExpectedTourTypesForPublicTours,
  getLocalizedPublicTourTypeLabel,
  getPublicTourDetailWithFallback,
  listRelatedPublicToursSafe,
} from "@/lib/public-tour-data";
import TourDetailCustomerSupportSection from "@/components/tour-detail/TourDetailCustomerSupportSection";
import TourDetailElfsightReviewsSection from "@/components/tour-detail/TourDetailElfsightReviewsSection";

type TourDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const ContentDivider = () => (
  <section className="bg-[#fcfaf7] py-1">
    <div className="mx-auto lg:mx-12 w-full max-w-11/12 px-0">
      <div className="h-px w-full bg-[#d8c8b7]"/>
    </div>
  </section>
);

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export async function generateMetadata({
  params,
}: TourDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const detailResult = await getPublicTourDetailWithFallback({
    expectedTourTypes: getExpectedTourTypesForPublicTours(),
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

export default async function TourDetailPage({params}: TourDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const detailResult = await getPublicTourDetailWithFallback({
    expectedTourTypes: getExpectedTourTypesForPublicTours(),
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
  const relatedTours = await listRelatedPublicToursSafe({
    currentSlug: tour.slug,
    locale: contentLocale,
    limit: 3,
    tagKeys: tour.tagKeys,
    tourTypes: getExpectedTourTypesForPublicTours(),
  });

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      { isFallbackLanguage ? (
        <TourDetailLanguageFallbackDialog
          title={ tourDetailUiT("languageFallback.title") }
          description={ tourDetailUiT("languageFallback.description") }
          availableLanguagesLabel={ tourDetailUiT("languageFallback.availableLanguages") }
          availableLanguages={ availableLanguageLabels }
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
            requestedBookingType="privateTours"
            requestedItemId={ tour.id }
          />
        }
      >
        <TourDetailHighlightsSection
          title={ tourDetailUiT("labels.highlights") }
          highlights={ tour.highlights }
        />
        <ContentDivider/>

        <TourDetailAboutSection
          title={ tourDetailUiT("labels.aboutTour") }
          description={ tour.aboutTourDescription || tourDetailContentT("defaults.aboutTourDescription") }
        />
        <ContentDivider/>

        <TourDetailItinerarySection
          title={ tourDetailUiT("labels.itinerary") }
          itinerary={ tour.itinerary }
          description={ tour.itineraryDescription || tourDetailContentT("defaults.itineraryDescription") }
          uiLabels={ itineraryUiLabels }
        />
        <ContentDivider/>

        <TourDetailIncludedSection
          title={ tourDetailUiT("labels.includedSection") }
          includedTitle={ tourDetailUiT("labels.included") }
          notIncludedTitle={ tourDetailUiT("labels.notIncluded") }
          includedItems={ tour.includedItems }
          notIncludedItems={ tour.notIncludedItems }
        />
        <ContentDivider/>

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

      <TourDetailRelatedToursSection
        title={ tourDetailUiT("labels.relatedTours") }
        tours={ relatedTours }
      />

      <Footer/>
    </div>
  );
}

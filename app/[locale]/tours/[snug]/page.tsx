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
  buildQuickInfoItems,
  getItemStringWithFallback,
  getLocaleLanguageLabel,
  resolveDetailContent,
  resolveDetailDisplay,
  resolveHeroImages,
} from "@/lib/detail-page-utils";
import {
  getTourAvailableLocales,
  getTourBookingReferenceId,
  getTourContentLocale,
  getRelatedToursByTour,
  getResolvedTourBySlug,
  isTourAvailableInLocale,
  tourSlugs,
} from "@/lib/landing-data";
import TourDetailCustomerSupportSection from "@/components/tour-detail/TourDetailCustomerSupportSection";
import TourDetailElfsightReviewsSection from "@/components/tour-detail/TourDetailElfsightReviewsSection";

type TourDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

export function generateStaticParams() {
  return tourSlugs.map((snug) => ({snug}));
}

export async function generateMetadata({
                                         params,
                                       }: TourDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const tour = getResolvedTourBySlug(snug);

  if (!tour) {
    return {};
  }

  const contentLocale = getTourContentLocale(tour, locale);
  const tourItemT = await getTranslations({locale: contentLocale, namespace: "tourDetail.items"});
  const tourDetailT = await getTranslations({locale: contentLocale, namespace: "tourDetail"});
  const aboutTourDescription = getItemStringWithFallback(
    tourItemT,
    tour.id,
    "aboutTourDescription",
    getItemStringWithFallback(
      tourItemT,
      tour.id,
      "description",
      tourDetailT("defaults.aboutTourDescription")
    )
  );

  return {
    title: `${ tourItemT(`${ tour.id }.title`) } | Walk and Tour Copenhagen`,
    description: aboutTourDescription,
  };
}

export default async function TourDetailPage({params}: TourDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const tour = getResolvedTourBySlug(snug);

  if (!tour) {
    notFound();
  }

  const contentLocale = getTourContentLocale(tour, locale);
  const isFallbackLanguage = !isTourAvailableInLocale(tour, locale);
  const [tourItemT, tourDetailUiT, tourDetailContentT, headerT] = await Promise.all([
    getTranslations({locale: contentLocale, namespace: "tourDetail.items"}),
    getTranslations({locale, namespace: "tourDetail"}),
    getTranslations({locale: contentLocale, namespace: "tourDetail"}),
    getTranslations({locale, namespace: "header"}),
  ]);
  const availableLanguages = getTourAvailableLocales(tour).map((availableLocale) => ({
    locale: availableLocale,
    label: getLocaleLanguageLabel(availableLocale, headerT),
  }));
  const display = resolveDetailDisplay({
    itemT: tourItemT,
    itemId: tour.id,
    fallbacks: {
      tag: "",
      duration: "",
      location: "",
    },
  });
  const detailContent = resolveDetailContent({
    detailT: tourDetailContentT,
    itemT: tourItemT,
    itemId: tour.id,
    languageLabel: availableLanguages.find(locale => locale === locale)?.label!,
  });
  const quickInfoItems = buildQuickInfoItems({
    detailT: tourDetailUiT,
    facts: detailContent.facts,
  });

  const relatedTours = getRelatedToursByTour(tour, 3);
  const heroTourImages = resolveHeroImages(tour);
  const bookingReferenceId = getTourBookingReferenceId(tour, locale);

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      { isFallbackLanguage ? (
        <TourDetailLanguageFallbackDialog
          title={ tourDetailUiT("languageFallback.title") }
          description={ tourDetailUiT("languageFallback.description") }
          availableLanguagesLabel={ tourDetailUiT("languageFallback.availableLanguages") }
          availableLanguages={ availableLanguages }
          tourSlug={ snug }
        />
      ) : null }

      <TourDetailHeroSection
        title={ display.title }
        tag={ display.tag }
        rating={ tour.rating }
        reviews={ tour.reviews }
        duration={ display.duration }
        location={ display.location }
        tourImages={ heroTourImages }
      />

      <TourDetailQuickInfoSection items={ quickInfoItems }/>

      <TourDetailContentWithSidebar
        sidebar={
          <TourDetailSidebarPlaceholder
            bookingReferenceId={ bookingReferenceId }
            language={ locale }
          />
        }
      >
        <TourDetailHighlightsSection
          title={ tourDetailUiT("labels.highlights") }
          highlights={ detailContent.highlights }
        />

        <TourDetailAboutSection
          title={ tourDetailUiT("labels.aboutTour") }
          description={ detailContent.aboutTourDescription }
        />

        <TourDetailItinerarySection
          title={ tourDetailUiT("labels.itinerary") }
          description={ detailContent.itineraryDescription }
        />

        <TourDetailIncludedSection
          title={ tourDetailUiT("labels.includedSection") }
          includedTitle={ tourDetailUiT("labels.included") }
          notIncludedTitle={ tourDetailUiT("labels.notIncluded") }
          includedItems={ detailContent.includedItems }
          notIncludedItems={ detailContent.notIncludedItems }
        />

        <TourDetailCustomerSupportSection
          title={ tourDetailUiT("labels.customerSupport") }
          description={ detailContent.customerSupportDescription }
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

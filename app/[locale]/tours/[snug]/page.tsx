import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import Footer from "@/components/layout/Footer";
import TourDetailAboutSection from "@/components/tour-detail/TourDetailAboutSection";
import TourDetailContentWithSidebar from "@/components/tour-detail/TourDetailContentWithSidebar";
import TourDetailHeroSection from "@/components/tour-detail/TourDetailHeroSection";
import TourDetailHighlightsSection from "@/components/tour-detail/TourDetailHighlightsSection";
import TourDetailIncludedSection from "@/components/tour-detail/TourDetailIncludedSection";
import TourDetailItinerarySection from "@/components/tour-detail/TourDetailItinerarySection";
import TourDetailQuickInfoSection from "@/components/tour-detail/TourDetailQuickInfoSection";
import TourDetailRelatedToursSection from "@/components/tour-detail/TourDetailRelatedToursSection";
import TourDetailSidebarPlaceholder from "@/components/tour-detail/TourDetailSidebarPlaceholder";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  getRelatedToursByTour,
  getResolvedTourBySlug,
  tourSlugs,
  tourTemplateMapHref,
} from "@/lib/landing-data";
import TourDetailCustomerSupportSection from "@/components/tour-detail/TourDetailCustomerSupportSection";
import TourDetailElfsightReviewsSection from "@/components/tour-detail/TourDetailElfsightReviewsSection";

type TourDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

type Translator = Awaited<ReturnType<typeof getTranslations>>;

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const getRawWithFallback = <T, >(
  t: Translator,
  itemKey: string,
  key: string,
  fallbackPath: string
): T => {
  const itemPath = `${ itemKey }.${ key }`;

  if (t.has(itemPath)) {
    return t.raw(itemPath) as T;
  }

  return t.raw(fallbackPath) as T;
};

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

  const tourItemT = await getTranslations({locale, namespace: "tourDetail.items"});
  const tourDetailT = await getTranslations({locale, namespace: "tourDetail"});

  const itemKey = `items.${ tour.id }`;
  const aboutParagraphs = getRawWithFallback<string[]>(
    tourDetailT,
    itemKey,
    "about",
    "defaults.aboutTourDescription"
  );

  return {
    title: `${ tourItemT(`${ tour.id }.title`) } | Walk and Tour Copenhagen`,
    description: aboutParagraphs[0] ?? tourItemT(`${ tour.id }.title`),
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

  const tourItemT = await getTranslations({locale, namespace: "tourDetail.items"});
  const tourDetailT = await getTranslations({locale, namespace: "tourDetail"});
  const headerT = await getTranslations({locale, namespace: "header"});

  const itemKey = `items.${ tour.id }`;
  const highlights = getRawWithFallback<string[]>(
    tourDetailT,
    itemKey,
    "highlights",
    "defaults.highlights"
  );
  const itineraryDescription = getRawWithFallback<string>(
    tourDetailT,
    itemKey,
    "itineraryDescription",
    "defaults.itineraryDescription"
  );
  const includedItems = getRawWithFallback<string[]>(
    tourDetailT,
    itemKey,
    "included",
    "defaults.included"
  );
  const notIncludedItems = getRawWithFallback<string[]>(
    tourDetailT,
    itemKey,
    "notIncluded",
    "defaults.notIncluded"
  );

  const defaultFacts = tourDetailT.raw("defaults.facts") as Record<string, string>;
  const itemFacts = getRawWithFallback<Record<string, string>>(
    tourDetailT,
    itemKey,
    "facts",
    "defaults.facts"
  );
  const facts = {
    ...defaultFacts,
    ...itemFacts,
  };
  const localeLanguage = locale === "en"
    ? headerT("languages.EN")
    : locale === "es"
      ? headerT("languages.ES")
      : headerT("languages.IT");

  const aboutTourDescription = getRawWithFallback<string>(
    tourDetailT,
    itemKey,
    "aboutTourDescription",
    "defaults.aboutTourDescription"
  );
  const customerSupportDescription = getRawWithFallback<string>(
    tourDetailT,
    itemKey,
    "customerSupportDescription",
    "defaults.customerSupportDescription"
  );

  const quickInfoItems = [
    {
      id: "startFrom" as const,
      label: tourDetailT("labels.startFrom"),
      value: facts.meetingPoint,
    },
    {
      id: "endAt" as const,
      label: tourDetailT("labels.endAt"),
      value: facts.endPoint,
    },
    {
      id: "typeTour" as const,
      label: tourDetailT("labels.typeTour"),
      value: facts.typeTour,
    },
    {
      id: "cancellationType" as const,
      label: tourDetailT("labels.cancellationType"),
      value: facts.cancellationType,
    },
    {
      id: "languages" as const,
      label: tourDetailT("labels.languages"),
      value: localeLanguage,
    },
  ];

  const relatedTours = getRelatedToursByTour(tour, 3);

  const heroTourImages = Array.from(new Set([
    tour.heroImageSrc,
    ...tour.galleryImageSrcs,
  ].filter((imageSrc) => Boolean(imageSrc))));

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <TourDetailHeroSection
        title={ tourItemT(`${ tour.id }.title`) }
        tag={ tourItemT(`${ tour.id }.tag`) }
        rating={ tour.rating }
        reviews={ tour.reviews }
        duration={ tourItemT(`${ tour.id }.duration`) }
        location={ tourItemT(`${ tour.id }.location`) }
        tourImages={ heroTourImages }
      />

      <TourDetailQuickInfoSection items={ quickInfoItems }/>

      <TourDetailContentWithSidebar sidebar={ <TourDetailSidebarPlaceholder mapHref={ tourTemplateMapHref }/> }>
        <TourDetailHighlightsSection
          title={ tourDetailT("labels.highlights") }
          highlights={ highlights }
        />

        <TourDetailAboutSection
          title={ tourDetailT("labels.aboutTour") }
          description={ aboutTourDescription }
        />

        <TourDetailItinerarySection
          title={ tourDetailT("labels.itinerary") }
          description={ itineraryDescription }
        />

        <TourDetailIncludedSection
          title={ tourDetailT("labels.includedSection") }
          includedTitle={ tourDetailT("labels.included") }
          notIncludedTitle={ tourDetailT("labels.notIncluded") }
          includedItems={ includedItems }
          notIncludedItems={ notIncludedItems }
        />

        <TourDetailCustomerSupportSection
          title={ tourDetailT("labels.customerSupport") }
          description={ customerSupportDescription }
          ctaLabel={ tourDetailT("labels.contactUs") }
          ctaHref="/contact"
        />

        <TourDetailElfsightReviewsSection/>
      </TourDetailContentWithSidebar>

      <TourDetailRelatedToursSection
        title={ tourDetailT("labels.relatedTours") }
        tours={ relatedTours }
      />

      <Footer/>
    </div>
  );
}

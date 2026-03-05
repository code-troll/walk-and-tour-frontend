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
import { toursCatalog } from "@/lib/landing-data";
import {
  getTourBySlug,
  getTourDetailBySlug,
  tourDetailSlugs,
  type TourDetailCtaTarget,
} from "@/lib/tour-details-data";
import { getInternalHref } from "@/lib/internal-paths";

type TourDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

type Translator = Awaited<ReturnType<typeof getTranslations>>;

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const getCtaHref = ({
                      locale,
                      target,
                    }: {
  locale: AppLocale;
  target: TourDetailCtaTarget;
}) => (
  target.kind === "external"
    ? {href: target.href, isExternal: true}
    : {href: getInternalHref({locale, target: target.target}), isExternal: false}
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
  return tourDetailSlugs.map((snug) => ({snug}));
}

export async function generateMetadata({
                                         params,
                                       }: TourDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const tourDetail = getTourDetailBySlug(snug);
  const tour = getTourBySlug(snug);

  if (!tourDetail || !tour) {
    return {};
  }

  const tourCardT = await getTranslations({locale, namespace: "tours.card"});
  const tourDetailT = await getTranslations({locale, namespace: "tourDetail"});

  const itemKey = `items.${ tour.id }`;
  const aboutParagraphs = getRawWithFallback<string[]>(
    tourDetailT,
    itemKey,
    "about",
    "defaults.about"
  );

  return {
    title: `${ tourCardT(`items.${ tour.id }.title`) } | Walk and Tour Copenhagen`,
    description: aboutParagraphs[0] ?? tourCardT(`items.${ tour.id }.title`),
  };
}

export default async function TourDetailPage({params}: TourDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const tourDetail = getTourDetailBySlug(snug);
  const tour = getTourBySlug(snug);

  if (!tourDetail || !tour) {
    notFound();
  }

  const tourCardT = await getTranslations({locale, namespace: "tours.card"});
  const tourDetailT = await getTranslations({locale, namespace: "tourDetail"});

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

  const bookingDescription = getRawWithFallback<string>(
    tourDetailT,
    itemKey,
    "bookingDescription",
    "defaults.bookingDescription"
  );
  const aboutTourDescription = getRawWithFallback<string>(
    tourDetailT,
    itemKey,
    "aboutTourDescription",
    "defaults.aboutTourDescription"
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
      value: tourCardT(`items.${ tour.id }.tag`),
    },
    {
      id: "cancellationType" as const,
      label: tourDetailT("labels.cancellationType"),
      value: facts.cancellationType,
    },
    {
      id: "languages" as const,
      label: tourDetailT("labels.languages"),
      value: facts.languages,
    },
  ];

  const relatedTours = tourDetail.relatedTourIds
    .map((tourId) => toursCatalog.find((item) => item.id === tourId))
    .filter((item): item is (typeof toursCatalog)[number] => Boolean(item));

  const heroTourImages = Array.from(new Set([
    tourDetail.heroImageSrc,
    ...tourDetail.galleryImageSrcs,
  ].filter((imageSrc) => Boolean(imageSrc))));

  const bookingCta = getCtaHref({locale, target: tourDetail.bookingTarget});
  const supportCta = getCtaHref({locale, target: tourDetail.supportTarget});

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <TourDetailHeroSection
        title={ tourCardT(`items.${ tour.id }.title`) }
        tag={ tourCardT(`items.${ tour.id }.tag`) }
        rating={ tour.rating }
        reviews={ tour.reviews }
        duration={ tourCardT(`items.${ tour.id }.duration`) }
        location={ tourCardT(`items.${ tour.id }.location`) }
        tourImages={ heroTourImages }
      />

      <TourDetailQuickInfoSection items={ quickInfoItems }/>

      <TourDetailContentWithSidebar sidebar={ <TourDetailSidebarPlaceholder/> }>
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
      </TourDetailContentWithSidebar>

      <TourDetailRelatedToursSection
        title={ tourDetailT("labels.relatedTours") }
        tours={ relatedTours }
      />

      <Footer/>
    </div>
  );
}

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
import TourDetailQuickInfoSection from "@/components/tour-detail/TourDetailQuickInfoSection";
import TourDetailSidebarPlaceholder from "@/components/tour-detail/TourDetailSidebarPlaceholder";
import {
  buildQuickInfoItems,
  getItemStringWithFallback,
  getLocaleLanguageLabel,
  resolveDetailContent,
  resolveDetailDisplay,
  resolveHeroImages,
} from "@/lib/detail-page-utils";
import { type AppLocale, routing } from "@/i18n/routing";
import {
  companyExperienceSlugs,
  getResolvedCompanyExperienceBySlug,
} from "@/lib/companies-data";

type CompanyDetailPageProps = {
  params: Promise<{ locale: string; snug: string; }>;
};

const isValidLocale = (locale: string): locale is AppLocale => (
  routing.locales.includes(locale as AppLocale)
);

const companyTagByLocale: Record<AppLocale, string> = {
  en: "Corporate Experience",
  es: "Experiencia corporativa",
  it: "Esperienza aziendale",
};

const companyDurationByLocale: Record<AppLocale, string> = {
  en: "2 hours",
  es: "2 horas",
  it: "2 ore",
};

const companyLocationByLocale: Record<AppLocale, string> = {
  en: "Copenhagen",
  es: "Copenhague",
  it: "Copenaghen",
};

export function generateStaticParams() {
  return companyExperienceSlugs.map((snug) => ({snug}));
}

export async function generateMetadata({
                                         params,
                                       }: CompanyDetailPageProps): Promise<Metadata> {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const companyExperience = getResolvedCompanyExperienceBySlug(snug);

  if (!companyExperience) {
    return {};
  }

  const companyItemT = await getTranslations({locale, namespace: "companiesPage.items"});
  const title = companyItemT(`${ companyExperience.id }.title`);
  const description = getItemStringWithFallback(
    companyItemT,
    companyExperience.id,
    "aboutTourDescription",
    getItemStringWithFallback(
      companyItemT,
      companyExperience.id,
      "description",
      title
    )
  );

  return {
    title: `${ title } | Walk and Tour Copenhagen`,
    description,
  };
}

export default async function CompanyDetailPage({params}: CompanyDetailPageProps) {
  const {locale, snug} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const companyExperience = getResolvedCompanyExperienceBySlug(snug);

  if (!companyExperience) {
    notFound();
  }

  const companyItemT = await getTranslations({locale, namespace: "companiesPage.items"});
  const tourDetailT = await getTranslations({locale, namespace: "tourDetail"});
  const headerT = await getTranslations({locale, namespace: "header"});
  const localeLanguage = getLocaleLanguageLabel(locale, headerT);
  const display = resolveDetailDisplay({
    itemT: companyItemT,
    itemId: companyExperience.id,
    fallbacks: {
      tag: companyTagByLocale[locale],
      duration: companyDurationByLocale[locale],
      location: companyLocationByLocale[locale],
    },
  });
  const detailContent = resolveDetailContent({
    detailT: tourDetailT,
    itemT: companyItemT,
    itemId: companyExperience.id,
    languageLabel: localeLanguage,
  });
  const quickInfoItems = buildQuickInfoItems({
    detailT: tourDetailT,
    facts: {
      ...detailContent.facts,
      meetingPoint: detailContent.facts.meetingPoint || companyLocationByLocale[locale],
      endPoint: detailContent.facts.endPoint || companyLocationByLocale[locale],
      typeTour: detailContent.facts.typeTour || display.tag,
    },
  });
  const heroTourImages = resolveHeroImages(companyExperience);

  return (
    <div className="min-h-screen bg-white text-[#2a221a]">
      <TourDetailHeroSection
        title={ display.title }
        tag={ display.tag }
        rating={ companyExperience.rating }
        reviews={ companyExperience.reviews }
        duration={ display.duration }
        location={ display.location }
        tourImages={ heroTourImages }
      />

      <TourDetailQuickInfoSection items={ quickInfoItems }/>

      <TourDetailContentWithSidebar
        sidebar={
          <TourDetailSidebarPlaceholder
            duration={ display.duration }
            cancellationType={ detailContent.facts.cancellationType }
            requestedBookingType="companyTours"
            requestedItemId={ companyExperience.id }
          />
        }
                                    sidebarContainerClassName="mb-26">
        <TourDetailHighlightsSection
          title={ tourDetailT("labels.highlights") }
          highlights={ detailContent.highlights }
        />

        <TourDetailAboutSection
          title={ tourDetailT("labels.aboutTour") }
          description={ detailContent.aboutTourDescription }
        />

        <TourDetailItinerarySection
          title={ tourDetailT("labels.itinerary") }
          description={ detailContent.itineraryDescription }
        />

        <TourDetailIncludedSection
          title={ tourDetailT("labels.includedSection") }
          includedTitle={ tourDetailT("labels.included") }
          notIncludedTitle={ tourDetailT("labels.notIncluded") }
          includedItems={ detailContent.includedItems }
          notIncludedItems={ detailContent.notIncludedItems }
        />

        <TourDetailCustomerSupportSection
          title={ tourDetailT("labels.customerSupport") }
          description={ detailContent.customerSupportDescription }
          ctaLabel={ tourDetailT("labels.contactUs") }
          ctaHref="/contact"
        />

        <TourDetailElfsightReviewsSection/>
      </TourDetailContentWithSidebar>

      <Footer/>
    </div>
  );
}

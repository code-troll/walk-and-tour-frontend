import type {Metadata} from "next";
import {Suspense} from "react";
import {NextIntlClientProvider} from "next-intl";
import {getTranslations, setRequestLocale} from "next-intl/server";
import {notFound} from "next/navigation";
import PublicAnalytics from "@/components/analytics/PublicAnalytics";
import Header from "@/components/layout/Header";
import {routing, type AppLocale} from "@/i18n/routing";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
};

const isValidLocale = (locale: string): locale is AppLocale =>
  routing.locales.includes(locale as AppLocale);

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export async function generateMetadata({
  params,
}: Omit<LocaleLayoutProps, "children">): Promise<Metadata> {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "meta"});

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: locale === routing.defaultLocale ? "/" : `/${locale}`,
      siteName: "Walk and Tour Copenhagen",
      locale,
      type: "website",
      images: ["/walkandtour/branding/logo-transparent.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const {locale} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <Suspense fallback={null}>
        <PublicAnalytics />
      </Suspense>
      <Header />
      <main className="pt-12 md:pt-24">{children}</main>
    </NextIntlClientProvider>
  );
}

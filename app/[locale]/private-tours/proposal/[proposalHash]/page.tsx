import {notFound} from "next/navigation";
import ProposalPageClient from "@/components/proposals/ProposalPageClient";
import {type AppLocale, routing} from "@/i18n/routing";

type ProposalPageProps = {
  params: Promise<{ locale: string; proposalHash: string }>;
};

const isValidLocale = (locale: string): locale is AppLocale =>
  routing.locales.includes(locale as AppLocale);

export default async function ProposalPage({params}: ProposalPageProps) {
  const {locale, proposalHash} = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return <ProposalPageClient locale={locale} proposalHash={proposalHash}/>;
}

"use client";

import { Calendar, Clock, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

type TourDetailSidebarFallbackProps = {
  price?: string;
  duration?: string;
  cancellationType?: string;
  requestedBookingType?: "privateTours" | "companyTours";
  requestedItemId?: string;
};

export default function TourDetailSidebarFallback({
  price,
  duration,
  cancellationType,
  requestedBookingType,
  requestedItemId,
}: TourDetailSidebarFallbackProps) {
  const t = useTranslations("tourDetail.sidebarFallback");
  const locale = useLocale() as AppLocale;
  const hasPrice = Boolean(price);
  const bookTourPath = getPathname({locale, href: "/book-tour"});
  const ctaHref =
    requestedBookingType && requestedItemId
      ? `${ bookTourPath }?${ new URLSearchParams({
        bookingType: requestedBookingType,
        selectedItemId: requestedItemId,
      }).toString() }`
      : bookTourPath;
  const details = [
    { icon: Calendar, label: t("dateLabel"), value: t("dateValue") },
    { icon: Clock, label: t("durationLabel"), value: duration },
    { icon: Shield, label: t("cancellationLabel"), value: cancellationType },
  ];

  return (
    <div className="relative">
      <div className="border-b border-[#dfd6c9]/70 bg-[radial-gradient(circle_at_top_left,rgba(194,67,67,0.08),transparent_45%)] p-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#c24343]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c24343]">
            {t("eyebrow")}
          </span>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          {hasPrice ? (
            <>
              <span className="text-4xl font-bold tracking-tight text-[#2a221a]">
                {price}
              </span>
              <span className="text-sm text-[#7a6a58]">{t("priceSuffix")}</span>
            </>
          ) : (
            <div className="space-y-1">
              <p className="text-base font-semibold leading-snug text-[#2a221a]">
                {t("quoteTitle")}
              </p>
              <p className="text-sm leading-relaxed text-[#5b4d3c]">
                {t("quoteDescription")}
              </p>
            </div>
          )}
        </div>
        {hasPrice ? (
          <p className="mt-2 text-xs text-[#7a6a58]">
            {t("priceFootnote")}
          </p>
        ) : null}
      </div>

      <div className="space-y-1 p-4">
        {details.map((item, index) => (
          <div
            key={index}
            className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-[#2b666d]/5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2b666d]/10 text-[#2b666d] transition-colors group-hover:bg-[#2b666d] group-hover:text-[#fcf8f1]">
              <item.icon className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium uppercase tracking-widest text-[#7a6a58]">
                {item.label}
              </p>
              <p className="text-sm font-semibold tracking-tight text-[#2a221a]">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 pt-2">
        <Link
          href={ ctaHref }
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl bg-[#c24343] py-4 text-base font-semibold text-[#fcf8f1] shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
        >
          <span className="relative z-10">{t("cta")}</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </Link>

        <div className="mt-4 flex items-center justify-center gap-2">
          <Shield className="h-4 w-4 text-[#2b666d]" />
          <p className="text-xs text-[#5b4d3c]">
            {t("supportingText")}
          </p>
        </div>
      </div>
    </div>
  );
}

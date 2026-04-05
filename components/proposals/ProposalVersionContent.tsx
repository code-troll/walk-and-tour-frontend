"use client";

import {CalendarDays, Check, CircleAlert, Clock, MapPin, Route, ScrollText, X} from "lucide-react";
import type {PublicProposalVersion} from "@/lib/public-proposal-model";
import ProposalPaymentCta from "@/components/proposals/ProposalPaymentCta";

type ProposalVersionContentProps = {
  version: PublicProposalVersion;
  language: string;
};

const formatPrice = (amount: string, currency: string) => {
  const num = Number.parseFloat(amount);
  if (Number.isNaN(num)) return `${amount} ${currency}`;
  try {
    return new Intl.NumberFormat(undefined, {style: "currency", currency}).format(num);
  } catch {
    return `${num.toFixed(2)} ${currency}`;
  }
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${mins}min`;
};

const formatDateTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }) + " at " + date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
};

const ContentDivider = () => (
  <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
    <div className="h-px w-full bg-[#e8dfd4]"/>
  </div>
);

export default function ProposalVersionContent({version, language}: ProposalVersionContentProps) {
  const hasIncluded = version.included.length > 0 || version.notIncluded.length > 0;
  const hasPoints = version.startPoint || version.endPoint;
  const hasQuickInfo = version.tourDate || version.durationMinutes;
  const priceLabel = formatPrice(version.priceAmount, version.priceCurrency);

  return (
    <div className="bg-[#fcfaf7]">
      {/* Title + Price header */}
      <section className="pt-10 pb-8">
        <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-[#2a221a]">{version.title}</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#2b666d]">{priceLabel}</span>
            </div>
          </div>

          {hasQuickInfo && (
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              {version.tourDate && (
                <div className="inline-flex items-center gap-2.5 text-base text-[#3d3124]">
                  <CalendarDays className="h-5 w-5 text-[#c24343]"/>
                  <span>{formatDateTime(version.tourDate)}</span>
                </div>
              )}
              {version.durationMinutes && (
                <div className="inline-flex items-center gap-2.5 text-base text-[#3d3124]">
                  <Clock className="h-5 w-5 text-[#c24343]"/>
                  <span>{formatDuration(version.durationMinutes)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Description */}
      {version.description && (
        <>
          <ContentDivider/>
          <section className="py-8">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2b666d]/10">
                  <ScrollText className="h-5 w-5 text-[#2b666d]"/>
                </span>
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-[#2a221a]">About this tour</h3>
                  <p className="text-base leading-relaxed text-[#3d3124] whitespace-pre-line">{version.description}</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Itinerary */}
      {version.itineraryDescription && (
        <>
          <ContentDivider/>
          <section className="py-8">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#9a6a2f]/10">
                  <Route className="h-5 w-5 text-[#9a6a2f]"/>
                </span>
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-[#2a221a]">Itinerary</h3>
                  <p className="text-base leading-relaxed text-[#3d3124] whitespace-pre-line">{version.itineraryDescription}</p>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Start / End Points */}
      {hasPoints && (
        <>
          <ContentDivider/>
          <section className="py-8">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <h3 className="mb-5 text-lg font-semibold text-[#2a221a]">Meeting Points</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {version.startPoint && (
                  <div className="flex items-start gap-4 rounded-2xl border border-[#e8dfd4] bg-white p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#2b666d]/10">
                      <MapPin className="h-5 w-5 text-[#2b666d]"/>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2b666d]">Start Point</p>
                      {version.startPoint.label && (
                        <p className="mt-1.5 text-base text-[#3d3124]">{version.startPoint.label}</p>
                      )}
                    </div>
                  </div>
                )}
                {version.endPoint && (
                  <div className="flex items-start gap-4 rounded-2xl border border-[#e8dfd4] bg-white p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#c24343]/10">
                      <MapPin className="h-5 w-5 text-[#c24343]"/>
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c24343]">End Point</p>
                      {version.endPoint.label && (
                        <p className="mt-1.5 text-base text-[#3d3124]">{version.endPoint.label}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Included / Not Included */}
      {hasIncluded && (
        <>
          <ContentDivider/>
          <section className="py-8">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <h3 className="mb-5 text-lg font-semibold text-[#2a221a]">What&apos;s Included</h3>
              <div className="grid gap-5 md:grid-cols-2">
                {version.included.length > 0 && (
                  <article className="relative overflow-hidden rounded-3xl border-2 border-[#2b666d]/20 bg-[#2b666d]/5">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#2b666d]/10"/>
                    <div className="relative p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2b666d] text-[#fcf8f1]">
                          <Check className="h-4 w-4" strokeWidth={2.5}/>
                        </span>
                        <h4 className="text-base font-bold uppercase tracking-wider text-[#2b666d]">Included</h4>
                      </div>
                      <ul className="space-y-4">
                        {version.included.map((item, i) => (
                          <li key={`inc-${i}`} className="flex items-start gap-3">
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2b666d]/20">
                              <Check className="h-3 w-3 text-[#2b666d]" strokeWidth={2.5}/>
                            </span>
                            <span className="text-base leading-relaxed text-[#182619]/90">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                )}

                {version.notIncluded.length > 0 && (
                  <article className="relative overflow-hidden rounded-3xl border border-[#c24343]/25 bg-[#c24343]/6">
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#c24343]/12"/>
                    <div className="relative p-6">
                      <div className="mb-5 flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#c24343]/15 text-[#c24343]">
                          <CircleAlert className="h-4 w-4" strokeWidth={2}/>
                        </span>
                        <h4 className="text-base font-bold uppercase tracking-wider text-[#c24343]">Not Included</h4>
                      </div>
                      <ul className="space-y-4">
                        {version.notIncluded.map((item, i) => (
                          <li key={`not-${i}`} className="flex items-start gap-3">
                            <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#c24343]/15">
                              <X className="h-3 w-3 text-[#c24343]" strokeWidth={2.5}/>
                            </span>
                            <span className="text-base leading-relaxed text-[#5b4a46]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Cancellation Policy */}
      {version.cancellationPolicy && (
        <>
          <ContentDivider/>
          <section className="py-8">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <h3 className="mb-3 text-lg font-semibold text-[#2a221a]">Cancellation Policy</h3>
              <div className="rounded-2xl border border-[#e8dfd4] bg-white p-5">
                <p className="text-base leading-relaxed text-[#3d3124] whitespace-pre-line">{version.cancellationPolicy}</p>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Payment CTA */}
      {version.stripePaymentLink && (
        <>
          <ContentDivider/>
          <section className="py-10">
            <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
              <ProposalPaymentCta
                stripePaymentLink={version.stripePaymentLink}
                priceLabel={priceLabel}
                versionTitle={version.title}
              />
            </div>
          </section>
        </>
      )}

      {/* Bottom spacing */}
      <div className="pb-6"/>
    </div>
  );
}

"use client";

import {ArrowRight, ShieldCheck} from "lucide-react";

type ProposalPaymentCtaProps = {
  stripePaymentLink: string;
  priceLabel: string;
  versionTitle: string;
};

export default function ProposalPaymentCta({stripePaymentLink, priceLabel, versionTitle}: ProposalPaymentCtaProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#e8dfd4] bg-white">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#2b666d]/5"/>
      <div className="relative flex flex-col items-center gap-5 p-8 text-center sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2b666d]/10">
          <ShieldCheck className="h-6 w-6 text-[#2b666d]"/>
        </div>
        <div>
          <p className="text-lg font-semibold text-[#2a221a]">
            Book &ldquo;{versionTitle}&rdquo;
          </p>
          <p className="mt-1 text-2xl font-bold text-[#2b666d]">{priceLabel}</p>
        </div>
        <a
          href={stripePaymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 rounded-full bg-[#c24343] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#c24343]/20 transition-all hover:bg-[#a83838] hover:shadow-[#c24343]/30"
        >
          Proceed to Payment
          <ArrowRight className="h-5 w-5"/>
        </a>
        <p className="text-xs text-[#9a8d7e]">Secure payment powered by Stripe</p>
      </div>
    </div>
  );
}

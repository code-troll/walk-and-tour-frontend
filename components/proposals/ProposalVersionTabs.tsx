"use client";

import type {PublicProposalVersion} from "@/lib/public-proposal-model";

type ProposalVersionTabsProps = {
  versions: PublicProposalVersion[];
  activeIndex: number;
  onTabChange: (index: number) => void;
};

export default function ProposalVersionTabs({versions, activeIndex, onTabChange}: ProposalVersionTabsProps) {
  return (
    <section className="bg-gradient-to-b from-[#f4ece0] to-[#fcfaf7] py-8 sm:py-10">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="mb-5 flex flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#2b666d] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
            <span aria-hidden className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#f5c15a]"/>
            {versions.length} options available
          </span>
          <h2 className="mt-3 text-xl font-bold text-[#21343b] sm:text-2xl">
            Choose your proposal option
          </h2>
          <p className="mt-1 text-sm text-[#5b4d3c]">
            Tap a tab below to compare the available proposals.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Proposal options"
          className="flex flex-wrap justify-center gap-3 sm:gap-4"
        >
          {versions.map((version, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={version.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(index)}
                className={[
                  "group relative flex min-w-[160px] flex-1 flex-col items-start gap-1 rounded-2xl border-2 px-5 py-4 text-left transition-all duration-200 sm:flex-none sm:min-w-[200px]",
                  isActive
                    ? "border-[#2b666d] bg-[#2b666d] text-white shadow-lg shadow-[#2b666d]/25 -translate-y-0.5"
                    : "border-[#e8dfd4] bg-white text-[#21343b] shadow-sm hover:border-[#2b666d] hover:-translate-y-0.5 hover:shadow-md",
                ].join(" ")}
              >
                <span
                  className={[
                    "text-[11px] font-bold uppercase tracking-wider",
                    isActive ? "text-[#f5c15a]" : "text-[#2b666d]",
                  ].join(" ")}
                >
                  Option {index + 1}
                </span>
                <span className="text-base font-bold leading-snug">
                  {version.title}
                </span>
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-[#2b666d]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

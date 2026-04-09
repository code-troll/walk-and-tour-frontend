"use client";

import type {PublicProposalVersion} from "@/lib/public-proposal-model";

type ProposalVersionTabsProps = {
  versions: PublicProposalVersion[];
  activeIndex: number;
  onTabChange: (index: number) => void;
};

export default function ProposalVersionTabs({versions, activeIndex, onTabChange}: ProposalVersionTabsProps) {
  return (
    <section className="bg-[#fcfaf7] pt-6 pb-2 sm:pt-8">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div
          role="tablist"
          aria-label="Proposal options"
          className="mx-auto inline-flex w-full max-w-2xl items-center gap-1 rounded-full border border-[#e8dfd4] bg-[#f4ece0] p-1 shadow-inner"
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
                  "flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-150",
                  isActive
                    ? "bg-white text-[#2b666d] shadow-sm"
                    : "text-[#5b4d3c] hover:text-[#2b666d]",
                ].join(" ")}
              >
                Proposal {index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

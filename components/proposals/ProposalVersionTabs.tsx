"use client";

import type {PublicProposalVersion} from "@/lib/public-proposal-model";

type ProposalVersionTabsProps = {
  versions: PublicProposalVersion[];
  activeIndex: number;
  onTabChange: (index: number) => void;
};

export default function ProposalVersionTabs({versions, activeIndex, onTabChange}: ProposalVersionTabsProps) {
  return (
    <section className="bg-[#fcfaf7]">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className="flex gap-0 overflow-x-auto border-b border-[#e8dfd4]">
          {versions.map((version, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onTabChange(index)}
                className={[
                  "relative whitespace-nowrap px-6 py-4 text-sm font-semibold transition-colors",
                  isActive
                    ? "text-[#2b666d]"
                    : "text-[#5b4d3c] hover:text-[#2b666d]",
                ].join(" ")}
              >
                Proposal {index + 1}
                {isActive && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-[#2b666d]"/>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

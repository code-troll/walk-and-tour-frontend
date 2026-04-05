"use client";

import {useEffect, useState} from "react";
import type {AppLocale} from "@/i18n/routing";
import NotFound from "@/app/not-found";
import Footer from "@/components/layout/Footer";
import {PublicErrorState, PublicLoadingState} from "@/components/public/PublicRequestState";
import ProposalHeroSection from "@/components/proposals/ProposalHeroSection";
import ProposalVersionTabs from "@/components/proposals/ProposalVersionTabs";
import ProposalVersionContent from "@/components/proposals/ProposalVersionContent";
import {getPublicProposalByHash, getProposalMediaUrl} from "@/lib/public-proposal-client";
import type {PublicProposal} from "@/lib/public-proposal-model";

type ProposalPageClientProps = {
  locale: AppLocale;
  proposalHash: string;
};

export default function ProposalPageClient({locale, proposalHash}: ProposalPageClientProps) {
  const [proposal, setProposal] = useState<PublicProposal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMissing, setIsMissing] = useState(false);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      setIsMissing(false);

      try {
        const result = await getPublicProposalByHash(proposalHash);
        if (!result || result.versions.length === 0) {
          setIsMissing(true);
          return;
        }
        setProposal(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [proposalHash]);

  useEffect(() => {
    if (proposal?.versions?.[0]) {
      document.title = `${proposal.versions[0].title} | Walk and Tour`;
    }
  }, [proposal]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfaf7]">
        <PublicLoadingState label="Loading proposal..."/>
        <Footer/>
      </div>
    );
  }

  if (isMissing) {
    return <NotFound/>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fcfaf7]">
        <PublicErrorState description={error}/>
        <Footer/>
      </div>
    );
  }

  if (!proposal) return null;

  const imageUrl = proposal.mediaItems.length > 0
    ? getProposalMediaUrl(proposalHash, proposal.mediaItems[0].mediaId)
    : null;
  const activeVersion = proposal.versions[activeVersionIndex] ?? proposal.versions[0];
  const firstTitle = proposal.versions[0]?.title ?? "Your Tour Proposal";

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#2a221a]">
      <ProposalHeroSection
        recipientName={proposal.recipientName}
        imageUrl={imageUrl}
        title={firstTitle}
      />

      {proposal.versions.length > 1 && (
        <ProposalVersionTabs
          versions={proposal.versions}
          activeIndex={activeVersionIndex}
          onTabChange={setActiveVersionIndex}
        />
      )}

      {activeVersion && (
        <ProposalVersionContent
          version={activeVersion}
          language={proposal.language}
        />
      )}

      <Footer/>
    </div>
  );
}

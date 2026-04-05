"use client";

import {useEffect, useState} from "react";

type ProposalHeroSectionProps = {
  recipientName: string | null;
  imageUrl: string | null;
  title: string;
};

export default function ProposalHeroSection({recipientName, imageUrl, title}: ProposalHeroSectionProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new window.Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = imageUrl;
  }, [imageUrl]);

  return (
    <section className="bg-[#fcfaf7]">
      {/* Image banner */}
      {imageUrl && (
        <div className="relative w-full overflow-hidden" style={{maxHeight: 480}}>
          {!loaded && <div className="h-72 w-full animate-pulse bg-[#efe8de] md:h-96"/>}
          {loaded && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={title}
                className="w-full object-cover"
                style={{maxHeight: 480}}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#fcfaf7] via-transparent to-transparent"/>
            </>
          )}
        </div>
      )}

      {/* Title block */}
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        <div className={imageUrl ? "-mt-16 relative z-10 pb-6" : "pt-14 pb-6 md:pt-18"}>
          {recipientName && (
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-[#9a6a2f]">
              Prepared for {recipientName}
            </p>
          )}
          <h1 className="text-3xl font-semibold leading-tight text-[#2b666d] sm:text-4xl md:text-[2.75rem]">
            {title}
          </h1>
        </div>
      </div>
    </section>
  );
}

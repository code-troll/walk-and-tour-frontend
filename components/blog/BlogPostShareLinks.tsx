"use client";

import { useMemo, useState } from "react";
import { LinkIcon } from "lucide-react";
import Image from "next/image";

type BlogPostShareLabels = {
  title: string;
  copyLink: string;
  copied: string;
  facebook: string;
  x: string;
  linkedin: string;
  whatsapp: string;
};

type BlogPostShareLinksProps = {
  title: string;
  shareUrl: string;
  labels: BlogPostShareLabels;
};

const buildShareUrl = (base: string, query: Record<string, string>) => {
  const params = new URLSearchParams(query);
  return `${ base }?${ params.toString() }`;
};

export default function BlogPostShareLinks({
                                             title,
                                             shareUrl,
                                             labels,
                                           }: BlogPostShareLinksProps) {
  const [copied, setCopied] = useState(false);

  const shareTargets = useMemo(() => {
    if (!shareUrl) {
      return [];
    }

    return [
      {
        id: "facebook",
        label: labels.facebook,
        image: <Image src="/walkandtour/social/color/facebook.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://www.facebook.com/sharer/sharer.php", {
          u: shareUrl,
        }),
      },
      {
        id: "x",
        label: labels.x,
        image: <Image src="/walkandtour/social/color/x.png" alt={ title } width={ 28 } height={ 28 }/>,
        href: buildShareUrl("https://twitter.com/intent/tweet", {
          url: shareUrl,
          text: title,
        }),
      },
      {
        id: "linkedin",
        label: labels.linkedin,
        image: <Image src="/walkandtour/social/color/linkedin.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://www.linkedin.com/sharing/share-offsite/", {
          url: shareUrl,
        }),
      },
      {
        id: "whatsapp",
        label: labels.whatsapp,
        image: <Image src="/walkandtour/social/color/whatsapp.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://wa.me/", {
          text: `${ title } ${ shareUrl }`,
        }),
      },
    ];
  }, [labels.facebook, labels.linkedin, labels.whatsapp, labels.x, shareUrl, title]);

  const handleCopy = async () => {
    if (!shareUrl || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1_500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-3">
      { shareTargets.map((target) => (
        <a
          key={ target.id }
          href={ target.href }
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#3d3124] transition-colors hover:border-[#c24343] hover:text-[#c24343]"
        >
          { target.image }
        </a>
      )) }
      <button
        type="button"
        onClick={ handleCopy }
        className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-semibold text-[#3d3124] transition-colors hover:border-[#c24343] hover:text-[#c24343]"
      >
        <LinkIcon className="h-5 w-5"/>
        { copied ? labels.copied : "" }
      </button>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const resolveShareUrl = (shareUrl: string, browserUrl: string) => {
  const trimmedShareUrl = shareUrl.trim();
  const trimmedBrowserUrl = browserUrl.trim();

  if (/^https?:\/\//i.test(trimmedShareUrl)) {
    return trimmedShareUrl;
  }

  if (trimmedShareUrl && trimmedBrowserUrl) {
    try {
      return new URL(trimmedShareUrl, trimmedBrowserUrl).toString();
    } catch {
      return trimmedShareUrl;
    }
  }

  return trimmedShareUrl || trimmedBrowserUrl;
};

const fallbackCopyText = (value: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.pointerEvents = "none";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, value.length);

  try {
    return document.execCommand("copy");
  } finally {
    document.body.removeChild(textArea);
  }
};

export default function BlogPostShareLinks({
                                             title,
                                             shareUrl,
                                             labels,
                                           }: BlogPostShareLinksProps) {
  const [copied, setCopied] = useState(false);
  const [browserUrl, setBrowserUrl] = useState("");
  const resetCopiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setBrowserUrl(window.location.href);

    return () => {
      if (resetCopiedTimeoutRef.current !== null) {
        window.clearTimeout(resetCopiedTimeoutRef.current);
      }
    };
  }, []);

  const resolvedShareUrl = useMemo(
    () => resolveShareUrl(shareUrl, browserUrl),
    [browserUrl, shareUrl],
  );

  const shareTargets = useMemo(() => {
    if (!resolvedShareUrl) {
      return [];
    }

    return [
      {
        id: "facebook",
        label: labels.facebook,
        image: <Image src="/walkandtour/social/color/facebook.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://www.facebook.com/sharer/sharer.php", {
          u: resolvedShareUrl,
        }),
      },
      {
        id: "x",
        label: labels.x,
        image: <Image src="/walkandtour/social/color/x.png" alt={ title } width={ 28 } height={ 28 }/>,
        href: buildShareUrl("https://twitter.com/intent/tweet", {
          url: resolvedShareUrl,
          text: title,
        }),
      },
      {
        id: "linkedin",
        label: labels.linkedin,
        image: <Image src="/walkandtour/social/color/linkedin.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://www.linkedin.com/sharing/share-offsite/", {
          url: resolvedShareUrl,
        }),
      },
      {
        id: "whatsapp",
        label: labels.whatsapp,
        image: <Image src="/walkandtour/social/color/whatsapp.png" alt={ title } width={ 28 }
                      height={ 28 }/>,
        href: buildShareUrl("https://wa.me/", {
          text: `${ title } ${ resolvedShareUrl }`,
        }),
      },
    ];
  }, [labels.facebook, labels.linkedin, labels.whatsapp, labels.x, resolvedShareUrl, title]);

  const handleCopy = async () => {
    if (!resolvedShareUrl) {
      return;
    }

    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(resolvedShareUrl);
      } else if (!fallbackCopyText(resolvedShareUrl)) {
        throw new Error("fallback copy failed");
      }

      setCopied(true);
      if (resetCopiedTimeoutRef.current !== null) {
        window.clearTimeout(resetCopiedTimeoutRef.current);
      }
      resetCopiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 1_500);
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

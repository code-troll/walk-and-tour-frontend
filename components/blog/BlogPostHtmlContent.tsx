"use client";

import { useEffect, useMemo, useRef } from "react";

import BlogInlineTourCard from "@/components/blog/BlogInlineTourCard";
import type { AppLocale } from "@/i18n/routing";
import { mountTuritopWidgets, TURITOP_EMBED_MODE } from "@/lib/turitop/widget";

type TourCardEntry = {
  slug: string;
  alignment: "left" | "center" | "right";
};

const TOUR_CARD_PLACEHOLDER_PREFIX = "___TOUR_CARD_";
const TOUR_CARD_PLACEHOLDER_SUFFIX = "___";

const TOUR_CARD_PATTERN =
  /<div\b[^>]*data-blog-tour-card="true"[^>]*><\/div>/gi;

const extractTourSlug = (markup: string) => {
  const match = markup.match(/data-tour-slug="([^"]*)"/);
  return match?.[1] ?? "";
};

const extractTourCardAlignment = (markup: string) => {
  const match = markup.match(/data-tour-card-alignment="([^"]*)"/);
  const value = match?.[1];
  return value === "left" || value === "right" ? value : "center" as const;
};

const splitContentWithTourCards = (contentHtml: string) => {
  const tourCards: TourCardEntry[] = [];
  const htmlWithPlaceholders = contentHtml.replace(TOUR_CARD_PATTERN, (match) => {
    const slug = extractTourSlug(match);
    if (!slug) return match;

    const index = tourCards.length;
    tourCards.push({
      slug,
      alignment: extractTourCardAlignment(match),
    });
    return `${TOUR_CARD_PLACEHOLDER_PREFIX}${index}${TOUR_CARD_PLACEHOLDER_SUFFIX}`;
  });

  if (tourCards.length === 0) {
    return { segments: [{ type: "html" as const, html: contentHtml }], tourCards };
  }

  const segments: Array<{ type: "html"; html: string } | { type: "tourCard"; index: number }> = [];
  const parts = htmlWithPlaceholders.split(
    new RegExp(`${TOUR_CARD_PLACEHOLDER_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\d+)${TOUR_CARD_PLACEHOLDER_SUFFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"),
  );

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      if (parts[i]) {
        segments.push({ type: "html", html: parts[i] });
      }
    } else {
      segments.push({ type: "tourCard", index: Number.parseInt(parts[i], 10) });
    }
  }

  return { segments, tourCards };
};

type BlogPostHtmlContentProps = {
  className: string;
  contentHtml: string;
  locale?: AppLocale;
};

function HtmlSegment({
  className,
  html,
}: {
  className?: string;
  html: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const widgetContainers = [
      ...root.querySelectorAll<HTMLElement>('[data-blog-turitop="true"]'),
    ];
    if (!widgetContainers.length) return;

    widgetContainers.forEach((container) => {
      container.style.overflowX = "hidden";
      container.style.overflowY = "auto";
      container.style.setProperty("-webkit-overflow-scrolling", "touch");
    });

    mountTuritopWidgets(
      widgetContainers
        .map((container) => ({
          container,
          embed: container.dataset.embed || TURITOP_EMBED_MODE,
          language: container.dataset.lang || "",
          service: container.dataset.service || "",
        }))
        .filter((widget) => widget.language && widget.service),
    );

    return () => {
      widgetContainers.forEach((container) => {
        container.innerHTML = "";
      });
    };
  }, [html]);

  return (
    <div
      ref={rootRef}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default function BlogPostHtmlContent({
  className,
  contentHtml,
  locale = "en",
}: BlogPostHtmlContentProps) {
  const { segments, tourCards } = useMemo(
    () => splitContentWithTourCards(contentHtml),
    [contentHtml],
  );

  if (tourCards.length === 0) {
    return <HtmlSegment className={className} html={contentHtml} />;
  }

  return (
    <div className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "html") {
          return (
            <HtmlSegment
              key={`html-${index}`}
              html={segment.html}
            />
          );
        }

        const card = tourCards[segment.index];
        return (
          <BlogInlineTourCard
            key={`tour-${card.slug}-${index}`}
            slug={card.slug}
            locale={locale}
            alignment={card.alignment}
          />
        );
      })}
    </div>
  );
}

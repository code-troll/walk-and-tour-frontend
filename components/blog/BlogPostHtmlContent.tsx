"use client";

import { useEffect, useRef } from "react";
import { mountTuritopWidgets, TURITOP_EMBED_MODE } from "@/lib/turitop/widget";

type BlogPostHtmlContentProps = {
  className: string;
  contentHtml: string;
};

export default function BlogPostHtmlContent({
  className,
  contentHtml,
}: BlogPostHtmlContentProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const widgetContainers = [...root.querySelectorAll<HTMLElement>("[data-blog-turitop=\"true\"]")];
    if (!widgetContainers.length) {
      return;
    }

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
  }, [contentHtml]);

  return (
    <div
      ref={ rootRef }
      className={ className }
      dangerouslySetInnerHTML={ { __html: contentHtml } }
    />
  );
}

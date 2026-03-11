"use client";

import { useEffect, useRef } from "react";

const TURITOP_SCRIPT_ID = "js-turitop";
const TURITOP_SCRIPT_SRC = "https://app.turitop.com/js/load-turitop.min.js";

type TourDetailSidebarPlaceholderProps = {
  bookingReferenceId?: string;
  language?: string;
};

const mountTuritopWidget = ({
  container,
  bookingReferenceId,
  language,
}: {
  container: HTMLDivElement;
  bookingReferenceId: string;
  language: string;
}) => {
  container.innerHTML = "";

  const widget = document.createElement("div");
  widget.className = "load-turitop";
  widget.dataset.service = bookingReferenceId;
  widget.dataset.lang = language;
  widget.dataset.embed = "box";
  container.appendChild(widget);

  const existingScript = document.getElementById(TURITOP_SCRIPT_ID);
  if (existingScript) {
    existingScript.remove();
  }

  const script = document.createElement("script");
  script.id = TURITOP_SCRIPT_ID;
  script.src = TURITOP_SCRIPT_SRC;
  script.async = true;
  script.dataset.company = "W420";
  script.dataset.buttoncolor = "green";
  script.dataset.afftag = "ttafid";
  document.body.appendChild(script);
};

export default function TourDetailSidebarPlaceholder({
  bookingReferenceId,
  language,
}: TourDetailSidebarPlaceholderProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!bookingReferenceId || !language || !container) {
      return;
    }

    mountTuritopWidget({
      container,
      bookingReferenceId,
      language,
    });

    return () => {
      container.innerHTML = "";
    };
  }, [bookingReferenceId, language]);

  if (!bookingReferenceId || !language) {
    return null;
  }

  return (
    <div className="pt-6 px-0 md:px-6 lg:pt-0 lg:px-12 lg:pl-0">
      <div className="rounded-3xl bg-[#fcfaf7] md:bg-white p-0 md:shadow-sm ring-0 md:ring-1  md:ring-[#e8ddd2] overflow-hidden">
        <div ref={ containerRef } className="my-4 md:my-0" />
      </div>
    </div>
  );
}

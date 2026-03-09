"use client";

import { useEffect, useRef, useState } from "react";

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
  const [hasMounted, setHasMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !bookingReferenceId || !language || !containerRef.current) {
      return;
    }

    mountTuritopWidget({
      container: containerRef.current,
      bookingReferenceId,
      language,
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [bookingReferenceId, hasMounted, language]);

  if (!bookingReferenceId || !language || !hasMounted) {
    return null;
  }

  return (
    <div className="mt-6 px-6 lg:px-12 lg:pl-0">
      <div className="rounded-3xl bg-white p-0 shadow-sm ring-1 ring-[#e8ddd2] overflow-hidden">
        <div ref={ containerRef } className="my-4 md:my-0" />
      </div>
    </div>
  );
}

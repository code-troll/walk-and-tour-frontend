"use client";

import { useEffect, useRef } from "react";
import { Calendar, Clock, Shield, Sparkles, Users } from "lucide-react";

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

  return (
    <div className="pt-6 px-0 md:px-6 lg:pt-0 lg:px-12 lg:pl-0">
      <div
        className="rounded-3xl bg-[#fcfaf7] md:bg-white p-0 md:shadow-sm ring-0 md:ring-1  md:ring-[#e8ddd2] overflow-hidden">
        { !bookingReferenceId || !language ? (
          <div className="relative">
            <div className="border-b border-border/60 p-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent"/>
                <span className="text-xs font-semibold uppercase tracking-wider text-accent">
              Best Value
            </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight text-foreground">$149</span>
                <span className="text-sm text-muted-foreground">/ person</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                All taxes and fees included
              </p>
            </div>

            <div className="space-y-1 p-4">
              { [
                {icon: Calendar, label: "Choose your date", value: "Select"},
                {icon: Clock, label: "Duration", value: "2-3 hours"},
                {icon: Users, label: "Group size", value: "Max 15 people"},
                {icon: Shield, label: "Cancellation", value: "Free up to 24h"},
              ].map((item, index) => (
                <div
                  key={ index }
                  className="group flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted/50"
                >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <item.icon className="h-5 w-5" strokeWidth={ 1.5 }/>
              </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">{ item.label }</p>
                    <p className="text-sm font-medium text-foreground">{ item.value }</p>
                  </div>
                </div>
              )) }
            </div>

            <div className="p-6 pt-2">
              <button
                className="group relative w-full overflow-hidden rounded-2xl bg-accent py-4 text-base font-semibold text-accent-foreground shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
                <span className="relative z-10">Check Availability</span>
                <div
                  className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"/>
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-center">
                <Shield className="h-4 w-4 text-primary"/>
                <p className="text-xs text-muted-foreground">
                  Reserve now, pay later - secure your spot
                </p>
              </div>
            </div>
          </div>
        ) : <div ref={ containerRef } className="my-4 md:my-0"/> }
      </div>
    </div>
  );
}

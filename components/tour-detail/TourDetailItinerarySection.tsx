"use client";

import { useState } from "react";
import {
  Bike,
  BusFront,
  CarFront,
  CircleEllipsis,
  Clock3,
  Footprints,
  MapPinned,
  ShipWheel,
  TrainFront,
  TramFront,
} from "lucide-react";
import type { ItineraryUiLabels } from "@/lib/detail-page-utils";
import type { CommuteMode, ResolvedTourItinerary } from "@/lib/tour-itineraries";
import TourDetailCollapsibleSection from "@/components/tour-detail/TourDetailCollapsibleSection";

type TourDetailItinerarySectionProps = {
  title: string;
  description: string;
  itinerary?: ResolvedTourItinerary | null;
  uiLabels?: ItineraryUiLabels;
};

const commuteModeIcons: Record<
  CommuteMode,
  typeof Footprints
> = {
  walk: Footprints,
  bike: Bike,
  bus: BusFront,
  train: TrainFront,
  metro: TrainFront,
  tram: TramFront,
  ferry: ShipWheel,
  privateTransport: CarFront,
  boat: ShipWheel,
  other: CircleEllipsis,
};

export default function TourDetailItinerarySection({
                                                     title,
                                                     itinerary = null,
                                                     description,
                                                     uiLabels,
                                                   }: TourDetailItinerarySectionProps) {
  const [hoveredConnectionStopId, setHoveredConnectionStopId] = useState<string | null>(null);
  const [hoveredStopId, setHoveredStopId] = useState<string | null>(null);
  const paragraphs = description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const totalStops = itinerary?.stops.length ?? 0;
  const hasStructuredItinerary = Boolean(itinerary?.stops.length && uiLabels);
  const structuredItinerary = hasStructuredItinerary ? itinerary : null;
  const buildGoogleMapsHref = (lat: number, lng: number) => (
    `https://www.google.com/maps/search/?api=1&query=${ lat },${ lng }`
  );

  return (
    <TourDetailCollapsibleSection title={ title } icon="itinerary">
      { structuredItinerary && uiLabels ? (
        <div className="flex flex-col pt-1">
          { structuredItinerary.stops.map((stop, index) => {
            const stopId = `${ stop.id }_${ index }`
            const nextConnection = stop.nextConnection;
            const isLast = index === totalStops - 1;
            const previousStopId = index > 0 ? `${ structuredItinerary.stops[index - 1]?.id }_${ index - 1 }` : null;
            const highlightIncomingConnection = previousStopId === hoveredConnectionStopId;
            const highlightOutgoingConnection = stopId === hoveredConnectionStopId;
            const highlightStopNumber = hoveredStopId === stopId;
            const ConnectionIcon = nextConnection
              ? commuteModeIcons[nextConnection.mode]
              : null;

            return (
              <div key={ stopId } className="relative flex items-center gap-5">
                <div className="absolute bottom-0 left-1 top-[-25] flex flex-col items-center">
                  { index === 0 && <div className="h-1/2"/> }
                  { index > 0 ? (
                    <div
                      className={ `h-1/2 w-0.5 transition-colors duration-150 ${
                        highlightIncomingConnection ? "bg-[#2b666d]" : "bg-[#d8c8b7]"
                      }` }
                    />
                  ) : null }
                  <div
                    className={ `relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors duration-150 ${
                      highlightStopNumber
                        ? "border-[#2b666d] bg-[#2b666d] text-[#ffffff]"
                        : "border-[#2b666d] bg-[#ffffff] text-[#2b666d]"
                    }` }
                  >
                    { index + 1 }
                  </div>
                  { !isLast ? (
                    <div
                      className={ `h-1/2 w-0.5 transition-colors duration-150 ${
                        highlightOutgoingConnection ? "bg-[#2b666d]" : "bg-[#d8c8b7]"
                      }` }
                    />
                  ) : (
                    <div className="h-1/2"/>
                  ) }
                </div>

                <div
                  className={ `flex-1 pl-12 ${ isLast ? "" : "pb-4" }` }
                  onMouseEnter={ () => setHoveredStopId(stopId) }
                  onMouseLeave={ () => setHoveredStopId(null) }
                >
                  <div className="rounded-xl border border-[#d8c8b7] bg-[#ffffff] px-5 py-6">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-lg font-semibold text-[#000000]">
                        { stop.title }
                      </h3>
                      <p className="text-sm leading-relaxed text-[#5b4d3c]">
                        { stop.description }
                      </p>
                    </div>

                    { stop.durationMinutes !== undefined || stop.coordinates ? (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        { stop.durationMinutes !== undefined ? (
                          <div className="flex items-center gap-2 rounded-full bg-[#2b666d]/8 px-3 py-1">
                            <Clock3 className="h-4 w-4 text-[#2b666d]" strokeWidth={ 2 }/>
                            <span className="text-xs font-medium uppercase tracking-wide text-[#5b4d3c]">
                              { uiLabels.stopDuration }
                            </span>
                            <span className="text-lg font-semibold text-[#2b666d]">{ stop.durationMinutes }</span>
                            <span className="text-xs font-medium uppercase tracking-wide text-[#5b4d3c]">min</span>
                          </div>
                        ) : null }

                        { stop.coordinates ? (
                          <a
                            href={ buildGoogleMapsHref(stop.coordinates.lat, stop.coordinates.lng) }
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full border border-[#2b666d]/20 px-3 py-[calc(var(--spacing)*1.6)] text-sm font-medium text-[#2b666d] transition-colors duration-200 hover:border-[#2b666d] hover:bg-[#2b666d]/6"
                          >
                            <MapPinned className="h-4 w-4" strokeWidth={ 2 }/>
                            <span>{ uiLabels.showOnMap }</span>
                          </a>
                        ) : null }
                      </div>
                    ) : null }
                  </div>

                  { nextConnection && !isLast ? (
                    <div
                      className="mt-3 flex items-center gap-2 pl-2"
                      onMouseEnter={ () => setHoveredConnectionStopId(stopId) }
                      onMouseLeave={ () => setHoveredConnectionStopId(null) }
                    >
                      { ConnectionIcon ? (
                        <ConnectionIcon className="h-4 w-4 text-[#2b666d]" strokeWidth={ 2 }/>
                      ) : null }
                      { nextConnection.durationMinutes !== undefined ? (
                        <span className="text-xs font-medium text-[#5b4d3c]">
                          { uiLabels.travelTime }: { nextConnection.durationMinutes } min { uiLabels.transportModes[nextConnection.mode] }
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#5b4d3c]">
                          { uiLabels.transportModes[nextConnection.mode] }
                        </span>
                      ) }
                    </div>
                  ) : null }
                </div>
              </div>
            );
          }) }
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-[#d8c8b7] bg-[#ffffff] p-6">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-[#2b666d]/5"/>
          <div className="flex flex-col gap-4 text-base leading-relaxed text-[#5b4d3c]">
            { (paragraphs.length > 0 ? paragraphs : [description]).map(
              (paragraph, index) => (
                <p key={ `itinerary-description-${ index }` }>{ paragraph }</p>
              )
            ) }
          </div>
        </div>
      ) }
    </TourDetailCollapsibleSection>
  );
}

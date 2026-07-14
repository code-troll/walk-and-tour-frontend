"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import luxon3Plugin from "@fullcalendar/luxon3";
import type {DateClickArg} from "@fullcalendar/interaction";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventInput,
} from "@fullcalendar/core";
import type {ReactNode} from "react";

/**
 * Thin wrapper around FullCalendar. Imported via `next/dynamic` with `ssr: false`
 * so the library (which relies on browser-only React rendering) never executes on
 * the server during build-time prerender or request-time SSR.
 */
export default function CalendarSurface({
  events,
  timeZone,
  height = "75vh",
  onDatesSet,
  onEventClick,
  onDateClick,
  eventContent,
}: {
  events: EventInput[];
  timeZone: string;
  height?: string | number;
  onDatesSet: (arg: DatesSetArg) => void;
  onEventClick: (arg: EventClickArg) => void;
  onDateClick: (arg: DateClickArg) => void;
  eventContent: (arg: EventContentArg) => ReactNode;
}) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, luxon3Plugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridThreeDay,timeGridDay",
      }}
      views={{
        timeGridThreeDay: {
          type: "timeGrid",
          duration: {days: 3},
          buttonText: "3 day",
        },
      }}
      timeZone={timeZone}
      firstDay={1}
      nowIndicator
      height={height}
      events={events}
      datesSet={onDatesSet}
      eventClick={onEventClick}
      dateClick={onDateClick}
      eventContent={eventContent}
      eventTimeFormat={{hour: "2-digit", minute: "2-digit", hour12: false}}
    />
  );
}

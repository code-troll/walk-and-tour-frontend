import type {ApiHotelTourDetail} from "@/lib/hotel-portal/booking-types";

/**
 * Through the portal's own proxy, never the backend origin.
 *
 * The route re-checks the grant, so this URL is only useful to a hotel that was
 * granted the tour — which is why the payload carries ids and not links.
 */
export const tourImageUrl = (tourId: string, mediaId: string) =>
  `/api/internal/hotel/tours/${tourId}/media/${mediaId}`;

/**
 * What a partner needs to know about a tour, while booking it.
 *
 * A receptionist has a guest in front of them asking what the walk actually is,
 * how long it takes and whether lunch is included. Until now the booking form
 * offered a list of names, so the only way to answer was to open the public
 * site — which does not carry the partner's price and does not list a tour the
 * hotel may sell privately.
 *
 * The content is the same the public page shows, deliberately: the partner
 * should be describing the tour the guest will later read about, in the same
 * words. What it does not borrow is the public site's components. The portal is
 * "Skilt" — hierarchy from air and a rule under each heading, no cards — and a
 * partner-facing product that reuses another surface's blocks ends up looking
 * like that surface no matter what colours it is given.
 */

const Group = ({items, title}: {items: string[]; title: string}) =>
  items.length === 0 ? null : (
    <div>
      <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
        {title}
      </h4>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li className="text-sm leading-6 text-[var(--wt-ink)]" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );

const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) {
    return null;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }

  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

export function PortalTourDetail({tour}: {tour: ApiHotelTourDetail}) {
  const duration = formatDuration(tour.durationMinutes);
  const price =
    tour.priceAmount === null || tour.priceAmount === undefined
      ? "Price on request"
      : `${tour.priceAmount} ${tour.currency} per person`;

  const stops = (tour.stops ?? []).filter((stop) => stop.title || stop.description);
  const images = tour.images ?? [];

  return (
    <div className="mt-6 border-t border-[var(--wt-rule)] pt-6">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
        <p className="text-sm font-medium text-[var(--wt-ink)]">{price}</p>
        {duration ? (
          <p className="text-sm text-[var(--wt-ink-muted)]">{duration}</p>
        ) : null}
        {/*
          The portal is English-only, but a tour may not have English content.
          Saying which language this is beats presenting Italian as if it were
          the translation the reader asked for.
        */}
        {tour.locale && tour.locale !== "en" ? (
          <p className="text-sm text-[var(--wt-ink-muted)]">
            Description shown in {tour.locale.toUpperCase()}
          </p>
        ) : null}
      </div>

      {images.length > 0 ? (
        <div className="mt-5">
          {/*
            A strip rather than a hero: this sits inside a form, and a picture
            large enough to be the page would push the fields the receptionist
            came for below the fold. It scrolls, so a tour with nine photographs
            costs the same vertical space as one with two.
          */}
          <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
            {images.map((image) => (
              <li className="shrink-0" key={image.mediaId}>
                {/*
                  eslint-disable-next-line @next/next/no-img-element --
                  next/image would need the backend host in remotePatterns, and
                  these bytes come through the portal's proxy precisely so that
                  host is never named on the client.
                */}
                <img
                  alt={image.alt ?? ""}
                  className="h-32 w-48 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule)] object-cover"
                  loading="lazy"
                  src={tourImageUrl(tour.tourId, image.mediaId)}
                />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tour.about ? (
        <div className="mt-5">
          <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
            About the tour
          </h4>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--wt-ink)]">{tour.about}</p>
        </div>
      ) : null}

      {tour.highlights && tour.highlights.length > 0 ? (
        <div className="mt-5">
          <Group items={tour.highlights} title="Highlights" />
        </div>
      ) : null}

      {tour.itineraryDescription || stops.length > 0 ? (
        <div className="mt-5">
          <h4 className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
            Itinerary
          </h4>
          {tour.itineraryDescription ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--wt-ink)]">
              {tour.itineraryDescription}
            </p>
          ) : null}
          {stops.length > 0 ? (
            <ol className="mt-3 space-y-3">
              {stops.map((stop, index) => (
                <li className="flex gap-3" key={stop.stopId}>
                  <span className="w-5 shrink-0 font-mono text-xs text-[var(--wt-ink-muted)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0">
                    {stop.title ? (
                      <span className="block text-sm font-medium text-[var(--wt-ink)]">
                        {stop.title}
                        {stop.durationMinutes ? (
                          <span className="font-normal text-[var(--wt-ink-muted)]">
                            {" · "}
                            {formatDuration(stop.durationMinutes)}
                          </span>
                        ) : null}
                      </span>
                    ) : null}
                    {stop.description ? (
                      <span className="mt-0.5 block max-w-2xl text-sm leading-6 text-[var(--wt-ink-muted)]">
                        {stop.description}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : null}

      {(tour.included ?? []).length > 0 || (tour.notIncluded ?? []).length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Group items={tour.included ?? []} title="What's included" />
          <Group items={tour.notIncluded ?? []} title="What's not included" />
        </div>
      ) : null}

      {tour.cancellationType ? (
        <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--wt-ink-muted)]">
          {tour.cancellationType}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import BookingWidget from "@/components/booking-widgets/BookingWidget";
import type { TourBooking } from "@/lib/booking-widgets/providers";
import type { PublicTourPriceBasis } from "@/lib/public-tour-model";
import TourDetailSidebarFallback from "./TourDetailSidebarFallback";

type TourDetailSidebarPlaceholderProps = {
  booking?: TourBooking;
  language?: string;
  price?: string;
  priceBasis?: PublicTourPriceBasis;
  duration?: string;
  cancellationType?: string;
  requestedBookingType?: "privateTours" | "companyTours";
  requestedItemId?: string;
};

export default function TourDetailSidebarPlaceholder({
  booking,
  language,
  price,
  priceBasis,
  duration,
  cancellationType,
  requestedBookingType,
  requestedItemId,
}: TourDetailSidebarPlaceholderProps) {
  return (
    <div className="pt-6 px-0 md:px-6 lg:pt-0 lg:px-12 lg:pl-0">
      <div
        className="rounded-3xl bg-[#fcfaf7] md:bg-white p-0 md:shadow-sm ring-0 md:ring-1 md:ring-[#e8ddd2] overflow-hidden">
        <BookingWidget
          className="my-4 md:my-0"
          provider={ booking?.provider }
          productId={ booking?.productId }
          language={ language }
          fallback={ (
            <TourDetailSidebarFallback
              price={ price }
              priceBasis={ priceBasis }
              duration={ duration }
              cancellationType={ cancellationType }
              requestedBookingType={ requestedBookingType }
              requestedItemId={ requestedItemId }
            />
          ) }
        />
      </div>
    </div>
  );
}

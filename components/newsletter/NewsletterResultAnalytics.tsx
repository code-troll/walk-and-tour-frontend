"use client";

import { useEffect, useRef } from "react";
import { trackAnalyticsEvent } from "@/lib/analytics/public";

type NewsletterResultAnalyticsProps = {
  eventName: string;
  reason?: string;
};

export default function NewsletterResultAnalytics({
  eventName,
  reason,
}: NewsletterResultAnalyticsProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;

    trackAnalyticsEvent(eventName, {
      reason,
    });
  }, [eventName, reason]);

  return null;
}

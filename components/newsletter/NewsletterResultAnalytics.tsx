"use client";

import { useEffect, useRef } from "react";
import { useAnalyticsTracker } from "@/lib/analytics/use-analytics-tracker";

type NewsletterResultAnalyticsProps = {
  eventName: string;
  reason?: string;
};

export default function NewsletterResultAnalytics({
  eventName,
  reason,
}: NewsletterResultAnalyticsProps) {
  const hasTrackedRef = useRef(false);
  const track = useAnalyticsTracker();

  useEffect(() => {
    if (hasTrackedRef.current) {
      return;
    }

    hasTrackedRef.current = true;

    track(eventName, {
      reason,
    });
  }, [eventName, reason, track]);

  return null;
}

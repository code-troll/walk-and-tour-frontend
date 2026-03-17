"use client";

import {useEffect, useState} from "react";
import {useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminNoticeCard, AdminSectionCard, AdminStatCard} from "@/components/admin/AdminUi";
import {getAdminLanguagesClient, getAdminNewsletterSubscribersClient} from "@/lib/admin/admin-client";
import {formatAdminDate} from "@/lib/admin/format-date";
import type {components} from "@/lib/api/generated/backend-types";

type ApiLanguage = components["schemas"]["LanguageResponseDto"];
type ApiSubscribersResponse = components["schemas"]["NewsletterSubscriberAdminListResponseDto"];

export default function AdminNewsletterClient() {
  const [subscribers, setSubscribers] = useState<ApiSubscribersResponse | null>(null);
  const [languages, setLanguages] = useState<ApiLanguage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useAdminRouteLoadingBoundary(isLoading);

  const loadNewsletterWorkspace = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextSubscribers, nextLanguages] = await Promise.all([
        getAdminNewsletterSubscribersClient({limit: 10, page: 1}),
        getAdminLanguagesClient(),
      ]);

      setSubscribers(nextSubscribers);
      setLanguages(nextLanguages);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load newsletter data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadNewsletterWorkspace();
  }, []);

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading the newsletter workspace."
        description="Resolving the latest subscriber records."
      />
    );
  }

  if (error || !subscribers) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The newsletter workspace could not be loaded."
        description={error ?? "Unable to load newsletter data."}
        actions={
          <button
            type="button"
            onClick={() => void loadNewsletterWorkspace()}
            className="rounded-full border border-[#cbb390] px-5 py-3 text-sm font-semibold text-[#7a5424]"
          >
            Retry
          </button>
        }
      />
    );
  }

  const totals = {
    total: subscribers.total,
    subscribed: subscribers.items.filter((item) => item.subscriptionStatus === "subscribed").length,
    pending: subscribers.items.filter((item) => item.subscriptionStatus === "pending_confirmation").length,
  };
  const languageNameByCode = Object.fromEntries(
    languages.map((language) => [language.code, language.name]),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Listed records" value={subscribers.items.length}/>
        <AdminStatCard label="Subscribed" value={totals.subscribed}/>
        <AdminStatCard label="Pending" value={totals.pending}/>
      </section>

      <AdminSectionCard
        title="Newsletter subscribers"
        description={`Showing the first ${subscribers.items.length} records from the backend admin newsletter endpoint. The internal BFF also supports CSV passthrough at /api/internal/admin/newsletter/subscribers/export.`}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b border-border">
                <th className="py-3 pr-4 font-semibold">Email</th>
                <th className="py-3 pr-4 font-semibold">Status</th>
                <th className="py-3 pr-4 font-semibold">Locale</th>
                <th className="py-3 pr-4 font-semibold">Confirmed</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.items.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-border/50 text-foreground">
                  <td className="py-4 pr-4">{subscriber.email}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                      subscriber.subscriptionStatus === "subscribed"
                        ? "bg-primary/10 text-primary"
                        : subscriber.subscriptionStatus === "pending_confirmation"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-destructive/10 text-destructive"
                    }`}>
                      {subscriber.subscriptionStatus}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-muted-foreground">
                    {typeof subscriber.preferredLocale === "string"
                      ? languageNameByCode[subscriber.preferredLocale] ?? subscriber.preferredLocale
                      : "N/A"}
                  </td>
                  <td className="py-4 pr-4 text-muted-foreground">
                    {subscriber.confirmedAt ? formatAdminDate(subscriber.confirmedAt) : "Not confirmed"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Total matching subscribers: <strong className="text-foreground">{subscribers.total}</strong>
        </p>
      </AdminSectionCard>
    </div>
  );
}

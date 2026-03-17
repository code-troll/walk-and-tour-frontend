import { AdminNoticeCard, AdminSectionCard, AdminStatCard } from "@/components/admin/AdminUi";
import { createAdminApi } from "@/lib/api/admin";
import { isBackendApiError } from "@/lib/api/core/backend-client";
import { formatAdminDate } from "@/lib/admin/format-date";
import { getAdminViewerState } from "@/lib/admin/session";

const loadNewsletterData = async (accessToken: string) => {
  try {
    const adminApi = createAdminApi(accessToken);
    const [subscribers, languages] = await Promise.all([
      adminApi.getNewsletterSubscribers({
        limit: 10,
        page: 1,
      }),
      adminApi.getLanguages(),
    ]);

    return {
      subscribers,
      languages,
    };
  } catch (error) {
    return {
      errorMessage:
        isBackendApiError(error) || error instanceof Error
          ? error.message
          : "Unable to load newsletter data.",
    };
  }
};

export default async function AdminNewsletterPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "editor") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Newsletter operations are not available for the editor role."
        description="The backend grants newsletter access only to super admins and marketing admins."
      />
    );
  }

  const newsletterData = await loadNewsletterData(viewerState.accessToken);

  if ("errorMessage" in newsletterData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The newsletter workspace could not be loaded."
        description={ newsletterData.errorMessage ?? "Unable to load newsletter data." }
      />
    );
  }

  const totals = {
    total: newsletterData.subscribers.total,
    subscribed: newsletterData.subscribers.items.filter(
      (item) => item.subscriptionStatus === "subscribed",
    ).length,
    pending: newsletterData.subscribers.items.filter(
      (item) => item.subscriptionStatus === "pending_confirmation",
    ).length,
  };
  const languageNameByCode = Object.fromEntries(
    newsletterData.languages.map((language) => [language.code, language.name]),
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <AdminStatCard label="Listed records" value={ newsletterData.subscribers.items.length }/>
        <AdminStatCard label="Subscribed" value={ totals.subscribed }/>
        <AdminStatCard label="Pending" value={ totals.pending }/>
      </section>

      <AdminSectionCard
        title="Newsletter subscribers"
        description={ `Showing the first ${ newsletterData.subscribers.items.length } records from the backend admin newsletter endpoint. The internal BFF also supports CSV passthrough at /api/internal/admin/newsletter/subscribers/export.` }
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
            { newsletterData.subscribers.items.map((subscriber) => (
              <tr key={ subscriber.id } className="border-b border-border/50 text-foreground">
                <td className="py-4 pr-4">{ subscriber.email }</td>
                <td className="py-4 pr-4">
                    <span className={ `rounded-lg px-2 py-1 text-xs font-semibold ${
                      subscriber.subscriptionStatus === "subscribed"
                        ? "bg-primary/10 text-primary"
                        : subscriber.subscriptionStatus === "pending_confirmation"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-destructive/10 text-destructive"
                    }` }>
                      { subscriber.subscriptionStatus }
                    </span>
                </td>
                <td className="py-4 pr-4 text-muted-foreground">
                  {
                    typeof subscriber.preferredLocale === "string"
                      ? languageNameByCode[subscriber.preferredLocale] ?? subscriber.preferredLocale
                      : "N/A"
                  }
                </td>
                <td className="py-4 pr-4 text-muted-foreground">
                  { subscriber.confirmedAt ? formatAdminDate(subscriber.confirmedAt) : "Not confirmed" }
                </td>
              </tr>
            )) }
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Total matching subscribers: <strong className="text-foreground">{ newsletterData.subscribers.total }</strong>
        </p>
      </AdminSectionCard>
    </div>
  );
}

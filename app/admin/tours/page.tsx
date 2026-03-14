import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { AdminNoticeCard, AdminSectionCard } from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { getAdminViewerState } from "@/lib/admin/session";
import { loadToursListData } from "./loaders";

export default async function AdminToursPage() {
  const viewerState = await getAdminViewerState();

  if (viewerState.kind !== "authenticated") {
    return null;
  }

  if (viewerState.backendAdmin.roleName === "marketing") {
    return (
      <AdminNoticeCard
        eyebrow="Permissions"
        title="Tour administration is not available for the marketing role."
        description="Tours are restricted to super admins and editors by the backend role matrix."
      />
    );
  }

  const toursData = await loadToursListData(viewerState.accessToken);

  if ("errorMessage" in toursData) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="The tours workspace could not be loaded."
        description={toursData.errorMessage ?? "Unable to load tours."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminSectionCard
        title="Tours"
        description="Create, edit, and validate the shared tour data, localized translations, and itinerary structure from one place."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Translation availability comes directly from the backend and reflects schema validity,
            required lists, and missing stop translations per locale.
          </p>
          <Button asChild>
            <Link href="/tours/new">
              <Plus className="size-4" />
              Create Tour
            </Link>
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {toursData.tours.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">
              <p>No tours have been created yet.</p>
              <Button asChild className="mt-4">
                <Link href="/tours/new">
                  <Plus className="size-4" />
                  Create your first tour
                </Link>
              </Button>
            </div>
          ) : (
            toursData.tours.map((tour) => (
              <article
                key={tour.id}
                className="rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{tour.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <span className="font-medium">{tour.slug}</span>
                      {" • "}
                      {tour.tourType}
                      {" • "}
                      {typeof tour.durationMinutes === "number"
                        ? `${tour.durationMinutes} minutes`
                        : "Duration not set"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {
                        tour.translationAvailability.filter((item) => item.publiclyAvailable).length
                      }{" "}
                      public locales
                    </span>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/tours/${tour.id}`}>
                        <Pencil className="size-4" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {tour.translationAvailability.map((availability) => (
                    <span
                      key={availability.languageCode}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground"
                    >
                      {availability.languageCode}: {availability.isReady ? "Ready" : "Not ready"}/
                      {availability.isPublished ? "Published" : "Not published"}
                    </span>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </AdminSectionCard>
    </div>
  );
}
